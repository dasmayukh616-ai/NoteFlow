//! Leptos CSR entrypoint for the Rust NoteFlow shell.

use leptos::ev::SubmitEvent;
use leptos::mount::mount_to_body;
use leptos::prelude::*;
use leptos::task::spawn_local;
use noteflow_client::{AiApi, AuthApi, CalendarApi, ClientError, PagesApi, ParityApiClient};
use noteflow_types::{CalendarEvent, Page, UpdatePageCalendarRequest, UpdatePageRequest, User};
use serde_json::{Value, json};
use wasm_bindgen::prelude::wasm_bindgen;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::{JsCast, closure::Closure};

#[derive(Debug, Clone, PartialEq, Eq)]
enum Screen {
    Landing,
    SignIn,
    SignUp,
    Dashboard,
    Editor(String),
}

#[derive(Debug, Clone)]
struct DecodedContent {
    text: String,
    editable: bool,
}

#[component]
fn App() -> impl IntoView {
    let (screen, set_screen) = signal(Screen::Landing);
    let (auth_checked, set_auth_checked) = signal(false);
    let (auth_user, set_auth_user) = signal(None::<User>);
    let (auth_prompt, set_auth_prompt) = signal(String::new());

    restore_auth_session(set_auth_checked, set_auth_user, set_screen);

    view! {
        <div class="nf-app">
            {move || if !auth_checked.get() {
                boot_screen().into_any()
            } else {
                match screen.get() {
                    Screen::Landing => landing_screen(set_screen, auth_user, set_auth_prompt).into_any(),
                    Screen::SignIn => auth_screen(
                        Screen::SignIn,
                        set_screen,
                        set_auth_user,
                        auth_prompt,
                        set_auth_prompt,
                    ).into_any(),
                    Screen::SignUp => auth_screen(
                        Screen::SignUp,
                        set_screen,
                        set_auth_user,
                        auth_prompt,
                        set_auth_prompt,
                    ).into_any(),
                    Screen::Dashboard => dashboard_screen(
                        set_screen,
                        auth_user,
                        set_auth_user,
                        set_auth_prompt,
                    ).into_any(),
                    Screen::Editor(page_id) => editor_screen(
                        page_id,
                        set_screen,
                        set_auth_user,
                        set_auth_prompt,
                    ).into_any(),
                }
            }}
        </div>
    }
}

fn boot_screen() -> impl IntoView {
    view! {
        <div class="auth-page">
            <div class="auth-card boot-card">
                <p class="eyebrow">"Checking session"</p>
                <h1>"Opening NoteFlow."</h1>
                <p class="muted">"Restoring your Rust API session..."</p>
            </div>
        </div>
    }
}

fn landing_screen(
    set_screen: WriteSignal<Screen>,
    auth_user: ReadSignal<Option<User>>,
    set_auth_prompt: WriteSignal<String>,
) -> impl IntoView {
    view! {
        <div class="landing">
            <header class="landing-header">
                <button class="brand-button" type="button" on:click=move |_| set_screen.set(Screen::Landing)>
                    <span class="brand-mark">"N"</span>
                    <span>
                        <span class="brand-name">"NoteFlow"</span>
                        <span class="brand-tag">"Notes that move with your day"</span>
                    </span>
                </button>
                <nav class="landing-actions" aria-label="Primary">
                    <button
                        class="ghost-button"
                        type="button"
                        on:click=move |_| {
                            set_auth_prompt.set(String::new());
                            set_screen.set(Screen::SignIn);
                        }
                    >
                        "Sign in"
                    </button>
                    <button
                        class="primary-button"
                        type="button"
                        on:click=move |_| open_workspace_or_signup(auth_user, set_screen, set_auth_prompt)
                    >
                        "Open workspace"
                    </button>
                </nav>
            </header>

            <main class="landing-main">
                <section class="hero-copy">
                    <p class="eyebrow">"AI writing, calendar context, and live sync"</p>
                    <h1>"Work that starts as notes and ends as momentum."</h1>
                    <p class="hero-text">
                        "Capture rough thinking, structure meetings, and keep follow-through inside one calm workspace."
                    </p>
                    <div class="hero-actions">
                        <button
                            class="primary-button large"
                            type="button"
                            on:click=move |_| {
                                set_auth_prompt.set(String::new());
                                set_screen.set(Screen::SignUp);
                            }
                        >
                            "Create account"
                        </button>
                        <button
                            class="outline-button large"
                            type="button"
                            on:click=move |_| open_workspace_or_signup(auth_user, set_screen, set_auth_prompt)
                        >
                            "Open workspace"
                        </button>
                    </div>
                    <div class="proof-row">
                        <span>"✓ Multi-model AI"</span>
                        <span>"✓ Calendar-aware notes"</span>
                        <span>"✓ Command-first workspace"</span>
                    </div>
                </section>

                <section class="product-preview" aria-label="NoteFlow workspace preview">
                    <div class="preview-topline">
                        <span>"Morning brief"</span>
                        <span class="live-pill">"Live"</span>
                    </div>
                    <h2>"Product sync notes"</h2>
                    <div class="preview-block">
                        <span>"09:30 AM design review"</span>
                        <strong>"Agenda ready"</strong>
                        <p>"AI drafted a kickoff outline from action items, calendar context, and page history."</p>
                    </div>
                    <div class="preview-grid">
                        <article>
                            <span>"Ask NoteFlow"</span>
                            <p>"Summarize the risk, highlight open questions, and draft the follow-up."</p>
                        </article>
                        <article>
                            <span>"Next moves"</span>
                            <ul>
                                <li>"Align on launch scope"</li>
                                <li>"Draft recap before noon"</li>
                                <li>"Create action page"</li>
                            </ul>
                        </article>
                    </div>
                    <div class="signal-grid">
                        <SignalBadge label="Pages synced" value="12" />
                        <SignalBadge label="Meetings" value="4" />
                        <SignalBadge label="Prompts" value="18" />
                    </div>
                </section>
            </main>
        </div>
    }
}

