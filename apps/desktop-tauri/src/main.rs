#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use tauri::State;

#[derive(Debug)]
struct ShellState {
    api_base_url: String,
    parity_api_prefix: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ShellInfo {
    app: String,
    api_base_url: String,
    parity_api_prefix: String,
}

#[tauri::command]
fn shell_info(state: State<'_, ShellState>) -> ShellInfo {
    ShellInfo {
        app: "NoteFlow Desktop".to_string(),
        api_base_url: state.api_base_url.clone(),
        parity_api_prefix: state.parity_api_prefix.clone(),
    }
}

fn main() {
    let api_base_url =
        std::env::var("NOTEFLOW_API_BASE_URL").unwrap_or_else(|_| "http://127.0.0.1:3317".into());
    let shell_state = ShellState {
        api_base_url,
        parity_api_prefix: "/api/v1".into(),
    };

    tauri::Builder::default()
        .manage(shell_state)
        .invoke_handler(tauri::generate_handler![shell_info])
        .run(tauri::generate_context!())
        .expect("error while running NoteFlow desktop shell");
}
