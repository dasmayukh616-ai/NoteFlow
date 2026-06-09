use std::fmt;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration as StdDuration;

use argon2::Argon2;
use argon2::password_hash::rand_core::{OsRng, RngCore};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use axum::extract::{Path, Query, State};
use axum::http::header::{AUTHORIZATION, CONTENT_TYPE, COOKIE, SET_COOKIE};
use axum::http::{HeaderMap, HeaderValue, Method, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use noteflow_types::{
    AIMessage, CalendarEvent, CalendarIntegration, CreatePageRequest, DeletePageResponse,
    LoginRequest, LogoutResponse, Page, RegisterRequest, UpdatePageCalendarRequest,
    UpdatePageRequest, UsageStats, User, Workspace,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use sqlx::postgres::PgPoolOptions;
use sqlx::{PgPool, Postgres, Transaction};
use thiserror::Error;
use time::format_description::well_known::Rfc3339;
use time::{Duration, OffsetDateTime};
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use uuid::Uuid;

const SESSION_COOKIE: &str = "noteflow_session";
const DEFAULT_SESSION_DAYS: i64 = 30;
const PAGE_SEARCH_LIMIT: i64 = 30;
const AI_CONTEXT_LIMIT: i64 = 5;

const DEFAULT_GROQ_BASE_URL: &str = "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL: &str = "llama-3.3-70b-versatile";

#[derive(Clone)]
pub struct ApiConfig {
    pub bind_addr: SocketAddr,
    pub database_url: String,
    pub cookie_secure: bool,
    pub session_days: i64,
    pub groq_api_key: Option<String>,
    pub groq_model: String,
    pub groq_api_base_url: String,
}

impl fmt::Debug for ApiConfig {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("ApiConfig")
            .field("bind_addr", &self.bind_addr)
            .field("database_url", &self.database_url)
            .field("cookie_secure", &self.cookie_secure)
            .field("session_days", &self.session_days)
            .field("groq_api_key_present", &self.groq_api_key.is_some())
            .field("groq_model", &self.groq_model)
            .field("groq_api_base_url", &self.groq_api_base_url)
            .finish()
    }
}

impl ApiConfig {
    pub fn from_env() -> Result<Self, ConfigError> {
        load_local_env();

        let bind_addr = std::env::var("NOTEFLOW_API_BIND")
            .unwrap_or_else(|_| "127.0.0.1:3317".to_string())
            .parse()
            .map_err(|source| ConfigError::InvalidBindAddress { source })?;

        let database_url = std::env::var("NOTEFLOW_DATABASE_URL")
            .or_else(|_| std::env::var("DATABASE_URL"))
            .map_err(|_| ConfigError::MissingDatabaseUrl)?;

        let cookie_secure = std::env::var("NOTEFLOW_COOKIE_SECURE")
            .map(|value| value == "1" || value.eq_ignore_ascii_case("true"))
            .unwrap_or(false);

        let session_days = std::env::var("NOTEFLOW_SESSION_DAYS")
            .ok()
            .and_then(|value| value.parse::<i64>().ok())
            .filter(|days| *days > 0)
            .unwrap_or(DEFAULT_SESSION_DAYS);

        let groq_api_key = std::env::var("GROQ_API_KEY")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());

        let groq_model = std::env::var("GROQ_MODEL")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| DEFAULT_GROQ_MODEL.to_string());

        let groq_api_base_url = std::env::var("GROQ_API_BASE_URL")
            .ok()
            .map(|value| value.trim().trim_end_matches('/').to_string())
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| DEFAULT_GROQ_BASE_URL.to_string());

        Ok(Self {
            bind_addr,
            database_url,
            cookie_secure,
            session_days,
            groq_api_key,
            groq_model,
            groq_api_base_url,
        })
    }
}

fn load_local_env() {
    let _ = dotenvy::from_filename(".env.local");
    let _ = dotenvy::dotenv();
}

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("NOTEFLOW_DATABASE_URL or DATABASE_URL must be set")]
    MissingDatabaseUrl,
    #[error("invalid NOTEFLOW_API_BIND value")]
    InvalidBindAddress {
        #[source]
        source: std::net::AddrParseError,
    },
}