fn auth_screen(
    mode: Screen,
    set_screen: WriteSignal<Screen>,
    set_auth_user: WriteSignal<Option<User>>,
    auth_prompt: ReadSignal<String>,
    set_auth_prompt: WriteSignal<String>,
) -> impl IntoView {
    let is_signup = mode == Screen::SignUp;
    let (email, set_email) = signal(String::new());
    let (password, set_password) = signal(String::new());
    let (name, set_name) = signal(String::new());
    let (status, set_status) = signal(auth_prompt.get_untracked());

    let submit = move |event: SubmitEvent| {
        event.prevent_default();
        set_status.set("Contacting the Rust API...".to_string());

        let email_value = email.get_untracked();
        let password_value = password.get_untracked();
        let name_value = name.get_untracked();

        spawn_local(async move {
            let client = match ParityApiClient::from_base_url(&api_base_url()) {
                Ok(client) => client,
                Err(error) => {
                    set_status.set(error.to_string());
                    return;
                }
            };

            let result = if is_signup {
                let clean_name = (!name_value.trim().is_empty()).then_some(name_value);
                client
                    .register(&email_value, &password_value, clean_name.as_deref())
                    .await
            } else {
                client.login(&email_value, &password_value).await
            };

            match result {
                Ok(user) => {
                    let label = user
                        .name
                        .clone()
                        .or(user.email.clone())
                        .unwrap_or_else(|| "workspace".to_string());
                    set_auth_user.set(Some(user));
                    set_auth_prompt.set(String::new());
                    set_status.set(format!("Signed in as {label}."));
                    set_screen.set(Screen::Dashboard);
                }
                Err(error) => {
                    set_auth_user.set(None);
                    set_status.set(error.to_string());
                }
            }
        });
    };

    view! {
        <div class="auth-page">
            <button
                class="brand-button auth-brand"
                type="button"
                on:click=move |_| {
                    set_auth_prompt.set(String::new());
                    set_screen.set(Screen::Landing);
                }
            >
                <span class="brand-mark">"N"</span>
                <span>
                    <span class="brand-name">"NoteFlow"</span>
                    <span class="brand-tag">"Rust shell"</span>
                </span>
            </button>

            <form class="auth-card" on:submit=submit>
                <p class="eyebrow">{if is_signup { "Create your workspace" } else { "Welcome back" }}</p>
                <h1>{if is_signup { "Start with a note." } else { "Sign in to continue." }}</h1>
                <p class="muted">
                    {if is_signup {
                        "Email/password auth is backed by the Axum API and Postgres sessions."
                    } else {
                        "Use the account created through the Rust API."
                    }}
                </p>

                {if is_signup {
                    view! {
                        <label class="field">
                            <span>"Name"</span>
                            <input
                                type="text"
                                placeholder="Mayukh Das"
                                autocomplete="name"
                                on:input=move |event| set_name.set(event_target_value(&event))
                            />
                        </label>
                    }.into_any()
                } else {
                    view! { <></> }.into_any()
                }}

                <label class="field">
                    <span>"Email"</span>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        autocomplete="email"
                        required
                        on:input=move |event| set_email.set(event_target_value(&event))
                    />
                </label>

                <label class="field">
                    <span>"Password"</span>
                    <input
                        type="password"
                        placeholder="At least 8 characters"
                        autocomplete=if is_signup { "new-password" } else { "current-password" }
                        required
                        on:input=move |event| set_password.set(event_target_value(&event))
                    />
                </label>

                <button class="primary-button large full" type="submit">
                    {if is_signup { "Create account" } else { "Sign in" }}
                </button>

                <p class="auth-status">{move || status.get()}</p>

                <button
                    class="link-button"
                    type="button"
                    on:click=move |_| {
                        set_auth_prompt.set(String::new());
                        set_status.set(String::new());
                        if is_signup {
                            set_screen.set(Screen::SignIn);
                        } else {
                            set_screen.set(Screen::SignUp);
                        }
                    }
                >
                    {if is_signup { "Already have an account? Sign in" } else { "Need an account? Create one" }}
                </button>
            </form>
        </div>
    }
}

