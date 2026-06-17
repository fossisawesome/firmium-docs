# Desktop Architecture

This page is a tour of how the Firmium desktop app is built, for anyone who wants to read the code, fix a bug, or add a feature. For a higher-level introduction to the whole project (including the Android app), see the [Developer Overview](/developer-overview).

## Desktop app

The desktop app is a [Tauri](https://tauri.app/) app: a web-based UI (built with [Svelte](https://svelte.dev/) and TypeScript) running inside a native window, backed by a small Rust program for things the browser can't do, like audio playback and talking to the OS keyring.

```
src/                  Svelte frontend (the UI)
  views/              One file per screen (AlbumList, ArtistDetail, Settings, ...)
  components/         Shared UI pieces (PlayerBar, Sidebar, LyricsPanel, PlaylistMenu, ...)
  lib/
    api.ts            Thin invoke() wrappers around the Rust OpenSubsonic client
    stores.ts         Shared app state (current theme, queue, playback settings, ...)
                      Includes listenToQueueState(), which syncs all queue/settings stores
                      from the Rust queue-state-changed event.
    playback.ts       Position tracking (seek bar, lyrics sync) and lyrics fetching only.
                      Queue decisions live in Rust.
    coverCache.ts     Thin wrapper around the Rust disk-based cover art cache
  App.svelte          Top-level layout, routing, theme application

src-tauri/            Rust backend (runs natively, not in the browser)
  src/lib.rs          App entry point; registers Tauri commands defined in commands/
  src/state.rs        AppState: connection info (server/user/pass) + shared async HTTP client
  src/queue_state.rs  QueueState (Arc<Mutex<QueueStateInner>>): authoritative queue/playback
                      settings; emits queue-state-changed to keep the Svelte stores in sync.
  src/queue_manager.rs Background task listening to playback-position and playback-finished
                       events, driving crossfade, gapless preload, track advance,
                       and scrobbling without any round-trips through JavaScript.
  src/commands/       Command modules: auth, credentials, themes, playback, mappers,
                      subsonic (OpenSubsonic API), lyrics, cover_cache, local_library,
                      downloads, cover_colors, queue
  src/audio/          Actual audio playback, using `symphonia` (decoding) + `cpal` (output)

themes/               Built-in color theme files (.toml)
```

**How a screen works**: each view in `src/views/` is a Svelte component that calls functions in `src/lib/api.ts` - thin wrappers around Tauri commands in `src-tauri/src/commands/subsonic.rs` - to fetch data from your server (albums, artists, playlists, etc.) and renders it. The Rust side holds the active connection (server URL, username, password) in `AppState`, builds authenticated OpenSubsonic requests, and maps JSON responses to typed structs via `commands/mappers.rs`. Shared state, like what's currently playing or which theme is active, lives in `src/lib/stores.ts` so multiple views can read and update it; `setAuth`/`clearAuth` there call `set_connection` to keep the Rust side in sync. Long lists (albums, artists, playlist tracks) are rendered through `src/lib/VirtualList.svelte`, which only mounts the rows currently visible on screen.

**Cover art and lyrics**: cover art is cached to disk under the app's cache directory (`get_cover_art` in `commands/cover_cache.rs`, 200MB budget with LRU eviction) and served to the UI via Tauri's asset protocol, so covers persist across restarts without re-downloading. Lyrics go through a cascade in `commands/subsonic.rs::get_song_lyrics`: OpenSubsonic structured lyrics, then legacy plain-text lyrics, then (if enabled) an LRCLIB lookup.

**Synced lyrics display**: both `LyricsPanel.svelte` (desktop sidebar) and `LyricsSheet.kt` (Android bottom sheet) render the active line large and centered, blur the past/upcoming lines, fill words left-to-right in the active line as it plays, and tint the panel background with the cover art's dominant color. Real LRC/LRCLIB timestamps are line-level only, so per-word timing is *estimated*: `computeWordTimings` (desktop: `src/lib/playback.ts`; Android: `viewmodel/LyricsController.kt`) splits each line's text on whitespace, weights each word by character length, and distributes the line's duration (to the next line's start, or track end for the last line) proportionally. Since the position store/`PlayerState` only update every ~750ms, both platforms interpolate sub-tick position with a frame loop (`requestAnimationFrame` in `LyricsPanel.svelte`; `withFrameNanos` in `LyricsSheet.kt`) to drive the per-word fill smoothly. Desktop renders the fill via a CSS `background-clip: text` gradient with a `--progress` custom property set per `.lyric-word` span; Android builds an `AnnotatedString` with per-word `lerp`'d `SpanStyle` colors. The dominant cover color is extracted in Rust (desktop: `commands/cover_colors.rs`, pixel histogram via the `image` crate; Android: `ui/components/ColorExtraction.kt`'s `rememberDominantColor`, using `androidx.palette`) and bound to a CSS `@property --lyrics-glow` / an animated `Brush` respectively. The word-by-word fill animation (estimated timing) can be disabled in Settings - falling back to whole-line highlighting - via `lyricsWordFillEnabled` (desktop: `stores.ts` + `SafeStorage`; Android: `AppPreferences.lyricsWordFillEnabled`); the blur and glow effects are unaffected by this toggle.