#[derive(Debug, Error)]
pub enum BootError {
    #[error("database connection failed: {0}")]
    Database(#[from] sqlx::Error),
    #[error("database migration failed: {0}")]
    Migration(#[from] sqlx::migrate::MigrateError),
    #[error("failed to bind API listener: {0}")]
    Bind(#[source] std::io::Error),
    #[error("API server failed: {0}")]
    Server(#[source] std::io::Error),
}

#[derive(Debug, Clone)]
pub struct AppState {
    pool: PgPool,
    config: Arc<ApiConfig>,
    http_client: reqwest::Client,
}

impl AppState {
    pub fn new(pool: PgPool, config: ApiConfig) -> Self {
        Self {
            pool,
            config: Arc::new(config),
            http_client: reqwest::Client::builder()
                .timeout(StdDuration::from_secs(30))
                .build()
                .expect("HTTP client configuration should be valid"),
        }
    }
}

pub async fn serve(config: ApiConfig) -> Result<(), BootError> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    let bind_addr = config.bind_addr;
    let app = router(AppState::new(pool, config));
    let listener = tokio::net::TcpListener::bind(bind_addr)
        .await
        .map_err(BootError::Bind)?;

    tracing::info!("NoteFlow Rust API listening on http://{bind_addr}");
    axum::serve(listener, app)
        .await
        .map_err(BootError::Server)?;

    Ok(())
}

pub fn router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(|origin, _| {
            is_allowed_app_origin(origin.as_bytes())
        }))
        .allow_credentials(true)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([CONTENT_TYPE, AUTHORIZATION]);

    Router::new()
        .route("/api/v1/health", get(health))
        .route("/api/v1/auth/register", post(register))
        .route("/api/v1/auth/login", post(login))
        .route("/api/v1/auth/logout", post(logout))
        .route("/api/v1/auth/me", get(me))
        .route("/api/v1/workspaces", get(list_workspaces))
        .route("/api/v1/pages", get(list_pages).post(create_page))
        .route("/api/v1/pages/search", get(search_pages))
        .route(
            "/api/v1/pages/{page_id}/calendar",
            patch(update_page_calendar),
        )
        .route(
            "/api/v1/pages/{page_id}",
            get(get_page).patch(update_page).delete(delete_page),
        )
        .route(
            "/api/v1/calendar/integration",
            get(calendar_integration_status),
        )
        .route("/api/v1/calendar/events", get(list_calendar_events))
        .route("/api/v1/ai/messages", post(send_ai_message))
        .route("/api/v1/usage", get(usage_stats))
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}

fn is_allowed_app_origin(origin: &[u8]) -> bool {
    origin.starts_with(b"http://localhost:")
        || origin.starts_with(b"http://127.0.0.1:")
        || origin == b"http://tauri.localhost"
        || origin == b"https://tauri.localhost"
        || origin.starts_with(b"tauri://")
}

async fn health() -> Json<SuccessEnvelope<HealthResponse>> {
    ok(HealthResponse {
        service: "noteflow-api",
        status: "ok",
    })
}

async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Response, ApiError> {
    let email = normalize_email(&payload.email)?;
    let password_hash = hash_password(&payload.password)?;
    let name = clean_optional_text(payload.name);
    let user_id = Uuid::new_v4();
    let workspace_id = Uuid::new_v4();

    let mut tx = state.pool.begin().await?;
    let insert_user = sqlx::query(
        r#"
        INSERT INTO users (id, email, password_hash, name)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(user_id)
    .bind(&email)
    .bind(&password_hash)
    .bind(&name)
    .execute(&mut *tx)
    .await;

    if let Err(error) = insert_user {
        if is_unique_violation(&error) {
            return Err(ApiError::validation(
                "An account with that email already exists.",
            ));
        }
        return Err(error.into());
    }

    sqlx::query(
        r#"
        INSERT INTO workspaces (id, owner_id, name)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(workspace_id)
    .bind(user_id)
    .bind("My workspace")
    .execute(&mut *tx)
    .await?;

    let (token, expires_at) = create_session(&state, &mut tx, user_id).await?;
    tx.commit().await?;

    let user = User {
        id: user_id.to_string(),
        email: Some(email),
        name,
        image_url: None,
    };

    Ok(session_response(user, &token, expires_at, &state.config))
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Response, ApiError> {
    let email = normalize_email(&payload.email)?;
    let row = sqlx::query_as::<_, UserAuthRow>(
        r#"
        SELECT id, email, password_hash, name, image_url
        FROM users
        WHERE email = $1
        "#,
    )
    .bind(&email)
    .fetch_optional(&state.pool)
    .await?;

    let Some(row) = row else {
        return Err(ApiError::unauthenticated("Invalid email or password."));
    };

    if !verify_password(&payload.password, &row.password_hash) {
        return Err(ApiError::unauthenticated("Invalid email or password."));
    }

    let mut tx = state.pool.begin().await?;
    let (token, expires_at) = create_session(&state, &mut tx, row.id).await?;
    tx.commit().await?;

    Ok(session_response(
        row.into_user(),
        &token,
        expires_at,
        &state.config,
    ))
}

async fn logout(State(state): State<AppState>, headers: HeaderMap) -> Result<Response, ApiError> {
    if let Some(token) = session_token_from_headers(&headers) {
        let token_hash = hash_session_token(&token);
        sqlx::query(
            r#"
            UPDATE sessions
            SET revoked_at = now()
            WHERE token_hash = $1 AND revoked_at IS NULL
            "#,
        )
        .bind(token_hash)
        .execute(&state.pool)
        .await?;
    }

    let mut response = ok(LogoutResponse { signed_out: true }).into_response();
    attach_cookie(&mut response, clear_cookie(&state.config))?;
    Ok(response)
}

async fn me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<SuccessEnvelope<User>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    Ok(ok(user))
}

async fn list_workspaces(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<SuccessEnvelope<Vec<Workspace>>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let rows = sqlx::query_as::<_, WorkspaceRow>(
        r#"
        SELECT id, name
        FROM workspaces
        WHERE owner_id = $1
        ORDER BY created_at ASC
        "#,
    )
    .bind(user_id)
    .fetch_all(&state.pool)
    .await?;

    Ok(ok(rows
        .into_iter()
        .map(WorkspaceRow::into_workspace)
        .collect()))
}

async fn list_pages(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<SuccessEnvelope<Vec<Page>>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let rows = sqlx::query_as::<_, PageRow>(
        r#"
        SELECT
          pages.id,
          pages.workspace_id,
          pages.title,
          pages.icon,
          pages.cover,
          pages.content,
          pages.is_favorite,
          pages.is_archived,
          pages.calendar_sync_enabled,
          pages.calendar_event_id,
          pages.created_at,
          pages.updated_at
        FROM pages
        INNER JOIN workspaces ON workspaces.id = pages.workspace_id
        WHERE workspaces.owner_id = $1
        ORDER BY pages.is_favorite DESC, pages.updated_at DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(&state.pool)
    .await?;

    Ok(ok(rows.into_iter().map(PageRow::into_page).collect()))
}

async fn search_pages(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<PageSearchQuery>,
) -> Result<Json<SuccessEnvelope<Vec<Page>>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let rows = search_pages_for_owner(&state.pool, user_id, &query.q, PAGE_SEARCH_LIMIT).await?;

    Ok(ok(rows.into_iter().map(PageRow::into_page).collect()))
}

async fn create_page(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreatePageRequest>,
) -> Result<Json<SuccessEnvelope<Page>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let workspace_id = parse_uuid(&payload.workspace_id)?;
    let page_id = Uuid::new_v4();
    let title = clean_page_title(payload.title);
    let content = payload.content.or_else(|| Some(empty_editor_doc()));
    let icon = clean_optional_text(payload.icon).or_else(|| Some("▣".to_string()));
    let cover = clean_optional_text(payload.cover);

    let row = sqlx::query_as::<_, PageRow>(
        r#"
        INSERT INTO pages (id, workspace_id, title, icon, cover, content)
        SELECT $1, workspaces.id, $3, $4, $5, $6
        FROM workspaces
        WHERE workspaces.id = $2 AND workspaces.owner_id = $7
        RETURNING
          id,
          workspace_id,
          title,
          icon,
          cover,
          content,
          is_favorite,
          is_archived,
          calendar_sync_enabled,
          calendar_event_id,
          created_at,
          updated_at
        "#,
    )
    .bind(page_id)
    .bind(workspace_id)
    .bind(title)
    .bind(icon)
    .bind(cover)
    .bind(content)
    .bind(user_id)
    .fetch_optional(&state.pool)
    .await?;

    row.map(|row| ok(row.into_page()))
        .ok_or_else(|| ApiError::not_found("Workspace not found."))
}

async fn get_page(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(page_id): Path<String>,
) -> Result<Json<SuccessEnvelope<Page>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let page_id = parse_uuid(&page_id)?;

    let row = page_for_owner(&state.pool, page_id, user_id).await?;

    row.map(|row| ok(row.into_page()))
        .ok_or_else(|| ApiError::not_found("Page not found."))
}

async fn update_page(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(page_id): Path<String>,
    Json(payload): Json<UpdatePageRequest>,
) -> Result<Json<SuccessEnvelope<Page>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let page_id = parse_uuid(&page_id)?;
    let title = payload.title.map(|title| clean_page_title(Some(title)));