fn dashboard_screen(
    set_screen: WriteSignal<Screen>,
    auth_user: ReadSignal<Option<User>>,
    set_auth_user: WriteSignal<Option<User>>,
    set_auth_prompt: WriteSignal<String>,
) -> impl IntoView {
    let (pages, set_pages) = signal(Vec::<Page>::new());
    let (api_status, set_api_status) = signal("Loading Rust workspace...".to_string());
    let (display_name, set_display_name) = signal(
        auth_user
            .get_untracked()
            .and_then(|user| user.name.or(user.email))
            .map(|name| first_name(&name))
            .unwrap_or_else(|| "workspace".to_string()),
    );
    let (search_open, set_search_open) = signal(false);
    let (search_query, set_search_query) = signal(String::new());
    let (search_results, set_search_results) = signal(Vec::<Page>::new());
    let (search_status, set_search_status) = signal("Recent pages".to_string());
    let (calendar_events, set_calendar_events) = signal(Vec::<CalendarEvent>::new());
    let (calendar_status, set_calendar_status) =
        signal("Loading calendar-linked pages...".to_string());
    let (ai_prompt, set_ai_prompt) = signal(String::new());
    let (ai_status, set_ai_status) = signal("Ask about your saved pages.".to_string());
    let (ai_message, set_ai_message) = signal(String::new());

    refresh_dashboard_data(
        set_api_status,
        set_display_name,
        set_pages,
        set_auth_user,
        set_screen,
        set_auth_prompt,
    );
    refresh_calendar_data(
        set_calendar_events,
        set_calendar_status,
        set_auth_user,
        set_screen,
        set_auth_prompt,
    );

    let refresh = move |_| {
        refresh_dashboard_data(
            set_api_status,
            set_display_name,
            set_pages,
            set_auth_user,
            set_screen,
            set_auth_prompt,
        );
        refresh_calendar_data(
            set_calendar_events,
            set_calendar_status,
            set_auth_user,
            set_screen,
            set_auth_prompt,
        );
    };

    let open_search = move |_| {
        set_search_open.set(true);
        run_page_search(
            search_query.get_untracked(),
            set_search_results,
            set_search_status,
            set_auth_user,
            set_screen,
            set_auth_prompt,
        );
    };

    let ask_ai_submit = move |event: SubmitEvent| {
        event.prevent_default();
        ask_noteflow_ai(
            ai_prompt.get_untracked(),
            set_ai_status,
            set_ai_message,
            set_auth_user,
            set_screen,
            set_auth_prompt,
        );
    };

    view! {
        <div class="dashboard">
            <aside class="sidebar">
                <div class="sidebar-header">
                    <strong>
                        {move || {
                            let name = auth_user
                                .get()
                                .and_then(|user| user.name.or(user.email))
                                .unwrap_or_else(|| "NoteFlow".to_string());
                            format!("{name}'s NoteFlow")
                        }}
                    </strong>
                    <button class="icon-button" type="button" title="Collapse sidebar">"‹"</button>
                </div>

                <button class="search-button" type="button" on:click=open_search>
                    <span>"⌕"</span>
                    "Search"
                </button>

                <nav class="nav-list" aria-label="Workspace">
                    <SidebarItem active=true icon="⌂" label="Home" />
                    <SidebarItem active=false icon="☷" label="Meetings" />
                    <SidebarItem active=false icon="✦" label="NoteFlow AI" />
                    <SidebarItem active=false icon="□" label="Inbox" />
                    <SidebarItem active=false icon="▤" label="Library" />
                </nav>

                <section class="sidebar-section">
                    <p>"Private"</p>
                    {move || pages.get().into_iter().map(|page| sidebar_page_item(page, set_screen)).collect_view()}
                </section>

                <div class="sidebar-footer">
                    <SidebarItem active=false icon="⚙" label="Settings" />
                    <SidebarItem active=false icon="◇" label="Explore" />
                    <button
                        class="sidebar-item"
                        type="button"
                        on:click=move |_| logout_and_land(set_auth_user, set_auth_prompt, set_screen)
                    >
                        <span>"⇥"</span>
                        "Logout"
                    </button>
                </div>
            </aside>

            <main class="dashboard-main">
                <header class="dashboard-header">
                    <button class="outline-button" type="button" on:click=refresh>
                        "Refresh API"
                    </button>
                    <button
                        class="ghost-button"
                        type="button"
                        on:click=move |_| logout_and_land(set_auth_user, set_auth_prompt, set_screen)
                    >
                        "Logout"
                    </button>
                    <button
                        class="primary-button"
                        type="button"
                        on:click=move |_| create_page_and_open(
                            set_api_status,
                            set_pages,
                            set_screen,
                            set_auth_user,
                            set_auth_prompt,
                        )
                    >
                        "New page"
                    </button>
                </header>

                <section class="dashboard-content">
                    <h1>{move || format!("Good evening, {}", display_name.get())}</h1>
                    <p class="api-status">{move || api_status.get()}</p>

                    <section class="panel-section">
                        <SectionTitle icon="◷" label="Recently visited" />
                        {move || if pages.get().is_empty() {
                            view! {
                                <div class="empty-state">
                                    <h2>"No pages yet"</h2>
                                    <p>"Create the first Rust-backed page and start writing."</p>
                                    <button
                                        class="primary-button"
                                        type="button"
                                        on:click=move |_| create_page_and_open(
                                            set_api_status,
                                            set_pages,
                                            set_screen,
                                            set_auth_user,
                                            set_auth_prompt,
                                        )
                                    >
                                        "New page"
                                    </button>
                                </div>
                            }.into_any()
                        } else {
                            view! {
                                <div class="recent-grid">
                                    {pages.get().into_iter().map(|page| recent_page_card(page, set_screen)).collect_view()}
                                </div>
                            }.into_any()
                        }}
                    </section>

                    <section class="panel-section">
                        <SectionTitle icon="◴" label="Upcoming events" />
                        <div class="events-panel">
                            {move || if calendar_events.get().is_empty() {
                                view! {
                                    <div class="event-row">
                                        <strong>"Postgres"</strong>
                                        <span class="event-bar neutral"></span>
                                        <p>{calendar_status.get()}</p>
                                    </div>
                                }.into_any()
                            } else {
                                view! {
                                    <>
                                        {calendar_events.get().into_iter().map(calendar_event_row).collect_view()}
                                    </>
                                }.into_any()
                            }}
                        </div>
                    </section>

                    <section class="panel-section">
                        <SectionTitle icon="▦" label="Home views" />
                        <div class="home-grid">
                            <HabitTracker />
                            <AiPanel
                                ai_prompt=ai_prompt
                                set_ai_prompt=set_ai_prompt
                                ai_status=ai_status
                                ai_message=ai_message
                                on_submit=ask_ai_submit
                            />
                            <TodoPanel />
                        </div>
                    </section>
                </section>
            </main>

            {move || if search_open.get() {
                view! {
                    <div class="command-backdrop">
                        <section class="command-panel" aria-label="Command palette">
                            <div class="command-header">
                                <span>"⌕"</span>
                                <input
                                    type="search"
                                    placeholder="Search pages"
                                    aria-label="Search pages"
                                    prop:value=move || search_query.get()
                                    on:input=move |event| {
                                        let query = event_target_value(&event);
                                        set_search_query.set(query.clone());
                                        run_page_search(
                                            query,
                                            set_search_results,
                                            set_search_status,
                                            set_auth_user,
                                            set_screen,
                                            set_auth_prompt,
                                        );
                                    }
                                />
                                <button
                                    class="icon-button"
                                    type="button"
                                    title="Close search"
                                    on:click=move |_| set_search_open.set(false)
                                >
                                    "×"
                                </button>
                            </div>
                            <p class="command-status">{move || search_status.get()}</p>
                            <div class="command-results">
                                {move || if search_results.get().is_empty() {
                                    view! {
                                        <p class="command-empty">"No matching pages yet."</p>
                                    }.into_any()
                                } else {
                                    view! {
                                        <>
                                            {search_results
                                                .get()
                                                .into_iter()
                                                .map(|page| command_result_row(page, set_screen, set_search_open))
                                                .collect_view()}
                                        </>
                                    }.into_any()
                                }}
                            </div>
                        </section>
                    </div>
                }.into_any()
            } else {
                view! { <></> }.into_any()
            }}
        </div>
    }
}

