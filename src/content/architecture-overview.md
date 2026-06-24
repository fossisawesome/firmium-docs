# Desktop Architecture

This page is a tour of how the Firmium desktop app is built, for anyone who wants to read the code, fix a bug, or add a feature. For a higher-level introduction to the whole project (including the Android app), see the [Developer Overview](/developer-overview).

## Desktop app

The desktop app is a native [iced](https://iced.rs) (Rust) application — a single binary, no web view and no JavaScript. The UI and the backend (audio engine, OpenSubsonic client, database, queue manager) live in the same process: the UI calls backend functions directly via `iced::Task`, and the backend pushes playback/queue events back to the UI over an in-process event bus.

```
firmium/
  src/                iced UI
    main.rs           Entry point: builds the backend, runs iced::application
    app.rs            App struct (all UI state), Message enum, update(), view()
    theme.rs          TOML theme tokens -> iced Theme + dynamic accent
    icons.rs          Bundled SVG icon set (recolored per theme)
    viz.rs            Visualizer canvas (bars / oscilloscope / orb)
    config.rs         ~/.config/<id>/config.toml (server, theme, volume)
  backend/            Rust backend (no UI)
    init.rs           Backend::new(): builds the shared handles, starts queue_manager
    events.rs         EventBus (tokio broadcast) — replaces the old emit/listen
    paths.rs          App data / config / cache directories
    state.rs          AppState: connection info + shared async HTTP client + event bus
    queue_state.rs    QueueState: authoritative queue / playback settings
    queue_manager.rs  Background task draining the bus: crossfade, gapless preload,
                      track advance, scrobbling
    commands/         Plain async/sync fns: auth, credentials, themes, playback,
                      mappers, subsonic (OpenSubsonic API), lyrics, cover_cache,
                      cover_colors, local_library, downloads, equalizer, stats, queue
    audio/            Audio playback: `symphonia` (decode) + `cpal` (output)
  themes/             Built-in color theme files (.toml), embedded at compile time
```

**How a screen works**: each view is a method on `App` in `src/app.rs` that reads `App` state and returns an iced `Element`. User actions emit a `Message`; `App::update` handles it — usually by spawning a backend call with `iced::Task::perform` (e.g. `commands::subsonic::get_albums`) whose result arrives as another `Message`. The backend holds the active connection (server URL, username, password) in `AppState`, builds authenticated OpenSubsonic requests, and maps JSON responses to typed structs via `commands/mappers.rs`. Long lists (albums) use a windowed renderer in `app.rs` that only builds the rows currently on screen.

**Cover art and lyrics**: cover art is cached to disk (`get_cover_art` in `commands/cover_cache.rs`, 200MB budget with LRU eviction) and loaded into an `iced::widget::image::Handle` cached in the `App`, so covers persist across restarts without re-downloading. Lyrics go through a cascade in `commands/subsonic.rs::get_song_lyrics`: OpenSubsonic structured lyrics, then legacy plain-text lyrics, then (if enabled) an LRCLIB lookup; the Lyrics panel highlights the active line by playback position. (The dominant cover color used for accenting is still extracted in Rust by `commands/cover_colors.rs`.)

**Session expiry**: if the server returns HTTP 401 or an OpenSubsonic error code 40/41, the backend emits `BackendEvent::SessionExpired` on the event bus; `App` clears the authed state and returns to the login screen.

**Local library and downloads**: `backend/commands/local_library.rs` scans `~/Music/Firmium` and maps the files it finds into the same `Album`/`Artist`/`Song` shapes used by the OpenSubsonic API, so the views work whether or not you're connected to a server. `backend/commands/downloads.rs` downloads tracks/albums from the server into that same folder (honoring the Download Format setting); both invalidate `local_library.rs`'s scan cache so the local library picks up the new files.

**How playback works**: when you select a track, `App::update` calls a backend queue function (`set_queue`, `set_queue_seamless`, `shuffle_and_play`, `play_queue_index`, ...) in `backend/commands/queue.rs`. The backend resolves the stream URL (checking for a local file match before falling back to a Subsonic stream URL), calls `AudioPlayer::play_stream` in `backend/audio/`, and emits `QueueStateChanged` on the bus so the UI updates. The `queue_manager` task subscribes to the bus: it reacts to `PlaybackPosition` events to trigger crossfade and gapless preload at the right time, and to `PlaybackFinished` events to advance the queue, scrobble, and handle repeat/shuffle. The audio engine (`backend/audio/`) streams from your server, decodes with `symphonia`, and plays through `cpal` at the track's native sample rate.

**Visualizer**: `backend/visualizer.rs` runs FFT analysis on a background task and stores the latest `bass`/`bars`/`wave` snapshot. `src/viz.rs` is an iced `Canvas` that reads that snapshot and draws the bars, oscilloscope, or orb, redrawn at 60fps while the panel is open.

**How themes work**: theme files are TOML — either the built-ins under `themes/` (compiled into the binary) or files the user drops in their config directory. `list_themes` in `backend/commands/themes.rs` merges both sets, and `src/theme.rs` parses the chosen theme's tokens into iced `Color`s. See [Settings & Themes Internals](/settings-themes-internals) for the full mechanism.

**Play history and Recap**: a local SQLite database (`backend/db.rs`, `play_history.db` in the app data dir) records one row per completed track, written from `queue_manager.rs` at the same point it scrobbles. The aggregation queries are exposed through `backend/commands/stats.rs` and power the Stats Export panel and Firmium Recap. It's local-only — no server calls. See [Settings & Themes Internals](/settings-themes-internals#play-history--recap-internals).

**Updates**: `.deb`/`.rpm`/COPR/AUR users update via their package manager. The in-app self-updater (Linux AppImage / Windows) is being reworked for the native build.

## Going further

For a control-by-control walkthrough of the UI (player bar, sidebar, library views, playlists, settings) and the data flow behind it, see [Desktop In-depth](/desktop-indepth-overview).

If your change affects settings, themes, or how the app is built/packaged, remember to update the relevant docs page too: [Settings](/settings), [Customizing Themes](/custom-themes), [Settings & Themes Internals](/settings-themes-internals), or [Building from Source](/building-from-source).