    let row = sqlx::query_as::<_, PageRow>(
        r#"
        UPDATE pages
        SET
          title = COALESCE($3, pages.title),
          content = COALESCE($4, pages.content),
          updated_at = now()
        FROM workspaces
        WHERE pages.id = $1
          AND pages.workspace_id = workspaces.id
          AND workspaces.owner_id = $2
        RETURNING
          pages.id,
          pages.workspace_id,
          pages.title,
          pages.icon,
          pages.cover,
          pages.content,
          pages.is_favorite,
          pages.is_archived,
          pages.calendar_sync_enabled,
          pages.calendar_event_id,
          pages.created_at,
          pages.updated_at
        "#,
    )
    .bind(page_id)
    .bind(user_id)
    .bind(title)
    .bind(payload.content)
    .fetch_optional(&state.pool)
    .await?;

    row.map(|row| ok(row.into_page()))
        .ok_or_else(|| ApiError::not_found("Page not found."))
}

async fn update_page_calendar(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(page_id): Path<String>,
    Json(payload): Json<UpdatePageCalendarRequest>,
) -> Result<Json<SuccessEnvelope<Page>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let page_id = parse_uuid(&page_id)?;
    let calendar_event_id = if payload.calendar_sync_enabled {
        Some(clean_calendar_event_id(payload.calendar_event_id, page_id))
    } else {
        None
    };

    let row = sqlx::query_as::<_, PageRow>(
        r#"
        UPDATE pages
        SET
          calendar_sync_enabled = $3,
          calendar_event_id = $4,
          updated_at = now()
        FROM workspaces
        WHERE pages.id = $1
          AND pages.workspace_id = workspaces.id
          AND workspaces.owner_id = $2
        RETURNING
          pages.id,
          pages.workspace_id,
          pages.title,
          pages.icon,
          pages.cover,
          pages.content,
          pages.is_favorite,
          pages.is_archived,
          pages.calendar_sync_enabled,
          pages.calendar_event_id,
          pages.created_at,
          pages.updated_at
        "#,
    )
    .bind(page_id)
    .bind(user_id)
    .bind(payload.calendar_sync_enabled)
    .bind(calendar_event_id)
    .fetch_optional(&state.pool)
    .await?;

    row.map(|row| ok(row.into_page()))
        .ok_or_else(|| ApiError::not_found("Page not found."))
}