fn editor_screen(
    page_id: String,
    set_screen: WriteSignal<Screen>,
    set_auth_user: WriteSignal<Option<User>>,
    set_auth_prompt: WriteSignal<String>,
) -> impl IntoView {
    let (page, set_page) = signal(None::<Page>);
    let (title, set_title) = signal(String::new());
    let (body, set_body) = signal(String::new());
    let (content_editable, set_content_editable) = signal(true);
    let (save_status, set_save_status) = signal("Loading page...".to_string());
    let (save_timeout, set_save_timeout) = signal(None::<i32>);

    load_editor_page(
        page_id.clone(),
        set_page,
        set_title,
        set_body,
        set_content_editable,
        set_save_status,
        set_auth_user,
        set_screen,
        set_auth_prompt,
    );

    let on_title_input = {
        let page_id = page_id.clone();
        move |event| {
            set_title.set(event_target_value(&event));
            schedule_editor_save(
                page_id.clone(),
                title,
                body,
                content_editable,
                set_page,
                set_save_status,
                save_timeout,
                set_save_timeout,
                set_auth_user,
                set_screen,
                set_auth_prompt,
            );
        }
    };

    let on_body_input = {
        let page_id = page_id.clone();
        move |event| {
            set_body.set(event_target_value(&event));
            schedule_editor_save(
                page_id.clone(),
                title,
                body,
                content_editable,
                set_page,
                set_save_status,
                save_timeout,
                set_save_timeout,
                set_auth_user,
                set_screen,
                set_auth_prompt,
            );
        }
    };

    let toggle_calendar = {
        let page_id = page_id.clone();
        move |_| {
            toggle_page_calendar(
                page_id.clone(),
                page,
                set_page,
                set_save_status,
                set_auth_user,
                set_screen,
                set_auth_prompt,
            );
        }
    };

    view! {
        <div class="editor-layout">
            <aside class="sidebar editor-sidebar">
                <div class="sidebar-header">
                    <strong>"NoteFlow editor"</strong>
                </div>
                <button class="sidebar-item" type="button" on:click=move |_| set_screen.set(Screen::Dashboard)>
                    <span>"←"</span>
                    "Back to dashboard"
                </button>
                <button
                    class="sidebar-item"
                    type="button"
                    on:click=move |_| logout_and_land(set_auth_user, set_auth_prompt, set_screen)
                >
                    <span>"⇥"</span>
                    "Logout"
                </button>
                <div class="editor-meta">
                    <span>"Page"</span>
                    <strong>{move || page.get().map(|page| page.id).unwrap_or_else(|| page_id.clone())}</strong>
                </div>
                <div class="editor-meta">
                    <span>"Calendar"</span>
                    <strong>{move || calendar_link_label(page.get())}</strong>
                </div>
            </aside>

            <main class="editor-main">
                <header class="editor-toolbar">
                    <button class="ghost-button" type="button" on:click=move |_| set_screen.set(Screen::Dashboard)>
                        "Dashboard"
                    </button>
                    <span class="save-state">{move || save_status.get()}</span>
                    <button class="outline-button" type="button" on:click=toggle_calendar>
                        {move || if page.get().is_some_and(|page| page.calendar_sync_enabled) {
                            "Unlink calendar"
                        } else {
                            "Link calendar"
                        }}
                    </button>
                    <button
                        class="outline-button"
                        type="button"
                        on:click=move |_| logout_and_land(set_auth_user, set_auth_prompt, set_screen)
                    >
                        "Logout"
                    </button>
                </header>

                <section class="editor-surface">
                    <input
                        class="title-editor"
                        type="text"
                        placeholder="Untitled"
                        prop:value=move || title.get()
                        on:input=on_title_input
                    />

                    {move || if content_editable.get() {
                        view! { <p class="editor-hint">"Autosaves to Postgres as minimal ProseMirror JSON."</p> }.into_any()
                    } else {
                        view! {
                            <p class="editor-hint warning">
                                "This page contains richer content than the native MVP can edit. The body is read-only and will be preserved."
                            </p>
                        }.into_any()
                    }}

                    <textarea
                        class="body-editor"
                        placeholder="Start writing..."
                        prop:value=move || body.get()
                        readonly=move || !content_editable.get()
                        on:input=on_body_input
                    ></textarea>
                </section>
            </main>
        </div>
    }
}

fn restore_auth_session(
    set_auth_checked: WriteSignal<bool>,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
) {
    spawn_local(async move {
        let client = match ParityApiClient::from_base_url(&api_base_url()) {
            Ok(client) => client,
            Err(_) => {
                set_auth_user.set(None);
                set_screen.set(Screen::Landing);
                set_auth_checked.set(true);
                return;
            }
        };

        match client.me().await {
            Ok(user) => {
                set_auth_user.set(Some(user));
                set_screen.set(Screen::Dashboard);
            }
            Err(_) => {
                set_auth_user.set(None);
                set_screen.set(Screen::Landing);
            }
        }

        set_auth_checked.set(true);
    });
}

