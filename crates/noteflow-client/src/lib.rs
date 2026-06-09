use async_trait::async_trait;
use noteflow_types::{
    AIMessage, CalendarEvent, CalendarIntegration, CreatePageRequest, DeletePageResponse,
    LoginRequest, LogoutResponse, Page, RegisterRequest, UpdatePageCalendarRequest,
    UpdatePageRequest, UsageStats, User, Workspace,
};
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use thiserror::Error;
use url::Url;

const AUTH_ME_PATH: &str = "/api/v1/auth/me";
const AUTH_REGISTER_PATH: &str = "/api/v1/auth/register";
const AUTH_LOGIN_PATH: &str = "/api/v1/auth/login";
const AUTH_LOGOUT_PATH: &str = "/api/v1/auth/logout";
const WORKSPACES_PATH: &str = "/api/v1/workspaces";
const PAGES_PATH: &str = "/api/v1/pages";
const PAGES_SEARCH_PATH: &str = "/api/v1/pages/search";
const CALENDAR_INTEGRATION_PATH: &str = "/api/v1/calendar/integration";
const CALENDAR_EVENTS_PATH: &str = "/api/v1/calendar/events";
const AI_MESSAGES_PATH: &str = "/api/v1/ai/messages";
const USAGE_PATH: &str = "/api/v1/usage";

#[derive(Debug, Error)]
pub enum ClientError {
    #[error("request is unauthenticated")]
    Unauthenticated,
    #[error("request is unauthorized")]
    Unauthorized,
    #[error("rate limited")]
    RateLimited,
    #[error("validation failed: {0}")]
    ValidationError(String),
    #[error("not found")]
    NotFound,
    #[error("upstream unavailable")]
    UpstreamUnavailable,
    #[error("network error: {0}")]
    Network(String),
    #[error("invalid url: {0}")]
    InvalidUrl(String),
    #[error("invalid response: {0}")]
    InvalidResponse(String),
    #[error("unknown error: {0}")]
    Unknown(String),
}

#[derive(Debug, Clone)]
pub struct ClientConfig {
    pub base_url: Url,
    pub bearer_token: Option<String>,
}

impl ClientConfig {
    pub fn new(base_url: Url) -> Self {
        Self {
            base_url,
            bearer_token: None,
        }
    }

    pub fn from_base_url(base_url: &str) -> Result<Self, ClientError> {
        Url::parse(base_url)
            .map(Self::new)
            .map_err(|error| ClientError::InvalidUrl(error.to_string()))
    }

    pub fn with_bearer_token(mut self, bearer_token: impl Into<String>) -> Self {
        self.bearer_token = Some(bearer_token.into());
        self
    }
}

#[derive(Debug, Clone)]
pub struct ParityApiClient {
    config: ClientConfig,
    #[cfg(not(target_arch = "wasm32"))]
    native_http: reqwest::Client,
}

impl ParityApiClient {
    pub fn new(config: ClientConfig) -> Self {
        Self {
            config,
            #[cfg(not(target_arch = "wasm32"))]
            native_http: reqwest::Client::builder()
                .cookie_store(true)
                .build()
                .expect("reqwest client configuration should be valid"),
        }
    }

    pub fn from_base_url(base_url: &str) -> Result<Self, ClientError> {
        ClientConfig::from_base_url(base_url).map(Self::new)
    }

    pub fn with_bearer_token(mut self, bearer_token: impl Into<String>) -> Self {
        self.config.bearer_token = Some(bearer_token.into());
        self
    }

    fn endpoint_url(&self, path: &str) -> Result<Url, ClientError> {
        self.config
            .base_url
            .join(path.trim_start_matches('/'))
            .map_err(|error| ClientError::InvalidUrl(error.to_string()))
    }

    async fn get_json<T>(&self, path: &str) -> Result<T, ClientError>
    where
        T: DeserializeOwned,
    {
        let url = self.endpoint_url(path)?;
        let (status, body) = self.raw_get(url.as_str()).await?;
        decode_envelope(status, &body)
    }

    async fn post_json<Req, Res>(&self, path: &str, payload: &Req) -> Result<Res, ClientError>
    where
        Req: Serialize + ?Sized,
        Res: DeserializeOwned,
    {
        let url = self.endpoint_url(path)?;
        let (status, body) = self.raw_post(url.as_str(), payload).await?;
        decode_envelope(status, &body)
    }

