use api_axum::{ApiConfig, AppState, router};
use axum::Router;
use axum::body::{Body, to_bytes};
use axum::http::header::{CONTENT_TYPE, COOKIE, SET_COOKIE};
use axum::http::{HeaderMap, Method, Request, StatusCode};
use noteflow_types::{
    CreatePageRequest, LoginRequest, RegisterRequest, UpdatePageCalendarRequest, UpdatePageRequest,
};
use serde_json::{Value, json};
use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;
use tower::ServiceExt;
use uuid::Uuid;

const TEST_DATABASE_ENV: &str = "NOTEFLOW_TEST_DATABASE_URL";

#[tokio::test]
async fn auth_and_workspace_page_filters_run_against_postgres() {
    let Some(pool) = test_pool().await else {
        eprintln!(
            "skipping Postgres integration test; set {TEST_DATABASE_ENV} or NOTEFLOW_DATABASE_URL"
        );
        return;
    };

    reset_database(&pool).await;
    let app = test_app(pool.clone());
    let run_id = Uuid::new_v4();

    let (status, headers, body) = send_json(
        app.clone(),
        "/api/v1/auth/register",
        &RegisterRequest {
            email: format!("alice-{run_id}@example.com"),
            password: "correct horse battery staple".to_string(),
            name: Some("Alice".to_string()),
        },
        None,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["ok"], true);
    assert_eq!(body["data"]["email"], format!("alice-{run_id}@example.com"));
    let alice_cookie = session_cookie(&headers);

    let (_, _, me_body) = send_empty(app.clone(), "/api/v1/auth/me", Some(&alice_cookie)).await;
    assert_eq!(
        me_body["data"]["email"],
        format!("alice-{run_id}@example.com")
    );

    let (_, _, workspaces_body) =
        send_empty(app.clone(), "/api/v1/workspaces", Some(&alice_cookie)).await;
    let alice_workspace = workspace_id(&workspaces_body);

    let (status, headers, _) = send_json(
        app.clone(),
        "/api/v1/auth/register",
        &RegisterRequest {
            email: format!("bob-{run_id}@example.com"),
            password: "correct horse battery staple".to_string(),
            name: Some("Bob".to_string()),
        },
        None,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let bob_cookie = session_cookie(&headers);
    let (_, _, bob_workspaces_body) =
        send_empty(app.clone(), "/api/v1/workspaces", Some(&bob_cookie)).await;
    let bob_workspace = workspace_id(&bob_workspaces_body);

    let (status, _, alice_page_body) = send_json(
        app.clone(),
        "/api/v1/pages",
        &CreatePageRequest {
            workspace_id: alice_workspace.to_string(),
            title: Some("Alice private page".to_string()),
            content: Some(editor_doc("Alice first draft")),
            icon: Some("▣".to_string()),
            cover: None,
        },
        Some(&alice_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let alice_page_id = page_id(&alice_page_body);

    let (status, _, bob_page_body) = send_json(
        app.clone(),
        "/api/v1/pages",
        &CreatePageRequest {
            workspace_id: bob_workspace.to_string(),
            title: Some("Bob private page".to_string()),
            content: Some(editor_doc("Bob first draft")),
            icon: Some("▣".to_string()),
            cover: None,
        },
        Some(&bob_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let bob_page_id = page_id(&bob_page_body);

    let (_, _, alice_pages) = send_empty(app.clone(), "/api/v1/pages", Some(&alice_cookie)).await;
    assert_page_titles(&alice_pages, &["Alice private page"]);

    let (_, _, bob_pages) = send_empty(app.clone(), "/api/v1/pages", Some(&bob_cookie)).await;
    assert_page_titles(&bob_pages, &["Bob private page"]);

    let (status, _, alice_page) = send_empty(
        app.clone(),
        &format!("/api/v1/pages/{alice_page_id}"),
        Some(&alice_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        alice_page["data"]["content"],
        editor_doc("Alice first draft")
    );

    let (status, _, updated_page) = send_json_method(
        app.clone(),
        Method::PATCH,
        &format!("/api/v1/pages/{alice_page_id}"),
        &UpdatePageRequest {
            title: Some("Alice edited page".to_string()),
            content: Some(editor_doc("Alice saved body")),
        },
        Some(&alice_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(updated_page["data"]["title"], "Alice edited page");
    assert_eq!(
        updated_page["data"]["content"],
        editor_doc("Alice saved body")
    );

    let (status, _, alice_search) = send_empty(
        app.clone(),
        "/api/v1/pages/search?q=saved%20body",
        Some(&alice_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_page_titles(&alice_search, &["Alice edited page"]);

    let (status, _, bob_search) = send_empty(
        app.clone(),
        "/api/v1/pages/search?q=Alice",
        Some(&bob_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_page_titles(&bob_search, &[]);

    let (status, _, unauthenticated_search) =
        send_empty(app.clone(), "/api/v1/pages/search?q=Alice", None).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(unauthenticated_search["error"]["code"], "Unauthenticated");

    let (status, _, ai_body) = send_json(
        app.clone(),
        "/api/v1/ai/messages",
        &json!({ "prompt": "saved body" }),
        Some(&alice_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(ai_body["data"]["role"], "assistant");
    assert!(
        ai_body["data"]["content"]
            .as_str()
            .expect("AI response should be text")
            .contains("Alice edited page")
    );

    let (status, _, linked_page) = send_json_method(
        app.clone(),
        Method::PATCH,
        &format!("/api/v1/pages/{alice_page_id}/calendar"),
        &UpdatePageCalendarRequest {
            calendar_sync_enabled: true,
            calendar_event_id: Some("alice-event".to_string()),
        },
        Some(&alice_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(linked_page["data"]["calendarSyncEnabled"], true);
    assert_eq!(linked_page["data"]["calendarEventId"], "alice-event");

    let (status, _, _) = send_json_method(
        app.clone(),
        Method::PATCH,
        &format!("/api/v1/pages/{alice_page_id}/calendar"),
        &UpdatePageCalendarRequest {
            calendar_sync_enabled: false,
            calendar_event_id: None,
        },
        Some(&bob_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (status, _, calendar_integration) = send_empty(
        app.clone(),
        "/api/v1/calendar/integration",
        Some(&alice_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        calendar_integration["data"]["provider"],
        "noteflow-postgres"
    );
    assert_eq!(calendar_integration["data"]["connected"], true);

    let (status, _, calendar_events) =
        send_empty(app.clone(), "/api/v1/calendar/events", Some(&alice_cookie)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(calendar_events["data"][0]["id"], "alice-event");
    assert_eq!(calendar_events["data"][0]["title"], "Alice edited page");

    let (status, _, unlinked_page) = send_json_method(
        app.clone(),
        Method::PATCH,
        &format!("/api/v1/pages/{alice_page_id}/calendar"),
        &UpdatePageCalendarRequest {
            calendar_sync_enabled: false,
            calendar_event_id: None,
        },
        Some(&alice_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(unlinked_page["data"]["calendarSyncEnabled"], false);
    assert_eq!(unlinked_page["data"]["calendarEventId"], Value::Null);

    let (status, _, empty_calendar_events) =
        send_empty(app.clone(), "/api/v1/calendar/events", Some(&alice_cookie)).await;
    assert_eq!(status, StatusCode::OK);
    assert_page_titles(&empty_calendar_events, &[]);

    let (status, _, _) = send_empty(
        app.clone(),
        &format!("/api/v1/pages/{alice_page_id}"),
        Some(&bob_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (status, _, _) = send_json_method(
        app.clone(),
        Method::PATCH,
        &format!("/api/v1/pages/{alice_page_id}"),
        &UpdatePageRequest {
            title: Some("Bob should not edit this".to_string()),
            content: Some(editor_doc("Nope")),
        },
        Some(&bob_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (status, _, delete_body) = send_empty_method(
        app.clone(),
        Method::DELETE,
        &format!("/api/v1/pages/{bob_page_id}"),
        Some(&bob_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(delete_body["data"]["deleted"], true);

    let (status, _, _) = send_empty(
        app.clone(),
        &format!("/api/v1/pages/{bob_page_id}"),
        Some(&bob_cookie),
    )
    .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (status, headers, _) = send_json(
        app.clone(),
        "/api/v1/auth/login",
        &LoginRequest {
            email: format!("alice-{run_id}@example.com"),
            password: "correct horse battery staple".to_string(),
        },
        None,
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let login_cookie = session_cookie(&headers);

    let (status, _, logout_body) =
        send_empty(app.clone(), "/api/v1/auth/logout", Some(&login_cookie)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(logout_body["data"]["signedOut"], true);

    let (status, _, logged_out_body) =
        send_empty(app.clone(), "/api/v1/auth/me", Some(&login_cookie)).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(logged_out_body["error"]["code"], "Unauthenticated");

    reset_database(&pool).await;
}

async fn test_pool() -> Option<PgPool> {
    let database_url = std::env::var(TEST_DATABASE_ENV)
        .or_else(|_| std::env::var("NOTEFLOW_DATABASE_URL"))
        .ok()?;
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("test database should be reachable");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("migrations should apply");

    Some(pool)
}

fn test_app(pool: PgPool) -> Router {
    router(AppState::new(
        pool,
        ApiConfig {
            bind_addr: "127.0.0.1:0".parse().expect("valid bind address"),
            database_url: "postgres://integration-test".to_string(),
            cookie_secure: false,
            session_days: 30,
            groq_api_key: None,
            groq_model: "llama-3.3-70b-versatile".to_string(),
            groq_api_base_url: "https://api.groq.com/openai/v1".to_string(),
        },
    ))
}

async fn reset_database(pool: &PgPool) {
    sqlx::query("TRUNCATE pages, workspaces, sessions, users RESTART IDENTITY CASCADE")
        .execute(pool)
        .await
        .expect("test database should reset");
}

async fn send_json<T: serde::Serialize>(
    app: Router,
    path: &str,
    payload: &T,
    cookie: Option<&str>,
) -> (StatusCode, HeaderMap, Value) {
    send_json_method(app, Method::POST, path, payload, cookie).await
}

async fn send_json_method<T: serde::Serialize>(
    app: Router,
    method: Method,
    path: &str,
    payload: &T,
    cookie: Option<&str>,
) -> (StatusCode, HeaderMap, Value) {
    let mut builder = Request::builder()
        .method(method)
        .uri(path)
        .header(CONTENT_TYPE, "application/json");
    if let Some(cookie) = cookie {
        builder = builder.header(COOKIE, cookie);
    }
    let request = builder
        .body(Body::from(
            serde_json::to_vec(payload).expect("payload should serialize"),
        ))
        .expect("request should build");

    response_json(app, request).await
}

async fn send_empty(
    app: Router,
    path: &str,
    cookie: Option<&str>,
) -> (StatusCode, HeaderMap, Value) {
    let method = if path.ends_with("/logout") {
        Method::POST
    } else {
        Method::GET
    };
    send_empty_method(app, method, path, cookie).await
}

async fn send_empty_method(
    app: Router,
    method: Method,
    path: &str,
    cookie: Option<&str>,
) -> (StatusCode, HeaderMap, Value) {
    let mut builder = Request::builder().method(method).uri(path);
    if let Some(cookie) = cookie {
        builder = builder.header(COOKIE, cookie);
    }
    let request = builder.body(Body::empty()).expect("request should build");

    response_json(app, request).await
}

async fn response_json(app: Router, request: Request<Body>) -> (StatusCode, HeaderMap, Value) {
    let response = app.oneshot(request).await.expect("request should complete");
    let status = response.status();
    let headers = response.headers().clone();
    let body = to_bytes(response.into_body(), usize::MAX)
        .await
        .expect("body should be readable");
    let json = serde_json::from_slice(&body).expect("response should be JSON");

    (status, headers, json)
}

fn session_cookie(headers: &HeaderMap) -> String {
    headers
        .get(SET_COOKIE)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(';').next())
        .expect("response should set a session cookie")
        .to_string()
}

fn workspace_id(body: &Value) -> Uuid {
    let workspaces = body["data"]
        .as_array()
        .expect("workspaces response should be an array");
    assert_eq!(workspaces.len(), 1);
    Uuid::parse_str(
        workspaces[0]["id"]
            .as_str()
            .expect("workspace should include id"),
    )
    .expect("workspace id should be a UUID")
}

fn page_id(body: &Value) -> Uuid {
    Uuid::parse_str(body["data"]["id"].as_str().expect("page should include id"))
        .expect("page id should be a UUID")
}

fn assert_page_titles(body: &Value, expected: &[&str]) {
    let pages = body["data"]
        .as_array()
        .expect("pages response should be an array");
    let titles = pages
        .iter()
        .map(|page| page["title"].as_str().expect("page should include title"))
        .collect::<Vec<_>>();

    assert_eq!(titles, expected);
}

fn editor_doc(text: &str) -> Value {
    json!({
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": text
                    }
                ]
            }
        ]
    })
}