async fn delete_page(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(page_id): Path<String>,
) -> Result<Json<SuccessEnvelope<DeletePageResponse>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let page_id = parse_uuid(&page_id)?;

    let deleted = sqlx::query_scalar::<_, Uuid>(
        r#"
        DELETE FROM pages
        USING workspaces
        WHERE pages.id = $1
          AND pages.workspace_id = workspaces.id
          AND workspaces.owner_id = $2
        RETURNING pages.id
        "#,
    )
    .bind(page_id)
    .bind(user_id)
    .fetch_optional(&state.pool)
    .await?;

    if deleted.is_none() {
        return Err(ApiError::not_found("Page not found."));
    }

    Ok(ok(DeletePageResponse { deleted: true }))
}

async fn calendar_integration_status(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<SuccessEnvelope<CalendarIntegration>>, ApiError> {
    authenticate(&state, &headers).await?;

    Ok(ok(CalendarIntegration {
        provider: "noteflow-postgres".to_string(),
        connected: true,
    }))
}

async fn list_calendar_events(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<SuccessEnvelope<Vec<CalendarEvent>>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let rows = sqlx::query_as::<_, PageRow>(
        r#"
        SELECT
          pages.id,
          pages.workspace_id,
          pages.title,
          pages.icon,
          pages.cover,
          pages.content,
          pages.is_favorite,
          pages.is_archived,
          pages.calendar_sync_enabled,
          pages.calendar_event_id,
          pages.created_at,
          pages.updated_at
        FROM pages
        INNER JOIN workspaces ON workspaces.id = pages.workspace_id
        WHERE workspaces.owner_id = $1
          AND pages.is_archived = false
          AND pages.calendar_sync_enabled = true
        ORDER BY pages.updated_at DESC
        LIMIT 20
        "#,
    )
    .bind(user_id)
    .fetch_all(&state.pool)
    .await?;

    Ok(ok(rows.into_iter().map(calendar_event_from_page).collect()))
}

async fn send_ai_message(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<AiMessageRequest>,
) -> Result<Json<SuccessEnvelope<AIMessage>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let prompt = clean_ai_prompt(payload.prompt)?;
    let page_count = count_pages_for_owner(&state.pool, user_id).await?;
    let matches = search_pages_for_owner(&state.pool, user_id, &prompt, AI_CONTEXT_LIMIT).await?;
    let content = match groq_ai_response(&state, &prompt, page_count, &matches).await {
        Ok(Some(content)) => content,
        Ok(None) => ai_response_from_pages(&prompt, page_count, &matches),
        Err(error) => {
            tracing::warn!(?error, "Groq AI request failed");
            return Err(ApiError::upstream("Groq AI request failed."));
        }
    };

    Ok(ok(AIMessage {
        role: "assistant".to_string(),
        content,
    }))
}