    async fn patch_json<Req, Res>(&self, path: &str, payload: &Req) -> Result<Res, ClientError>
    where
        Req: Serialize + ?Sized,
        Res: DeserializeOwned,
    {
        let url = self.endpoint_url(path)?;
        let (status, body) = self.raw_patch(url.as_str(), payload).await?;
        decode_envelope(status, &body)
    }

    async fn delete_json<T>(&self, path: &str) -> Result<T, ClientError>
    where
        T: DeserializeOwned,
    {
        let url = self.endpoint_url(path)?;
        let (status, body) = self.raw_delete(url.as_str()).await?;
        decode_envelope(status, &body)
    }

    #[cfg(not(target_arch = "wasm32"))]
    async fn raw_get(&self, url: &str) -> Result<(u16, String), ClientError> {
        let mut request = self.native_http.get(url);
        if let Some(token) = &self.config.bearer_token {
            request = request.bearer_auth(token);
        }

        let response = request
            .send()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        let status = response.status().as_u16();
        let body = response
            .text()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        Ok((status, body))
    }

    #[cfg(target_arch = "wasm32")]
    async fn raw_get(&self, url: &str) -> Result<(u16, String), ClientError> {
        use gloo_net::http::Request;
        use web_sys::RequestCredentials;

        let mut request = Request::get(url).credentials(RequestCredentials::Include);
        if let Some(token) = &self.config.bearer_token {
            request = request.header("Authorization", &format!("Bearer {}", token));
        }

        let response = request
            .send()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        Ok((status, body))
    }

    #[cfg(not(target_arch = "wasm32"))]
    async fn raw_post<Req: Serialize + ?Sized>(
        &self,
        url: &str,
        payload: &Req,
    ) -> Result<(u16, String), ClientError> {
        let mut request = self.native_http.post(url).json(payload);
        if let Some(token) = &self.config.bearer_token {
            request = request.bearer_auth(token);
        }

        let response = request
            .send()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        let status = response.status().as_u16();
        let body = response
            .text()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        Ok((status, body))
    }

    #[cfg(not(target_arch = "wasm32"))]
    async fn raw_patch<Req: Serialize + ?Sized>(
        &self,
        url: &str,
        payload: &Req,
    ) -> Result<(u16, String), ClientError> {
        let mut request = self.native_http.patch(url).json(payload);
        if let Some(token) = &self.config.bearer_token {
            request = request.bearer_auth(token);
        }

        let response = request
            .send()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        let status = response.status().as_u16();
        let body = response
            .text()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        Ok((status, body))
    }

    #[cfg(not(target_arch = "wasm32"))]
    async fn raw_delete(&self, url: &str) -> Result<(u16, String), ClientError> {
        let mut request = self.native_http.delete(url);
        if let Some(token) = &self.config.bearer_token {
            request = request.bearer_auth(token);
        }

        let response = request
            .send()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        let status = response.status().as_u16();
        let body = response
            .text()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        Ok((status, body))
    }

    #[cfg(target_arch = "wasm32")]
    async fn raw_post<Req: Serialize + ?Sized>(
        &self,
        url: &str,
        payload: &Req,
    ) -> Result<(u16, String), ClientError> {
        use gloo_net::http::Request;
        use web_sys::RequestCredentials;

        let mut request = Request::post(url).credentials(RequestCredentials::Include);
        if let Some(token) = &self.config.bearer_token {
            request = request.header("Authorization", &format!("Bearer {}", token));
        }

        let request = request
            .json(payload)
            .map_err(|error| ClientError::InvalidResponse(error.to_string()))?;
        let response = request
            .send()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        Ok((status, body))
    }

    #[cfg(target_arch = "wasm32")]
    async fn raw_patch<Req: Serialize + ?Sized>(
        &self,
        url: &str,
        payload: &Req,
    ) -> Result<(u16, String), ClientError> {
        use gloo_net::http::Request;
        use web_sys::RequestCredentials;

        let mut request = Request::patch(url).credentials(RequestCredentials::Include);
        if let Some(token) = &self.config.bearer_token {
            request = request.header("Authorization", &format!("Bearer {}", token));
        }

        let request = request
            .json(payload)
            .map_err(|error| ClientError::InvalidResponse(error.to_string()))?;
        let response = request
            .send()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        Ok((status, body))
    }

