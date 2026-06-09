use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    #[serde(default)]
    pub name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogoutResponse {
    pub signed_out: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub email: Option<String>,
    pub name: Option<String>,
    #[serde(default, alias = "image_url")]
    pub image_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Page {
    pub id: String,
    #[serde(alias = "workspace_id")]
    pub workspace_id: String,
    pub title: String,
    pub content: Option<Value>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub cover: Option<String>,
    #[serde(default)]
    pub is_favorite: bool,
    #[serde(default)]
    pub is_archived: bool,
    #[serde(default)]
    pub calendar_sync_enabled: bool,
    #[serde(default)]
    pub calendar_event_id: Option<String>,
    #[serde(default)]
    pub created_at: Option<u64>,
    #[serde(default)]
    pub updated_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePageRequest {
    pub workspace_id: String,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub content: Option<Value>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub cover: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePageRequest {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub content: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePageCalendarRequest {
    pub calendar_sync_enabled: bool,
    #[serde(default)]
    pub calendar_event_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeletePageResponse {
    pub deleted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalendarIntegration {
    pub provider: String,
    pub connected: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
    pub id: String,
    #[serde(alias = "summary")]
    pub title: String,
    #[serde(alias = "start")]
    pub start_iso: String,
    #[serde(alias = "end")]
    pub end_iso: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageStats {
    #[serde(default)]
    pub period: Option<String>,
    #[serde(default)]
    pub requests: Option<u64>,
    #[serde(default)]
    pub tokens_used: Option<u64>,
    #[serde(default)]
    pub limit: Option<u64>,
    #[serde(default)]
    pub rpm: Option<u64>,
}