async fn usage_stats(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<SuccessEnvelope<UsageStats>>, ApiError> {
    let user = authenticate(&state, &headers).await?;
    let user_id = parse_uuid(&user.id)?;
    let page_count = count_pages_for_owner(&state.pool, user_id).await?;

    Ok(ok(UsageStats {
        period: Some("workspace-total".to_string()),
        requests: Some(page_count as u64),
        tokens_used: None,
        limit: None,
        rpm: None,
    }))
}

async fn authenticate(state: &AppState, headers: &HeaderMap) -> Result<User, ApiError> {
    let Some(token) = session_token_from_headers(headers) else {
        return Err(ApiError::unauthenticated("You must be signed in."));
    };

    let token_hash = hash_session_token(&token);
    let row = sqlx::query_as::<_, UserSessionRow>(
        r#"
        SELECT users.id, users.email, users.name, users.image_url
        FROM sessions
        INNER JOIN users ON users.id = sessions.user_id
        WHERE sessions.token_hash = $1
          AND sessions.revoked_at IS NULL
          AND sessions.expires_at > now()
        "#,
    )
    .bind(token_hash)
    .fetch_optional(&state.pool)
    .await?;

    row.map(UserSessionRow::into_user)
        .ok_or_else(|| ApiError::unauthenticated("You must be signed in."))
}

async fn create_session(
    state: &AppState,
    tx: &mut Transaction<'_, Postgres>,
    user_id: Uuid,
) -> Result<(String, OffsetDateTime), ApiError> {
    let token = generate_session_token();
    let token_hash = hash_session_token(&token);
    let expires_at = OffsetDateTime::now_utc() + Duration::days(state.config.session_days);

    sqlx::query(
        r#"
        INSERT INTO sessions (id, user_id, token_hash, expires_at)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(user_id)
    .bind(token_hash)
    .bind(expires_at)
    .execute(&mut **tx)
    .await?;

    Ok((token, expires_at))
}

fn session_response(
    user: User,
    token: &str,
    expires_at: OffsetDateTime,
    config: &ApiConfig,
) -> Response {
    let mut response = ok(user).into_response();
    attach_cookie(&mut response, session_cookie(token, expires_at, config))
        .expect("session cookie value should be valid");
    response
}

fn attach_cookie(response: &mut Response, value: String) -> Result<(), ApiError> {
    let header = HeaderValue::from_str(&value)
        .map_err(|_| ApiError::unknown("Failed to set session cookie."))?;
    response.headers_mut().append(SET_COOKIE, header);
    Ok(())
}

fn session_cookie(token: &str, expires_at: OffsetDateTime, config: &ApiConfig) -> String {
    let max_age = (expires_at - OffsetDateTime::now_utc())
        .whole_seconds()
        .max(0);
    let secure = if config.cookie_secure { "; Secure" } else { "" };
    format!("{SESSION_COOKIE}={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age={max_age}{secure}")
}

fn clear_cookie(config: &ApiConfig) -> String {
    let secure = if config.cookie_secure { "; Secure" } else { "" };
    format!("{SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0{secure}")
}

fn normalize_email(email: &str) -> Result<String, ApiError> {
    let email = email.trim().to_ascii_lowercase();
    let has_single_at = email.matches('@').count() == 1;
    if email.len() > 254 || !has_single_at || email.starts_with('@') || email.ends_with('@') {
        return Err(ApiError::validation("Enter a valid email address."));
    }
    Ok(email)
}

fn clean_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let trimmed = value.trim();
        (!trimmed.is_empty()).then(|| trimmed.to_string())
    })
}

fn clean_page_title(value: Option<String>) -> String {
    value
        .as_deref()
        .map(str::trim)
        .filter(|title| !title.is_empty())
        .unwrap_or("Untitled")
        .chars()
        .take(200)
        .collect()
}

fn clean_search_query(value: &str) -> String {
    value.trim().chars().take(120).collect()
}

fn clean_ai_prompt(value: String) -> Result<String, ApiError> {
    let prompt: String = value.trim().chars().take(1_000).collect();
    if prompt.is_empty() {
        return Err(ApiError::validation("Prompt cannot be empty."));
    }

    Ok(prompt)
}

fn clean_calendar_event_id(value: Option<String>, page_id: Uuid) -> String {
    value
        .and_then(|value| {
            let trimmed = value.trim();
            (!trimmed.is_empty()).then(|| trimmed.chars().take(200).collect())
        })
        .unwrap_or_else(|| format!("noteflow-page-{page_id}"))
}

fn empty_editor_doc() -> Value {
    serde_json::json!({
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": []
            }
        ]
    })
}

async fn search_pages_for_owner(
    pool: &PgPool,
    user_id: Uuid,
    query: &str,
    limit: i64,
) -> Result<Vec<PageRow>, ApiError> {
    let query = clean_search_query(query);
    let pattern = format!("%{query}%");

    Ok(sqlx::query_as::<_, PageRow>(
        r#"
        SELECT
          pages.id,
          pages.workspace_id,
          pages.title,
          pages.icon,
          pages.cover,
          pages.content,
          pages.is_favorite,
          pages.is_archived,
          pages.calendar_sync_enabled,
          pages.calendar_event_id,
          pages.created_at,
          pages.updated_at
        FROM pages
        INNER JOIN workspaces ON workspaces.id = pages.workspace_id
        WHERE workspaces.owner_id = $1
          AND pages.is_archived = false
          AND (
            $2 = ''
            OR pages.title ILIKE $3
            OR COALESCE(pages.content::text, '') ILIKE $3
          )
        ORDER BY
          CASE WHEN $2 <> '' AND pages.title ILIKE $3 THEN 0 ELSE 1 END,
          pages.is_favorite DESC,
          pages.updated_at DESC
        LIMIT $4
        "#,
    )
    .bind(user_id)
    .bind(query)
    .bind(pattern)
    .bind(limit)
    .fetch_all(pool)
    .await?)
}

