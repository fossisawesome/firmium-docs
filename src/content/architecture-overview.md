# Desktop Architecture

A tour of how the Firmium desktop app is built, for anyone who wants to read the code, fix a bug, or add a feature. For the whole project (including Android), see the [Developer Overview](/developer-overview).

## Desktop app

The desktop app is a [Tauri 2](https://tauri.app) application. The window is a webview showing a Svelte 5 UI (`src/`, TypeScript + SCSS) that only renders. All logic is Rust. `firmium/` is a Cargo workspace: the backend (`backend/`: audio engine, OpenSubsonic client, database, queue manager, app logic), the Tauri shell (`src-tauri/`) and the [Termium](/termium-architecture) terminal client (`termium/`). The shell and Termium both depend on the same `backend` crate.

```
firmium/
  Cargo.toml          workspace root (members: backend, src-tauri, termium)
  package.json        Vite + Svelte + sass toolchain for src/
  backend/            lib crate "firmium-backend" - no UI dependency
    core/             App logic shared by UI shells (Core): settings, accounts,
                      library (server/offline routing, Mix, radio, podcasts),
                      playlists (local-first + server sync), stats
    init.rs           Backend::new(): builds the shared handles, starts queue_manager
    events.rs         EventBus (tokio broadcast)
    state.rs          AppState: connection + async HTTP client + event bus
    config.rs         <config dir>/config.toml (server, theme, accounts, playback prefs)
    queue_state.rs    QueueState: authoritative queue / playback settings
    queue_manager.rs  Background task: crossfade, gapless preload, advance, scrobble
    commands/         Plain fns: subsonic (OpenSubsonic API), queue, lyrics,
                      cover_cache, local_library, downloads, equalizer, themes, ...
    podcasts/         RSS fetch/parse + podcasts.db
    audio/            symphonia decode + cpal output
  src-tauri/          bin crate "firmium" - Tauri shell
    src/lib.rs        Builder: creates Core inside the async runtime, registers commands
    src/commands.rs   Thin #[tauri::command] forwarders (errors -> {kind, message})
    src/events.rs     EventBus -> Tauri events
    src/cli.rs        `firmium <cmd>` control-socket client
  src/                Svelte UI
    App.svelte        Shell: layout, startup login, drag-drop import
    views/            One screen per file
    components/       Player bar, side panels, rows, modals
    lib/              api.ts (invoke wrappers), stores.ts (state mirrors), ipc.ts, types.ts
    styles/           SCSS partials, main.scss @uses them
  termium/            bin crate "termium" - TUI frontend
  themes/             Built-in color themes (.toml), embedded in the backend
```

**How a screen works**: a view in `src/views/` calls a typed wrapper in `src/lib/api.ts` (one line over `invoke`). `src-tauri/src/commands.rs` forwards it to a `Core` method (or a `backend::commands` function), which does the work and returns a serializable struct. Views keep that result in local `$state`. Nothing in TypeScript decides *what* to fetch or *how* to combine results beyond filtering a list for display; for example `Core::albums()` picks the server or the offline library depending on whether you're logged in.

**Events**: backend tasks emit `BackendEvent`s on the bus; `src-tauri/src/events.rs` re-emits them as Tauri events (`playback-state-changed`, `playback-position`, `playback-finished`, `queue-state-changed`, `session-expired`). `initBackend()` in `src/lib/stores.ts` subscribes and mirrors them into Svelte stores; the player bar and panels read those stores.

**Cover art and lyrics**: `Core::cover_path` resolves a cover id to a file path (embedded art for `local:` ids, the 200 MB LRU disk cache in `commands/cover_cache.rs` for server ids, and plain image URLs for podcasts). The UI turns the path into a URL with `convertFileSrc` (asset protocol) in the `use:cover` action (`src/lib/cover.ts`). Lyrics go through the cascade in `commands/subsonic.rs::get_song_lyrics` (structured, legacy, then LRCLIB if enabled); `Core::lyrics` adds per-word timing for the karaoke fill (`TimedLyrics`).

**Session expiry**: on HTTP 401 or OpenSubsonic error 40/41 the backend emits `SessionExpired`; `stores.ts` logs out and opens the account modal.

**Playlists**: local-first. `backend/core/playlists.rs` owns the model, persists `playlists.json` and pushes changes to the server best-effort. Every playlist command returns the updated local list. See [Desktop In-depth: Playlists](/desktop-indepth-playlists).

**Local library and downloads**: `commands/local_library.rs` scans `~/Music/Firmium` into the same `Album`/`Artist`/`Song` shapes as the server API, which is why the same views work offline. `commands/downloads.rs` downloads into that folder using the Download Format setting and invalidates the scan cache.

**Playback**: a view calls `Api.setQueueSeamless(songs, idx)` (or `setQueue`, `shuffleAndPlay`, `playIndex`, ...), which reaches `backend/commands/queue.rs`. The backend resolves the stream URL (local file, podcast URL from `AppState.external_streams`, or Subsonic stream), calls `AudioPlayer::play_stream`, and emits `QueueStateChanged`. `queue_manager` reacts to `PlaybackPosition` for crossfade and gapless preload and to `PlaybackFinished` to advance, scrobble and record history. Podcast episodes use the same path with ids like `podcast:<id>`.

**Mix, Radio and auto-continue**: `Core::generate_mix`, `Core::start_radio` and the background task in `Core::start_auto_continue` share `Core::seed_from` (similar tracks, then genre + BPM from the library). See `backend/core/library.rs`.

**Themes**: TOML files under `themes/` are embedded in the backend; `list_themes` merges them with user files. The UI applies the chosen theme as CSS variables (`applyAppearance` in `stores.ts`). See [Settings & Themes Internals](/settings-themes-internals).

**Play history**: `backend/db.rs` records one row per completed track (`play_history.db`); `backend/core/stats.rs` exposes the history summary and export. Local-only.

**Podcasts**: client-side, independent of the OpenSubsonic connection (Navidrome has no podcast endpoints, [navidrome/navidrome#793](https://github.com/navidrome/navidrome/issues/793)). `backend/podcasts/` fetches RSS with `feed-rs` into `podcasts.db`. Android does the equivalent natively.

**Updates**: `.deb`/`.rpm`/COPR/AUR users update through their package manager. There is no in-app updater.

## Going further

For the screens and the code behind each, see [Desktop In-depth](/desktop-indepth-overview).

If your change affects settings, themes, or how the app is built or packaged, update [Settings](/settings), [Customizing Themes](/custom-themes), [Settings & Themes Internals](/settings-themes-internals) or [Building from Source](/building-from-source) too.