    #[cfg(target_arch = "wasm32")]
    async fn raw_delete(&self, url: &str) -> Result<(u16, String), ClientError> {
        use gloo_net::http::Request;
        use web_sys::RequestCredentials;

        let mut request = Request::delete(url).credentials(RequestCredentials::Include);
        if let Some(token) = &self.config.bearer_token {
            request = request.header("Authorization", &format!("Bearer {}", token));
        }

        let response = request
            .send()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        let status = response.status();
        let body = response
            .text()
            .await
            .map_err(|error| ClientError::Network(error.to_string()))?;
        Ok((status, body))
    }
}

#[cfg_attr(target_arch = "wasm32", async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
pub trait AuthApi {
    async fn register(
        &self,
        email: &str,
        password: &str,
        name: Option<&str>,
    ) -> Result<User, ClientError>;
    async fn login(&self, email: &str, password: &str) -> Result<User, ClientError>;
    async fn logout(&self) -> Result<LogoutResponse, ClientError>;
    async fn me(&self) -> Result<User, ClientError>;
}

#[cfg_attr(target_arch = "wasm32", async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
pub trait PagesApi {
    async fn list_workspaces(&self) -> Result<Vec<Workspace>, ClientError>;
    async fn list_pages(&self, workspace_id: &str) -> Result<Vec<Page>, ClientError>;
    async fn search_pages(&self, query: &str) -> Result<Vec<Page>, ClientError>;
    async fn create_page(
        &self,
        workspace_id: &str,
        title: Option<&str>,
        content: Option<Value>,
    ) -> Result<Page, ClientError>;
    async fn get_page(&self, page_id: &str) -> Result<Page, ClientError>;
    async fn update_page(
        &self,
        page_id: &str,
        payload: UpdatePageRequest,
    ) -> Result<Page, ClientError>;
    async fn update_page_calendar(
        &self,
        page_id: &str,
        payload: UpdatePageCalendarRequest,
    ) -> Result<Page, ClientError>;
    async fn delete_page(&self, page_id: &str) -> Result<DeletePageResponse, ClientError>;
}

#[cfg_attr(target_arch = "wasm32", async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
pub trait CalendarApi {
    async fn integration_status(&self) -> Result<CalendarIntegration, ClientError>;
    async fn list_events(&self) -> Result<Vec<CalendarEvent>, ClientError>;
}

#[cfg_attr(target_arch = "wasm32", async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
pub trait AiApi {
    async fn send_message(&self, prompt: &str) -> Result<AIMessage, ClientError>;
}

#[cfg_attr(target_arch = "wasm32", async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
pub trait UsageApi {
    async fn usage_stats(&self) -> Result<UsageStats, ClientError>;
}

#[cfg_attr(target_arch = "wasm32", async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
impl AuthApi for ParityApiClient {
    async fn register(
        &self,
        email: &str,
        password: &str,
        name: Option<&str>,
    ) -> Result<User, ClientError> {
        self.post_json(
            AUTH_REGISTER_PATH,
            &RegisterRequest {
                email: email.to_string(),
                password: password.to_string(),
                name: name.map(ToString::to_string),
            },
        )
        .await
    }

    async fn login(&self, email: &str, password: &str) -> Result<User, ClientError> {
        self.post_json(
            AUTH_LOGIN_PATH,
            &LoginRequest {
                email: email.to_string(),
                password: password.to_string(),
            },
        )
        .await
    }

    async fn logout(&self) -> Result<LogoutResponse, ClientError> {
        let payload = serde_json::json!({});
        self.post_json(AUTH_LOGOUT_PATH, &payload).await
    }

    async fn me(&self) -> Result<User, ClientError> {
        self.get_json(AUTH_ME_PATH).await
    }
}

#[cfg_attr(target_arch = "wasm32", async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
impl PagesApi for ParityApiClient {
    async fn list_workspaces(&self) -> Result<Vec<Workspace>, ClientError> {
        self.get_json(WORKSPACES_PATH).await
    }

    async fn list_pages(&self, workspace_id: &str) -> Result<Vec<Page>, ClientError> {
        let pages: Vec<Page> = self.get_json(PAGES_PATH).await?;
        Ok(pages
            .into_iter()
            .filter(|page| page.workspace_id == workspace_id)
            .collect())
    }

    async fn search_pages(&self, query: &str) -> Result<Vec<Page>, ClientError> {
        let mut url = self.endpoint_url(PAGES_SEARCH_PATH)?;
        url.query_pairs_mut().append_pair("q", query);
        let (status, body) = self.raw_get(url.as_str()).await?;
        decode_envelope(status, &body)
    }