async fn page_for_owner(
    pool: &PgPool,
    page_id: Uuid,
    user_id: Uuid,
) -> Result<Option<PageRow>, ApiError> {
    Ok(sqlx::query_as::<_, PageRow>(
        r#"
        SELECT
          pages.id,
          pages.workspace_id,
          pages.title,
          pages.icon,
          pages.cover,
          pages.content,
          pages.is_favorite,
          pages.is_archived,
          pages.calendar_sync_enabled,
          pages.calendar_event_id,
          pages.created_at,
          pages.updated_at
        FROM pages
        INNER JOIN workspaces ON workspaces.id = pages.workspace_id
        WHERE pages.id = $1 AND workspaces.owner_id = $2
        "#,
    )
    .bind(page_id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?)
}

async fn count_pages_for_owner(pool: &PgPool, user_id: Uuid) -> Result<i64, ApiError> {
    Ok(sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM pages
        INNER JOIN workspaces ON workspaces.id = pages.workspace_id
        WHERE workspaces.owner_id = $1
          AND pages.is_archived = false
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?)
}

fn calendar_event_from_page(page: PageRow) -> CalendarEvent {
    CalendarEvent {
        id: page
            .calendar_event_id
            .unwrap_or_else(|| page.id.to_string()),
        title: page.title,
        start_iso: timestamp_iso(page.updated_at),
        end_iso: None,
    }
}

fn timestamp_iso(value: OffsetDateTime) -> String {
    value
        .format(&Rfc3339)
        .unwrap_or_else(|_| value.unix_timestamp().to_string())
}

fn ai_response_from_pages(prompt: &str, page_count: i64, matches: &[PageRow]) -> String {
    if matches.is_empty() {
        return format!(
            "I searched {page_count} Postgres page(s) for \"{prompt}\" and did not find a matching note yet. Create or edit a page, then search again from the command palette."
        );
    }

    let titles = matches
        .iter()
        .map(|page| format!("- {}", page.title))
        .collect::<Vec<_>>()
        .join("\n");

    format!(
        "I searched {page_count} Postgres page(s) for \"{prompt}\".\n\nMost relevant pages:\n{titles}\n\nOpen one from Search to continue editing against the Rust API."
    )
}

async fn groq_ai_response(
    state: &AppState,
    prompt: &str,
    page_count: i64,
    matches: &[PageRow],
) -> Result<Option<String>, GroqClientError> {
    let Some(api_key) = state.config.groq_api_key.as_deref() else {
        return Ok(None);
    };

    let url = format!(
        "{}/chat/completions",
        state.config.groq_api_base_url.trim_end_matches('/')
    );
    let request = groq_chat_request(&state.config.groq_model, prompt, page_count, matches);
    let response = state
        .http_client
        .post(url)
        .bearer_auth(api_key)
        .json(&request)
        .send()
        .await
        .map_err(GroqClientError::Http)?;
    let status = response.status();
    let body = response.text().await.map_err(GroqClientError::Http)?;

    if !status.is_success() {
        return Err(GroqClientError::Api {
            status: status.as_u16(),
            body: body.chars().take(500).collect(),
        });
    }

    let response: GroqChatResponse =
        serde_json::from_str(&body).map_err(GroqClientError::Decode)?;
    let content = response
        .choices
        .into_iter()
        .find_map(|choice| choice.message.content)
        .map(|content| content.trim().to_string())
        .filter(|content| !content.is_empty())
        .ok_or(GroqClientError::MissingContent)?;

    Ok(Some(content))
}

fn groq_chat_request(
    model: &str,
    prompt: &str,
    page_count: i64,
    matches: &[PageRow],
) -> GroqChatRequest {
    GroqChatRequest {
        model: model.to_string(),
        messages: vec![
            GroqChatMessage {
                role: "system",
                content: "You are NoteFlow AI, a concise assistant inside a notes app. Answer using the provided Postgres page context. If the context is missing or weak, say what is missing instead of inventing facts.".to_string(),
            },
            GroqChatMessage {
                role: "user",
                content: format!(
                    "User prompt:\n{prompt}\n\nWorkspace page count: {page_count}\n\nRelevant Postgres pages:\n{}",
                    page_context_from_pages(matches)
                ),
            },
        ],
        temperature: 0.2,
        max_completion_tokens: 700,
    }
}

fn page_context_from_pages(matches: &[PageRow]) -> String {
    if matches.is_empty() {
        return "No matching pages were found for this prompt.".to_string();
    }

    matches
        .iter()
        .enumerate()
        .map(|(index, page)| {
            format!(
                "Page {}\nTitle: {}\nBody excerpt: {}\nCalendar linked: {}",
                index + 1,
                page.title,
                page_body_excerpt(page.content.as_ref(), 900),
                page.calendar_sync_enabled
            )
        })
        .collect::<Vec<_>>()
        .join("\n\n")
}

fn page_body_excerpt(content: Option<&Value>, max_chars: usize) -> String {
    let text = content.map(readable_text_from_json).unwrap_or_default();
    let normalized = text.split_whitespace().collect::<Vec<_>>().join(" ");
    let excerpt = normalized.chars().take(max_chars).collect::<String>();

    if excerpt.is_empty() {
        "No body text.".to_string()
    } else {
        excerpt
    }
}

fn readable_text_from_json(value: &Value) -> String {
    let mut text = String::new();
    collect_json_text(value, &mut text);
    text
}

fn collect_json_text(value: &Value, text: &mut String) {
    if let Some(raw) = value.get("text").and_then(Value::as_str) {
        text.push_str(raw);
        text.push(' ');
    }

    if let Some(children) = value.get("content").and_then(Value::as_array) {
        for child in children {
            collect_json_text(child, text);
        }
    }
}

pub fn hash_password(password: &str) -> Result<String, ApiError> {
    if password.len() < 8 {
        return Err(ApiError::validation(
            "Password must be at least 8 characters.",
        ));
    }

    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|_| ApiError::unknown("Failed to hash password."))
}