fn open_workspace_or_signup(
    auth_user: ReadSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) {
    if auth_user.get_untracked().is_some() {
        set_auth_prompt.set(String::new());
        set_screen.set(Screen::Dashboard);
    } else {
        route_to_signup(
            set_screen,
            set_auth_prompt,
            "Create an account to open your workspace.",
        );
    }
}

fn route_to_signup(
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
    message: impl Into<String>,
) {
    set_auth_prompt.set(message.into());
    set_screen.set(Screen::SignUp);
}

fn handle_client_auth_error(
    error: &ClientError,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) -> bool {
    if matches!(error, ClientError::Unauthenticated) {
        set_auth_user.set(None);
        route_to_signup(
            set_screen,
            set_auth_prompt,
            "Create an account or sign in to continue.",
        );
        return true;
    }

    false
}

fn logout_and_land(
    set_auth_user: WriteSignal<Option<User>>,
    set_auth_prompt: WriteSignal<String>,
    set_screen: WriteSignal<Screen>,
) {
    spawn_local(async move {
        if let Ok(client) = ParityApiClient::from_base_url(&api_base_url()) {
            let _ = client.logout().await;
        }

        set_auth_user.set(None);
        set_auth_prompt.set(String::new());
        set_screen.set(Screen::Landing);
    });
}

fn refresh_dashboard_data(
    set_api_status: WriteSignal<String>,
    set_display_name: WriteSignal<String>,
    set_pages: WriteSignal<Vec<Page>>,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) {
    set_api_status.set("Refreshing from Rust API...".to_string());
    spawn_local(async move {
        let client = match ParityApiClient::from_base_url(&api_base_url()) {
            Ok(client) => client,
            Err(error) => {
                set_api_status.set(error.to_string());
                return;
            }
        };

        match client.me().await {
            Ok(user) => {
                if let Some(name) = user.name.clone().or(user.email.clone()) {
                    set_display_name.set(first_name(&name));
                }
                set_auth_user.set(Some(user));
            }
            Err(error) => {
                if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                    return;
                }
                set_api_status.set(format!("Auth: {error}"));
                return;
            }
        }

        match client.list_workspaces().await {
            Ok(workspaces) => {
                if let Some(workspace) = workspaces.first() {
                    match client.list_pages(&workspace.id).await {
                        Ok(api_pages) => {
                            let count = api_pages.len();
                            set_pages.set(api_pages);
                            set_api_status
                                .set(format!("Synced {count} page(s) from {}", workspace.name));
                        }
                        Err(error) => {
                            if handle_client_auth_error(
                                &error,
                                set_auth_user,
                                set_screen,
                                set_auth_prompt,
                            ) {
                                return;
                            }
                            set_api_status.set(format!("Pages: {error}"));
                        }
                    }
                } else {
                    set_pages.set(Vec::new());
                    set_api_status.set("Signed in, but no workspace exists yet.".to_string());
                }
            }
            Err(error) => {
                if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                    return;
                }
                set_api_status.set(format!("Workspaces: {error}"));
            }
        }
    });
}

fn run_page_search(
    query: String,
    set_search_results: WriteSignal<Vec<Page>>,
    set_search_status: WriteSignal<String>,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) {
    let query = query.trim().to_string();
    let label = if query.is_empty() {
        "Recent pages".to_string()
    } else {
        format!("Searching for \"{query}\"...")
    };
    set_search_status.set(label);

    spawn_local(async move {
        let client = match ParityApiClient::from_base_url(&api_base_url()) {
            Ok(client) => client,
            Err(error) => {
                set_search_status.set(error.to_string());
                return;
            }
        };

        match client.search_pages(&query).await {
            Ok(results) => {
                let count = results.len();
                set_search_results.set(results);
                if query.is_empty() {
                    set_search_status.set(format!("{count} recent page(s)"));
                } else {
                    set_search_status.set(format!("{count} page result(s)"));
                }
            }
            Err(error) => {
                if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                    return;
                }
                set_search_status.set(format!("Search failed: {error}"));
            }
        }
    });
}

fn refresh_calendar_data(
    set_calendar_events: WriteSignal<Vec<CalendarEvent>>,
    set_calendar_status: WriteSignal<String>,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) {
    set_calendar_status.set("Loading calendar-linked pages...".to_string());
    spawn_local(async move {
        let client = match ParityApiClient::from_base_url(&api_base_url()) {
            Ok(client) => client,
            Err(error) => {
                set_calendar_status.set(error.to_string());
                return;
            }
        };

        if let Err(error) = client.integration_status().await {
            if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                return;
            }
            set_calendar_status.set(format!("Calendar: {error}"));
            return;
        }

        match client.list_events().await {
            Ok(events) => {
                let count = events.len();
                set_calendar_events.set(events);
                if count == 0 {
                    set_calendar_status
                        .set("No calendar-linked pages in Postgres yet.".to_string());
                } else {
                    set_calendar_status.set(format!("{count} calendar-linked page(s)"));
                }
            }
            Err(error) => {
                if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                    return;
                }
                set_calendar_status.set(format!("Calendar: {error}"));
            }
        }
    });
}

fn ask_noteflow_ai(
    prompt: String,
    set_ai_status: WriteSignal<String>,
    set_ai_message: WriteSignal<String>,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) {
    let prompt = prompt.trim().to_string();
    if prompt.is_empty() {
        set_ai_status.set("Ask about your saved pages.".to_string());
        return;
    }

    set_ai_status.set("Reading Postgres pages...".to_string());
    set_ai_message.set(String::new());
    spawn_local(async move {
        let client = match ParityApiClient::from_base_url(&api_base_url()) {
            Ok(client) => client,
            Err(error) => {
                set_ai_status.set(error.to_string());
                return;
            }
        };

        match client.send_message(&prompt).await {
            Ok(message) => {
                set_ai_status.set("Answered from Rust/Postgres data.".to_string());
                set_ai_message.set(message.content);
            }
            Err(error) => {
                if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                    return;
                }
                set_ai_status.set(format!("AI failed: {error}"));
            }
        }
    });
}