**Session expiry**: if the server returns HTTP 401 or an OpenSubsonic error code 40/41, the Rust side emits a `firmium:session-expired` event, which `App.svelte` listens for to clear credentials; the app falls back to the local library rather than showing a blocking error.

**Local library and downloads**: `src-tauri/src/commands/local_library.rs` scans `~/Music/Firmium` and maps the files it finds into the same `Album`/`Artist`/`Song` shapes used by the OpenSubsonic API, so the existing views work whether or not you're connected to a server. `src/lib/dataSource.ts` picks between `Api` (server) and `LocalApi` (local library) based on the `isAuthed` store; views read through `$dataSource` and re-fetch when it changes or when `dataSourceVersion` (`src/lib/stores.ts`) is bumped. `src-tauri/src/commands/downloads.rs` downloads tracks/albums from the server into the same `~/Music/Firmium` folder (honoring the Download Format setting), and dropping audio files/folders onto the window (`App.svelte`'s `onDragDropEvent` handler) copies them in via `import_local_files` - both invalidate `local_library.rs`'s scan cache so the local library view picks up the new files.

**How playback works**: when you select a track, the Svelte frontend calls a Rust queue command (`set_queue`, `set_queue_seamless`, `shuffle_and_play`, `play_queue_index`, etc.) defined in `src-tauri/src/commands/queue.rs`. Rust resolves the stream URL (checking for a local file match before falling back to a Subsonic stream URL), calls `AudioPlayer::play_stream` in `src-tauri/src/audio/`, and emits a `queue-state-changed` event so the Svelte stores update. A background task in `src-tauri/src/queue_manager.rs` listens for `playback-position` events from the audio engine to trigger crossfade and gapless preload at the right time, and for `playback-finished` events to advance the queue, scrobble, and handle repeat/shuffle without any round-trips through JavaScript. Svelte is a pure view layer: it subscribes to `queue-state-changed` (via `listenToQueueState()` in `stores.ts`) and calls Rust commands on user interaction. The lower-level audio engine (`src-tauri/src/audio/`) streams audio from your server, decodes it with `symphonia`, and plays it through `cpal` at the track's native sample rate.

**How themes work**: theme files are TOML files, either bundled in `themes/` or placed by the user in their config directory. The Rust side (`list_themes` in `src-tauri/src/commands/themes.rs`) finds and merges both sets, and the frontend applies the chosen theme's colors as CSS variables. See [Settings & Themes Internals](/settings-themes-internals) for the full mechanism.

**Updates**: on Windows and Linux AppImage builds, `src/lib/updater.ts` checks for new releases and can install them in place (Settings > Debug > Software Update). `.deb`/`.rpm`/COPR users update via their package manager.

## Going further

For a control-by-control walkthrough of the UI (player bar, sidebar, library views, playlists, settings) and the data flow behind it, see [Desktop In-depth](/desktop-indepth-overview).

If your change affects settings, themes, or how the app is built/packaged, remember to update the relevant docs page too: [Settings](/settings), [Customizing Themes](/custom-themes), [Settings & Themes Internals](/settings-themes-internals), or [Building from Source](/building-from-source).