pub fn verify_password(password: &str, password_hash: &str) -> bool {
    let Ok(parsed_hash) = PasswordHash::new(password_hash) else {
        return false;
    };

    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok()
}

pub fn generate_session_token() -> String {
    let mut bytes = [0_u8; 32];
    OsRng.fill_bytes(&mut bytes);
    hex::encode(bytes)
}

pub fn hash_session_token(token: &str) -> String {
    hex::encode(Sha256::digest(token.as_bytes()))
}

pub fn cookie_value(cookie_header: &str, name: &str) -> Option<String> {
    cookie_header.split(';').find_map(|part| {
        let (key, value) = part.trim().split_once('=')?;
        (key == name).then(|| value.to_string())
    })
}

fn session_token_from_headers(headers: &HeaderMap) -> Option<String> {
    if let Some(token) = bearer_token(headers) {
        return Some(token);
    }

    headers
        .get_all(COOKIE)
        .iter()
        .filter_map(|value| value.to_str().ok())
        .find_map(|value| cookie_value(value, SESSION_COOKIE))
}

fn bearer_token(headers: &HeaderMap) -> Option<String> {
    let value = headers.get(AUTHORIZATION)?.to_str().ok()?;
    value
        .strip_prefix("Bearer ")
        .filter(|token| !token.trim().is_empty())
        .map(|token| token.trim().to_string())
}

fn parse_uuid(value: &str) -> Result<Uuid, ApiError> {
    Uuid::parse_str(value).map_err(|_| ApiError::unknown("Stored user id is invalid."))
}

fn is_unique_violation(error: &sqlx::Error) -> bool {
    matches!(
        error,
        sqlx::Error::Database(database_error)
            if database_error.code().as_deref() == Some("23505")
    )
}

fn timestamp_ms(timestamp: OffsetDateTime) -> u64 {
    let millis = timestamp.unix_timestamp_nanos() / 1_000_000;
    u64::try_from(millis).unwrap_or(0)
}

#[derive(Debug, Serialize)]
struct SuccessEnvelope<T> {
    ok: bool,
    data: T,
}

fn ok<T>(data: T) -> Json<SuccessEnvelope<T>> {
    Json(SuccessEnvelope { ok: true, data })
}

#[derive(Debug, Serialize)]
struct ErrorEnvelope {
    ok: bool,
    error: ErrorBody,
}

#[derive(Debug, Serialize)]
struct ErrorBody {
    code: &'static str,
    message: String,
}

#[derive(Debug)]
pub struct ApiError {
    status: StatusCode,
    code: &'static str,
    message: String,
}

impl ApiError {
    fn validation(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::UNPROCESSABLE_ENTITY,
            code: "ValidationError",
            message: message.into(),
        }
    }

    fn unauthenticated(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            code: "Unauthenticated",
            message: message.into(),
        }
    }

    fn not_found(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::NOT_FOUND,
            code: "NotFound",
            message: message.into(),
        }
    }

    fn upstream(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::SERVICE_UNAVAILABLE,
            code: "UpstreamUnavailable",
            message: message.into(),
        }
    }

    fn unknown(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            code: "Unknown",
            message: message.into(),
        }
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(error: sqlx::Error) -> Self {
        tracing::error!(?error, "database request failed");
        ApiError::upstream("Database request failed.")
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (
            self.status,
            Json(ErrorEnvelope {
                ok: false,
                error: ErrorBody {
                    code: self.code,
                    message: self.message,
                },
            }),
        )
            .into_response()
    }
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    service: &'static str,
    status: &'static str,
}

#[derive(Debug, Deserialize)]
struct PageSearchQuery {
    #[serde(default)]
    q: String,
}

#[derive(Debug, Deserialize)]
struct AiMessageRequest {
    prompt: String,
}