fn create_page_and_open(
    set_api_status: WriteSignal<String>,
    set_pages: WriteSignal<Vec<Page>>,
    set_screen: WriteSignal<Screen>,
    set_auth_user: WriteSignal<Option<User>>,
    set_auth_prompt: WriteSignal<String>,
) {
    set_api_status.set("Creating page...".to_string());
    spawn_local(async move {
        let client = match ParityApiClient::from_base_url(&api_base_url()) {
            Ok(client) => client,
            Err(error) => {
                set_api_status.set(error.to_string());
                return;
            }
        };

        let workspace = match client.list_workspaces().await {
            Ok(workspaces) => workspaces.into_iter().next(),
            Err(error) => {
                if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                    return;
                }
                set_api_status.set(format!("Workspaces: {error}"));
                return;
            }
        };

        let Some(workspace) = workspace else {
            set_api_status.set("No workspace exists yet.".to_string());
            return;
        };

        match client
            .create_page(
                &workspace.id,
                Some("Untitled"),
                Some(editor_doc_from_text("")),
            )
            .await
        {
            Ok(page) => {
                let page_id = page.id.clone();
                set_pages.update(|pages| pages.insert(0, page));
                set_api_status.set("Created Untitled.".to_string());
                set_screen.set(Screen::Editor(page_id));
            }
            Err(error) => {
                if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                    return;
                }
                set_api_status.set(format!("Create page: {error}"));
            }
        }
    });
}

fn load_editor_page(
    page_id: String,
    set_page: WriteSignal<Option<Page>>,
    set_title: WriteSignal<String>,
    set_body: WriteSignal<String>,
    set_content_editable: WriteSignal<bool>,
    set_save_status: WriteSignal<String>,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) {
    spawn_local(async move {
        let client = match ParityApiClient::from_base_url(&api_base_url()) {
            Ok(client) => client,
            Err(error) => {
                set_save_status.set(error.to_string());
                return;
            }
        };

        match client.get_page(&page_id).await {
            Ok(page) => {
                let decoded = decode_editor_content(page.content.as_ref());
                set_title.set(page.title.clone());
                set_body.set(decoded.text);
                set_content_editable.set(decoded.editable);
                set_page.set(Some(page));
                set_save_status.set("Saved".to_string());
            }
            Err(error) => {
                if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                    return;
                }
                set_save_status.set(format!("Load failed: {error}"));
            }
        }
    });
}

