# Rust Rewrite Runtime

This project now has the Rust product path from the source-of-truth plan:

- `apps/api-axum`: Axum API on `/api/v1/*`, backed by Postgres and SQLx migrations.
- `apps/web-leptos`: Leptos shell for landing, auth, dashboard, sidebar, and page list parity.
- `apps/desktop-tauri`: Tauri shell that loads the same Leptos UI.
- `crates/noteflow-client` and `crates/noteflow-types`: shared API envelope, DTOs, and client calls.

## Local API

Set a Postgres connection string, then run the API:

```powershell
$env:NOTEFLOW_DATABASE_URL = "postgres://noteflow:noteflow@localhost:5432/noteflow"
cargo run -p api-axum
```

The local Docker container used for verification is `noteflow-postgres` with database/user/password all set to `noteflow`.

Optional environment variables:

- `NOTEFLOW_API_BIND`: defaults to `127.0.0.1:3317`.
- `NOTEFLOW_COOKIE_SECURE`: set to `true` for HTTPS deployments.
- `NOTEFLOW_SESSION_DAYS`: defaults to `30`.
- `GROQ_API_KEY`: enables live NoteFlow AI responses through Groq.
- `GROQ_MODEL`: defaults to `llama-3.3-70b-versatile`.
- `GROQ_API_BASE_URL`: defaults to `https://api.groq.com/openai/v1`.

If `GROQ_API_KEY` is absent, `/api/v1/ai/messages` falls back to the local Postgres search summary so development still works offline.

## Web And Desktop

The Leptos dev server is configured for Tauri at port `1420`:

```powershell
trunk serve --config apps/web-leptos/Trunk.toml
```

Tauri defaults to the Rust API at `http://localhost:3317` and the Leptos dev URL at `http://localhost:1420`.

## Production Desktop Build

The production desktop app embeds `apps/web-leptos/dist` and does not need Trunk at runtime. The bundled WebView loads from `http://tauri.localhost/`, and the Leptos client uses `http://api.tauri.localhost:3317` for the local Rust API so opaque cookie sessions stay same-site.

Build the Leptos assets:

```powershell
trunk build --config apps/web-leptos/Trunk.toml --release
```

Install the Tauri CLI locally if `cargo tauri` is not installed globally:

```powershell
cargo install tauri-cli --locked --root target/cargo-tools
```

Build the Windows MSI without code signing:

```powershell
target\cargo-tools\bin\cargo-tauri.exe build --bundles msi --ci --no-sign
```

Outputs:

- Release app: `target\release\desktop-tauri.exe`
- MSI installer: `target\release\bundle\msi\NoteFlow Desktop_0.1.0_x64_en-US.msi`

For a local smoke test, keep the Rust API running at `127.0.0.1:3317`, close Trunk, then launch `target\release\desktop-tauri.exe`.

## Windows Rust/Tauri Prerequisite

Rust MSVC builds on Windows need the Visual C++ linker (`link.exe`) and Windows SDK import libraries. Tauri bundle builds also need the Windows SDK resource compiler (`RC.EXE`). Install Visual Studio Build Tools with the "Desktop development with C++" workload, then make sure the developer environment or PATH exposes `link.exe`, `kernel32.lib`, and `RC.EXE`. The Tauri build script now warns clearly if only the resource compiler is missing, but full workspace checks and desktop bundling still need the C++/SDK toolchain.