#[derive(Debug, Error)]
enum GroqClientError {
    #[error("HTTP request failed: {0}")]
    Http(#[source] reqwest::Error),
    #[error("Groq returned HTTP {status}: {body}")]
    Api { status: u16, body: String },
    #[error("Groq response was invalid: {0}")]
    Decode(#[source] serde_json::Error),
    #[error("Groq response did not include assistant content")]
    MissingContent,
}

#[derive(Debug, Serialize)]
struct GroqChatRequest {
    model: String,
    messages: Vec<GroqChatMessage>,
    temperature: f32,
    max_completion_tokens: u32,
}

#[derive(Debug, Serialize)]
struct GroqChatMessage {
    role: &'static str,
    content: String,
}

#[derive(Debug, Deserialize)]
struct GroqChatResponse {
    choices: Vec<GroqChoice>,
}

#[derive(Debug, Deserialize)]
struct GroqChoice {
    message: GroqResponseMessage,
}

#[derive(Debug, Deserialize)]
struct GroqResponseMessage {
    content: Option<String>,
}

#[derive(Debug, sqlx::FromRow)]
struct UserAuthRow {
    id: Uuid,
    email: String,
    password_hash: String,
    name: Option<String>,
    image_url: Option<String>,
}

impl UserAuthRow {
    fn into_user(self) -> User {
        User {
            id: self.id.to_string(),
            email: Some(self.email),
            name: self.name,
            image_url: self.image_url,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct UserSessionRow {
    id: Uuid,
    email: String,
    name: Option<String>,
    image_url: Option<String>,
}

impl UserSessionRow {
    fn into_user(self) -> User {
        User {
            id: self.id.to_string(),
            email: Some(self.email),
            name: self.name,
            image_url: self.image_url,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct WorkspaceRow {
    id: Uuid,
    name: String,
}

impl WorkspaceRow {
    fn into_workspace(self) -> Workspace {
        Workspace {
            id: self.id.to_string(),
            name: self.name,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct PageRow {
    id: Uuid,
    workspace_id: Uuid,
    title: String,
    icon: Option<String>,
    cover: Option<String>,
    content: Option<Value>,
    is_favorite: bool,
    is_archived: bool,
    calendar_sync_enabled: bool,
    calendar_event_id: Option<String>,
    created_at: OffsetDateTime,
    updated_at: OffsetDateTime,
}

impl PageRow {
    fn into_page(self) -> Page {
        Page {
            id: self.id.to_string(),
            workspace_id: self.workspace_id.to_string(),
            title: self.title,
            content: self.content,
            icon: self.icon,
            cover: self.cover,
            is_favorite: self.is_favorite,
            is_archived: self.is_archived,
            calendar_sync_enabled: self.calendar_sync_enabled,
            calendar_event_id: self.calendar_event_id,
            created_at: Some(timestamp_ms(self.created_at)),
            updated_at: Some(timestamp_ms(self.updated_at)),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn password_hash_round_trip_accepts_original_password() {
        let hash = hash_password("correct horse battery staple").unwrap();

        assert!(verify_password("correct horse battery staple", &hash));
        assert!(!verify_password("wrong horse battery staple", &hash));
    }

    #[test]
    fn session_tokens_are_opaque_and_hash_to_stable_values() {
        let first = generate_session_token();
        let second = generate_session_token();

        assert_eq!(first.len(), 64);
        assert_ne!(first, second);
        assert_eq!(hash_session_token(&first), hash_session_token(&first));
        assert_ne!(hash_session_token(&first), first);
    }

    #[test]
    fn cookie_parser_finds_named_cookie() {
        let value = cookie_value(
            "theme=dark; noteflow_session=abc123; other=yes",
            SESSION_COOKIE,
        );

        assert_eq!(value.as_deref(), Some("abc123"));
    }

    #[test]
    fn cors_allows_dev_and_tauri_origins() {
        assert!(is_allowed_app_origin(b"http://localhost:1420"));
        assert!(is_allowed_app_origin(b"http://127.0.0.1:1420"));
        assert!(is_allowed_app_origin(b"http://tauri.localhost"));
        assert!(is_allowed_app_origin(b"https://tauri.localhost"));
        assert!(is_allowed_app_origin(b"tauri://localhost"));
        assert!(!is_allowed_app_origin(b"https://example.com"));
    }

    #[test]
    fn groq_chat_request_uses_configured_model_and_page_context() {
        let page = test_page_row(
            "Launch Plan",
            Some(serde_json::json!({
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": "Ship the Rust editor before adding heavier AI features."
                            }
                        ]
                    }
                ]
            })),
        );

        let request = groq_chat_request(
            "llama-3.3-70b-versatile",
            "What should ship next?",
            3,
            &[page],
        );

        assert_eq!(request.model, "llama-3.3-70b-versatile");
        assert_eq!(request.messages.len(), 2);
        assert_eq!(request.messages[0].role, "system");
        assert_eq!(request.messages[1].role, "user");
        assert!(
            request.messages[1]
                .content
                .contains("What should ship next?")
        );
        assert!(
            request.messages[1]
                .content
                .contains("Workspace page count: 3")
        );
        assert!(request.messages[1].content.contains("Launch Plan"));
        assert!(request.messages[1].content.contains("Ship the Rust editor"));
    }

    #[test]
    fn groq_chat_request_handles_missing_page_context() {
        let request = groq_chat_request("llama-3.3-70b-versatile", "Anything?", 0, &[]);

        assert!(
            request.messages[1]
                .content
                .contains("No matching pages were found")
        );
    }

    fn test_page_row(title: &str, content: Option<Value>) -> PageRow {
        PageRow {
            id: Uuid::new_v4(),
            workspace_id: Uuid::new_v4(),
            title: title.to_string(),
            icon: None,
            cover: None,
            content,
            is_favorite: false,
            is_archived: false,
            calendar_sync_enabled: false,
            calendar_event_id: None,
            created_at: OffsetDateTime::UNIX_EPOCH,
            updated_at: OffsetDateTime::UNIX_EPOCH,
        }
    }
}