#[cfg(target_arch = "wasm32")]
fn schedule_editor_save(
    page_id: String,
    title: ReadSignal<String>,
    body: ReadSignal<String>,
    content_editable: ReadSignal<bool>,
    set_page: WriteSignal<Option<Page>>,
    set_save_status: WriteSignal<String>,
    save_timeout: ReadSignal<Option<i32>>,
    set_save_timeout: WriteSignal<Option<i32>>,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) {
    if let Some(window) = web_sys::window() {
        if let Some(handle) = save_timeout.get_untracked() {
            window.clear_timeout_with_handle(handle);
        }

        set_save_status.set("Unsaved changes...".to_string());
        let page_id_for_callback = page_id.clone();
        let callback = Closure::wrap(Box::new(move || {
            set_save_timeout.set(None);
            save_editor_now(
                page_id_for_callback.clone(),
                title,
                body,
                content_editable,
                set_page,
                set_save_status,
                set_auth_user,
                set_screen,
                set_auth_prompt,
            );
        }) as Box<dyn FnMut()>);

        match window.set_timeout_with_callback_and_timeout_and_arguments_0(
            callback.as_ref().unchecked_ref(),
            700,
        ) {
            Ok(handle) => {
                set_save_timeout.set(Some(handle));
                callback.forget();
            }
            Err(_) => save_editor_now(
                page_id,
                title,
                body,
                content_editable,
                set_page,
                set_save_status,
                set_auth_user,
                set_screen,
                set_auth_prompt,
            ),
        }
    } else {
        save_editor_now(
            page_id,
            title,
            body,
            content_editable,
            set_page,
            set_save_status,
            set_auth_user,
            set_screen,
            set_auth_prompt,
        );
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn schedule_editor_save(
    page_id: String,
    title: ReadSignal<String>,
    body: ReadSignal<String>,
    content_editable: ReadSignal<bool>,
    set_page: WriteSignal<Option<Page>>,
    set_save_status: WriteSignal<String>,
    _save_timeout: ReadSignal<Option<i32>>,
    _set_save_timeout: WriteSignal<Option<i32>>,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) {
    save_editor_now(
        page_id,
        title,
        body,
        content_editable,
        set_page,
        set_save_status,
        set_auth_user,
        set_screen,
        set_auth_prompt,
    );
}

fn save_editor_now(
    page_id: String,
    title: ReadSignal<String>,
    body: ReadSignal<String>,
    content_editable: ReadSignal<bool>,
    set_page: WriteSignal<Option<Page>>,
    set_save_status: WriteSignal<String>,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) {
    let title_value = title.get_untracked();
    let content = content_editable
        .get_untracked()
        .then(|| editor_doc_from_text(&body.get_untracked()));
    set_save_status.set("Saving...".to_string());

    spawn_local(async move {
        let client = match ParityApiClient::from_base_url(&api_base_url()) {
            Ok(client) => client,
            Err(error) => {
                set_save_status.set(error.to_string());
                return;
            }
        };

        match client
            .update_page(
                &page_id,
                UpdatePageRequest {
                    title: Some(title_value),
                    content,
                },
            )
            .await
        {
            Ok(page) => {
                set_page.set(Some(page));
                set_save_status.set("Saved".to_string());
            }
            Err(error) => {
                if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                    return;
                }
                set_save_status.set(format!("Save failed: {error}"));
            }
        }
    });
}

fn toggle_page_calendar(
    page_id: String,
    page: ReadSignal<Option<Page>>,
    set_page: WriteSignal<Option<Page>>,
    set_save_status: WriteSignal<String>,
    set_auth_user: WriteSignal<Option<User>>,
    set_screen: WriteSignal<Screen>,
    set_auth_prompt: WriteSignal<String>,
) {
    let Some(current_page) = page.get_untracked() else {
        set_save_status.set("Calendar is waiting for the page to load.".to_string());
        return;
    };
    let should_link = !current_page.calendar_sync_enabled;

    if should_link {
        set_save_status.set("Linking calendar...".to_string());
    } else {
        set_save_status.set("Unlinking calendar...".to_string());
    }

    spawn_local(async move {
        let client = match ParityApiClient::from_base_url(&api_base_url()) {
            Ok(client) => client,
            Err(error) => {
                set_save_status.set(error.to_string());
                return;
            }
        };

        match client
            .update_page_calendar(
                &page_id,
                UpdatePageCalendarRequest {
                    calendar_sync_enabled: should_link,
                    calendar_event_id: None,
                },
            )
            .await
        {
            Ok(page) => {
                set_page.set(Some(page));
                if should_link {
                    set_save_status.set("Calendar linked.".to_string());
                } else {
                    set_save_status.set("Calendar unlinked.".to_string());
                }
            }
            Err(error) => {
                if handle_client_auth_error(&error, set_auth_user, set_screen, set_auth_prompt) {
                    return;
                }
                set_save_status.set(format!("Calendar failed: {error}"));
            }
        }
    });
}

#[component]
fn SignalBadge(label: &'static str, value: &'static str) -> impl IntoView {
    view! {
        <div class="signal-badge">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    }
}

fn sidebar_page_item(page: Page, set_screen: WriteSignal<Screen>) -> impl IntoView {
    let icon = page.icon.unwrap_or_else(|| "▣".to_string());
    let title = page.title;
    let page_id = page.id;

    view! {
        <button class="sidebar-item" type="button" on:click=move |_| set_screen.set(Screen::Editor(page_id.clone()))>
            <span>{icon}</span>
            {title}
        </button>
    }
}

fn command_result_row(
    page: Page,
    set_screen: WriteSignal<Screen>,
    set_search_open: WriteSignal<bool>,
) -> impl IntoView {
    let icon = page.icon.unwrap_or_else(|| "▣".to_string());
    let title = page.title;
    let page_id = page.id;
    let excerpt = page_excerpt(page.content.as_ref());

    view! {
        <button
            class="command-result"
            type="button"
            on:click=move |_| {
                set_search_open.set(false);
                set_screen.set(Screen::Editor(page_id.clone()));
            }
        >
            <span class="command-result-icon">{icon}</span>
            <span>
                <strong>{title}</strong>
                <small>{excerpt}</small>
            </span>
        </button>
    }
}

fn calendar_event_row(event: CalendarEvent) -> impl IntoView {
    let date = calendar_date_label(&event.start_iso);
    let title = event.title;

    view! {
        <div class="event-row">
            <strong>{date}</strong>
            <span class="event-bar blue"></span>
            <p>{title}</p>
        </div>
    }
}

#[component]
fn SidebarItem(active: bool, icon: &'static str, label: &'static str) -> impl IntoView {
    view! {
        <button class=if active { "sidebar-item active" } else { "sidebar-item" } type="button">
            <span>{icon}</span>
            {label}
        </button>
    }
}

#[component]
fn SectionTitle(icon: &'static str, label: &'static str) -> impl IntoView {
    view! {
        <div class="section-title">
            <span>{icon}</span>
            <h2>{label}</h2>
        </div>
    }
}

#[component]
fn AiPanel(
    ai_prompt: ReadSignal<String>,
    set_ai_prompt: WriteSignal<String>,
    ai_status: ReadSignal<String>,
    ai_message: ReadSignal<String>,
    on_submit: impl Fn(SubmitEvent) + 'static,
) -> impl IntoView {
    view! {
        <form class="home-panel ai-panel" on:submit=on_submit>
            <h3>"NoteFlow AI"</h3>
            <textarea
                class="ai-prompt"
                placeholder="Ask about your saved pages..."
                prop:value=move || ai_prompt.get()
                on:input=move |event| set_ai_prompt.set(event_target_value(&event))
            ></textarea>
            <div class="ai-actions">
                <span>{move || ai_status.get()}</span>
                <button class="outline-button" type="submit">
                    "Ask"
                </button>
            </div>
            {move || if ai_message.get().is_empty() {
                view! { <p class="ai-answer muted-text">"Answers use the Rust API and Postgres page search." </p> }.into_any()
            } else {
                view! { <p class="ai-answer">{ai_message.get()}</p> }.into_any()
            }}
        </form>
    }
}

#[component]
fn HabitTracker() -> impl IntoView {
    let rows = vec![
        (
            "New Notes",
            vec![
                4, 1, 0, 0, 0, 2, 2, 4, 0, 0, 0, 4, 2, 2, 3, 1, 2, 2, 4, 0, 0, 0, 2, 2, 0, 0, 0, 0,
            ],
        ),
        (
            "To-Dos",
            vec![
                3, 3, 0, 2, 3, 3, 3, 0, 2, 3, 3, 2, 0, 2, 3, 3, 0, 2, 3, 2, 0, 2, 3, 3, 0, 2, 2, 0,
            ],
        ),
        (
            "Daily Review",
            vec![
                0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2, 0, 0, 2, 0, 1, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 2, 0,
            ],
        ),
    ];

    view! {
        <article class="home-panel">
            <div class="home-panel-heading">
                <h3>"Habit Tracker"</h3>
                <span>"Last 4 weeks"</span>
                <strong>"🔥 4 day streak"</strong>
            </div>
            <div class="habit-list">
                {rows.into_iter().map(|(label, cells)| view! {
                    <div class="habit-row">
                        <span>{label}</span>
                        <div class="habit-cells">
                            {cells.into_iter().map(|level| view! {
                                <i class=format!("habit-cell level-{level}")></i>
                            }).collect_view()}
                        </div>
                    </div>
                }).collect_view()}
            </div>
        </article>
    }
}

#[component]
fn TodoPanel() -> impl IntoView {
    view! {
        <article class="home-panel todo-panel">
            <h3>"To-Dos"</h3>
            <label><input type="checkbox" checked /> <span>"Wake up and freshen up"</span></label>
            <label><input type="checkbox" /> <span>"Have breakfast"</span></label>
            <label><input type="checkbox" /> <span>"Morning workout"</span></label>
        </article>
    }
}

fn recent_page_card(page: Page, set_screen: WriteSignal<Screen>) -> impl IntoView {
    let icon = page.icon.unwrap_or_else(|| "▣".to_string());
    let title = page.title;
    let page_id = page.id;

    view! {
        <button class="recent-card" type="button" on:click=move |_| set_screen.set(Screen::Editor(page_id.clone()))>
            <span class="recent-cover">{icon}</span>
            <strong>{title}</strong>
            <small>"Postgres page"</small>
        </button>
    }
}

fn page_excerpt(content: Option<&Value>) -> String {
    let text = content
        .map(|content| editable_doc_text(content).unwrap_or_else(|| readable_text(content)))
        .unwrap_or_default();
    let excerpt = text
        .split_whitespace()
        .take(18)
        .collect::<Vec<_>>()
        .join(" ");

    if excerpt.is_empty() {
        "No body text yet".to_string()
    } else {
        excerpt
    }
}

fn calendar_date_label(start_iso: &str) -> String {
    start_iso
        .split_once('T')
        .map(|(date, _)| date.to_string())
        .filter(|date| !date.is_empty())
        .unwrap_or_else(|| start_iso.to_string())
}

fn calendar_link_label(page: Option<Page>) -> String {
    match page {
        Some(page) if page.calendar_sync_enabled => {
            let event_id = page
                .calendar_event_id
                .unwrap_or_else(|| "local event".to_string());
            format!("Linked: {event_id}")
        }
        Some(_) => "Not linked".to_string(),
        None => "Loading".to_string(),
    }
}

fn decode_editor_content(content: Option<&Value>) -> DecodedContent {
    let Some(content) = content else {
        return DecodedContent {
            text: String::new(),
            editable: true,
        };
    };

    if let Some(text) = editable_doc_text(content) {
        return DecodedContent {
            text,
            editable: true,
        };
    }

    let text = readable_text(content);
    DecodedContent {
        text: if text.is_empty() {
            serde_json::to_string_pretty(content).unwrap_or_default()
        } else {
            text
        },
        editable: false,
    }
}

fn editable_doc_text(value: &Value) -> Option<String> {
    if value.get("type")?.as_str()? != "doc" {
        return None;
    }

    let Some(blocks) = value.get("content").and_then(Value::as_array) else {
        return Some(String::new());
    };

    blocks
        .iter()
        .map(paragraph_text)
        .collect::<Option<Vec<_>>>()
        .map(|paragraphs| paragraphs.join("\n\n"))
}

fn paragraph_text(value: &Value) -> Option<String> {
    if value.get("type")?.as_str()? != "paragraph" {
        return None;
    }

    let Some(children) = value.get("content").and_then(Value::as_array) else {
        return Some(String::new());
    };

    let mut text = String::new();
    for child in children {
        if child.get("type").and_then(Value::as_str) != Some("text") {
            return None;
        }
        text.push_str(
            child
                .get("text")
                .and_then(Value::as_str)
                .unwrap_or_default(),
        );
    }
    Some(text)
}

fn readable_text(value: &Value) -> String {
    let mut text = String::new();
    collect_readable_text(value, &mut text);
    text.lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

fn collect_readable_text(value: &Value, text: &mut String) {
    if let Some(raw) = value.get("text").and_then(Value::as_str) {
        text.push_str(raw);
    }

    if let Some(children) = value.get("content").and_then(Value::as_array) {
        for child in children {
            collect_readable_text(child, text);
            if matches!(
                child.get("type").and_then(Value::as_str),
                Some("paragraph" | "heading" | "listItem")
            ) {
                text.push('\n');
            }
        }
    }
}

fn editor_doc_from_text(text: &str) -> Value {
    let paragraphs = if text.is_empty() {
        vec![json!({
            "type": "paragraph",
            "content": []
        })]
    } else {
        text.split("\n\n")
            .map(|paragraph| {
                if paragraph.is_empty() {
                    json!({
                        "type": "paragraph",
                        "content": []
                    })
                } else {
                    json!({
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": paragraph
                            }
                        ]
                    })
                }
            })
            .collect()
    };

    json!({
        "type": "doc",
        "content": paragraphs
    })
}

fn api_base_url() -> String {
    if let Some(base_url) = option_env!("NOTEFLOW_API_BASE_URL") {
        return base_url.to_string();
    }

    if running_in_tauri_origin() {
        "http://api.tauri.localhost:3317".to_string()
    } else {
        "http://127.0.0.1:3317".to_string()
    }
}

#[cfg(target_arch = "wasm32")]
fn running_in_tauri_origin() -> bool {
    web_sys::window()
        .and_then(|window| window.location().hostname().ok())
        .is_some_and(|hostname| hostname == "tauri.localhost")
}

#[cfg(not(target_arch = "wasm32"))]
fn running_in_tauri_origin() -> bool {
    false
}

fn first_name(name: &str) -> String {
    name.split_whitespace()
        .next()
        .filter(|value| !value.is_empty())
        .unwrap_or(name)
        .to_string()
}

/// Called by the browser when the wasm module is loaded.
#[wasm_bindgen(start)]
pub fn bootstrap() {
    console_error_panic_hook::set_once();
    mount_to_body(App);
}
