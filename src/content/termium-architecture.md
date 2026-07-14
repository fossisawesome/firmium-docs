# Termium Architecture

Termium is a terminal (TUI) frontend for Firmium, alongside the desktop ([iced](https://iced.rs)) and Android apps. It shares almost everything with desktop except the UI layer: same audio engine, same OpenSubsonic client, same config file and OS keyring entries. This page is a tour of how it's built, for anyone reading the code or adding a Termium feature. For the higher-level project introduction, see the [Developer Overview](/developer-overview); for the desktop app's own architecture (which Termium's backend is shared with), see [Desktop Architecture](/architecture-overview).

## Workspace layout

`firmium/` is a Cargo workspace with three members:

```
firmium/
  Cargo.toml          workspace root (members: backend, desktop, termium)
  backend/            lib crate "firmium-backend" — audio engine, OpenSubsonic
                       client, queue, config/credentials. No UI dependency
                       (no iced, no ratatui). Same code the desktop app used
                       when it was mounted at the crate root via #[path];
                       now it's a real lib crate both frontends depend on.
  desktop/             bin crate "firmium" — the iced UI (unchanged behavior,
                        just moved from firmium/src/ to firmium/desktop/src/)
  termium/             bin crate "termium" — the TUI, this page's subject
    src/
      main.rs           terminal setup/teardown, tokio runtime, main select! loop
      app.rs            App struct (all UI state), AppEvent, SideEffect, update()
      keymap.rs          key -> Action mapping, defaults + config overrides
      ui/                one render fn per screen (pure fn(&App, &mut Frame, Rect))
        login.rs, home.rs, albums.rs, artists.rs, search.rs, playlists.rs,
        player_bar.rs, visualizer.rs
```

Both `desktop` and `termium` depend on `backend` as a path dependency. Neither `backend` nor `termium` depends on `iced` — a `cargo build -p termium` never touches the GUI toolchain.

## Runtime and event loop

Termium reuses the same async model as desktop: a `tokio` runtime, backend calls spawned as futures, and `BackendEvent`s (`PlaybackStateChanged`, `PlaybackPosition`, `PlaybackFinished`, `QueueStateChanged`, `QueueExhausted`, `SessionExpired`) delivered over the `EventBus` broadcast channel (`firmium_backend::events::EventBus`) — the same enum and channel the desktop app's `iced::Subscription` reads from.

`termium/src/main.rs`'s `run()` loop is a `tokio::select!` over:

- terminal input (`crossterm::event::EventStream`, async)
- the `EventBus` receiver (only subscribed once `App.backend` is `Some`, i.e. after login)
- results of spawned backend calls, delivered back over an internal `mpsc` channel as `AppEvent` variants (`LoginResult`, `AlbumsLoaded`, `ArtistsLoaded`, `SearchResultsLoaded`, `PlaylistsLoaded`)
- a 250ms tick, used for the visualizer snapshot pull and to drive `App::update`'s `AppEvent::Tick` arm

`App::update(&mut self, event: AppEvent) -> Option<SideEffect>` is synchronous — it mutates `App` state and, when a step requires a backend call it can't `.await` inline, returns a `SideEffect` (e.g. `SideEffect::PlayAlbum(id)`, `SideEffect::RunSearch(query)`). `main.rs`'s `perform_side_effect` matches on that and `tokio::spawn`s the actual backend call, sending the result back in as another `AppEvent` on the next loop iteration. This mirrors the iced app's `update` returning an `iced::Task` — same shape, no iced dependency.

## Input handling and screens

`termium/src/keymap.rs` resolves a `crossterm::event::KeyEvent` to an `Action` (`PlayPause`, `NextTrack`, `PrevTrack`, `NavUp`/`Down`/`Left`/`Right`, `Search`, `Activate`, `Quit`). Defaults are vim-style (`hjkl`, `space`, `/`, `q`) with arrow keys always working as an alt nav binding. Users can override any binding via `~/.config/<id>/termium_keymap.toml` (`action = "key"` pairs); `Keymap::load()` merges overrides onto the defaults, falling back (with a stderr warning) if a user-supplied key string doesn't parse.

While the `Login` screen or an unsubmitted `Search` query has focus, `main.rs`'s `handle_key` routes raw characters into `AppEvent::CharInput`/`Backspace` instead of through keymap resolution — this is "typing mode," decided per-keystroke by `app.view` and (for Search) `app.search_submitted`.

Each screen in `termium/src/ui/` is a pure render function taking `&App` and a `ratatui::layout::Rect`. `ui/mod.rs` splits the frame into a main content area, a visualizer strip, and the player bar (`chunks[0]`/`[1]`/`[2]`), and routes the main area to the screen matching `app.view: View`.

## Config and credential sharing

Termium calls the same `firmium_backend::config::Config::load()`/`save()` and `firmium_backend::commands::credentials::{save_password, get_password}` functions the desktop app uses — same `~/.config/<id>/config.toml` path, same OS keyring service name. Logging in from either app makes the saved account visible in the other.

## Visualizer

`firmium_backend::visualizer::VisualizerState` (constructed inside `AudioPlayer`, reached via `AudioPlayer::visualizer()`) already runs FFT analysis on a background task, independent of any renderer. Termium enables it (`set_visualizer_enabled(true)`) on successful login and, on each `Tick`, reads `.bars()` into `App.viz_snapshot`. `ui/visualizer.rs` maps the snapshot to Unicode block characters (▁▂▃▄▅▆▇█) sized to the render area's width — no GPU shader pipeline, unlike desktop's `wgpu`-based visualizer in `desktop/src/viz/`.

## What's shared vs. Termium-specific

Shared with desktop (all in `backend/`, untouched by the workspace split): the OpenSubsonic client (`commands/subsonic.rs`), queue management (`commands/queue.rs`), the audio engine (`audio/`), config/credentials, cover cache, themes. Termium-specific: the entire `termium/src/` tree (state, keymap, rendering) — there is no shared "UI logic" layer between the two frontends, matching how desktop and Android already implement their own UI independently against the same API contract.

Termium's MVP scope is library browsing, search, playlists, playback controls, and the bars visualizer. Lyrics, equalizer, recap, and similar-tracks panels aren't wired up yet.