    async fn create_page(
        &self,
        workspace_id: &str,
        title: Option<&str>,
        content: Option<Value>,
    ) -> Result<Page, ClientError> {
        self.post_json(
            PAGES_PATH,
            &CreatePageRequest {
                workspace_id: workspace_id.to_string(),
                title: title.map(ToString::to_string),
                content,
                icon: Some("▣".to_string()),
                cover: None,
            },
        )
        .await
    }

    async fn get_page(&self, page_id: &str) -> Result<Page, ClientError> {
        self.get_json(&format!("{PAGES_PATH}/{page_id}")).await
    }

    async fn update_page(
        &self,
        page_id: &str,
        payload: UpdatePageRequest,
    ) -> Result<Page, ClientError> {
        self.patch_json(&format!("{PAGES_PATH}/{page_id}"), &payload)
            .await
    }

    async fn update_page_calendar(
        &self,
        page_id: &str,
        payload: UpdatePageCalendarRequest,
    ) -> Result<Page, ClientError> {
        self.patch_json(&format!("{PAGES_PATH}/{page_id}/calendar"), &payload)
            .await
    }

    async fn delete_page(&self, page_id: &str) -> Result<DeletePageResponse, ClientError> {
        self.delete_json(&format!("{PAGES_PATH}/{page_id}")).await
    }
}

#[cfg_attr(target_arch = "wasm32", async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
impl CalendarApi for ParityApiClient {
    async fn integration_status(&self) -> Result<CalendarIntegration, ClientError> {
        self.get_json(CALENDAR_INTEGRATION_PATH).await
    }

    async fn list_events(&self) -> Result<Vec<CalendarEvent>, ClientError> {
        self.get_json(CALENDAR_EVENTS_PATH).await
    }
}

#[derive(Debug, Serialize)]
struct AiMessageRequest<'a> {
    prompt: &'a str,
}

#[cfg_attr(target_arch = "wasm32", async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
impl AiApi for ParityApiClient {
    async fn send_message(&self, prompt: &str) -> Result<AIMessage, ClientError> {
        self.post_json(AI_MESSAGES_PATH, &AiMessageRequest { prompt })
            .await
    }
}

#[cfg_attr(target_arch = "wasm32", async_trait(?Send))]
#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
impl UsageApi for ParityApiClient {
    async fn usage_stats(&self) -> Result<UsageStats, ClientError> {
        self.get_json(USAGE_PATH).await
    }
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum ApiEnvelope<T> {
    Ok { ok: bool, data: T },
    Err { ok: bool, error: ApiErrorEnvelope },
}

#[derive(Debug, Deserialize)]
struct ApiErrorEnvelope {
    code: String,
    message: String,
}

fn decode_envelope<T>(status: u16, body: &str) -> Result<T, ClientError>
where
    T: DeserializeOwned,
{
    let envelope = serde_json::from_str::<ApiEnvelope<T>>(body);
    match envelope {
        Ok(ApiEnvelope::Ok { ok: true, data }) => Ok(data),
        Ok(ApiEnvelope::Err { ok: false, error }) => {
            Err(map_parity_error(status, &error.code, &error.message))
        }
        Ok(ApiEnvelope::Ok { ok: false, .. }) | Ok(ApiEnvelope::Err { ok: true, .. }) => Err(
            ClientError::InvalidResponse("invalid parity response envelope".into()),
        ),
        Err(_) => Err(map_parity_error(status, "Unknown", body)),
    }
}

fn map_parity_error(status: u16, code: &str, message: &str) -> ClientError {
    match code {
        "Unauthenticated" => ClientError::Unauthenticated,
        "Unauthorized" => ClientError::Unauthorized,
        "RateLimited" => ClientError::RateLimited,
        "ValidationError" => ClientError::ValidationError(message.to_string()),
        "NotFound" => ClientError::NotFound,
        "UpstreamUnavailable" => ClientError::UpstreamUnavailable,
        _ => match status {
            401 => ClientError::Unauthenticated,
            403 => ClientError::Unauthorized,
            404 => ClientError::NotFound,
            429 => ClientError::RateLimited,
            422 => ClientError::ValidationError(message.to_string()),
            503 => ClientError::UpstreamUnavailable,
            _ => ClientError::Unknown(message.to_string()),
        },
    }
}
