//! Leptos CSR entrypoint for the NoteFlow parity web app.

use leptos::mount::mount_to_body;
use leptos::prelude::*;
use noteflow_ui::ui_ready;
use wasm_bindgen::prelude::wasm_bindgen;

#[component]
fn App() -> impl IntoView {
    let (count, set_count) = signal(0);
    let status = if ui_ready() {
        "UI primitives loaded"
    } else {
        "UI primitives unavailable"
    };

    view! {
        <main class="nf-shell">
            <h1>"NoteFlow Parity Web (Leptos)"</h1>
            <p>{status}</p>
            <button on:click=move |_| set_count.update(|value| *value += 1)>
                "Bootstrap check clicks: "
                {count}
            </button>
            <p>"Next wiring step: call /api/v1/* via noteflow-client adapters."</p>
        </main>
    }
}

/// Called by the browser when the wasm module is loaded.
#[wasm_bindgen(start)]
pub fn bootstrap() {
    console_error_panic_hook::set_once();
    mount_to_body(App);
}
