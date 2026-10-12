# Desktop Backend Internals

This page covers the internal structure of the Firmium backend: how the crate is wired, how the `EventBus`/`BackendEvent` model works, how `AppState` and `Core` are shared, and how the Tauri command layer reaches them. For a higher-level map, see [Desktop Architecture](/architecture-overview).

## Crate structure and module mounting

The backend is the lib crate `firmium-backend` (`backend/`), used by the Tauri shell (`src-tauri/`) and by [Termium](/termium-architecture). Its files live next to `backend/src/lib.rs`, which mounts them with `#[path]` attributes so code inside can use short `crate::` paths:

```rust
#[path = "../events.rs"]    pub mod events;
#[path = "../state.rs"]     pub mod state;
#[path = "../audio/mod.rs"] pub mod audio;
#[path = "../commands/mod.rs"] pub mod commands;
#[path = "../core/mod.rs"]  pub mod core;
// ... init, queue_state, queue_manager, db, podcasts, ipc, config, paths
```

`src-tauri/src/lib.rs` builds `Core::new()` in Tauri's `setup` hook while *entered* in the async runtime (`tauri::async_runtime::handle().inner().enter()`), not inside `block_on`: `AudioPlayer` builds a `reqwest::blocking::Client`, which panics if created from within an async context.

## Backend bootstrap (`backend/init.rs`)

`Backend::new()` is called once inside the entered Tokio runtime. It builds every shared handle in order:

1. Creates `EventBus` (the broadcast sender).
2. Creates `Arc<AudioPlayer>` (opens the default cpal output device, spawns background tasks).
3. Creates `Arc<AppState>` (wraps an async `reqwest::Client` and a `parking_lot::RwLock<ConnectionState>`).
4. Creates `Arc<QueueState>` (the authoritative queue and playback settings).
5. Optionally creates `Arc<PlayHistory>` (SQLite-backed play history; initialization failures are non-fatal and yield `None`).
6. Calls `queue_manager::start(...)` to launch the background task that reacts to playback events.
7. Calls `ipc::start(...)` to launch the CLI control socket listener.

`Core::new()` (`backend/core/mod.rs`) wraps the resulting `Backend`, loads `Config` and the local playlists, restores persisted playback settings, and starts the auto-continue task. The shell keeps it as `Arc<Core>` in Tauri state.

## Event bus (`backend/events.rs`)

`EventBus` wraps a `tokio::sync::broadcast::Sender<BackendEvent>` with capacity 1024. `bus.emit(event)` broadcasts to all active receivers; `bus.subscribe()` returns an independent `broadcast::Receiver`.

`BackendEvent` variants:

- `PlaybackStateChanged { player_id, state, audio_info }`: playback transitioned state; `audio_info` carries the native sample rate and channel count when state is `Playing`.
- `PlaybackPosition { player_id, position, duration }`: fired roughly every 250 ms by the decode feeder; drives the scrubber in the player bar.
- `PlaybackFinished { player_id }`: the decode feeder exhausted the stream; triggers track advance in the queue manager.
- `QueueStateChanged(QueueStateSnapshot)`: the queue was mutated (new track, reorder, clear); the shell forwards it to the UI.
- `QueueExhausted(Song)`: the queue ran out; the seed song is forwarded for Smart Radio continuation.
- `SessionExpired`: emitted by `commands/subsonic.rs` on HTTP 401 or OpenSubsonic error codes 40 or 41; the shell emits `session-expired` and the UI opens the login modal.

Consumers subscribe at startup: `queue_manager::start` (gapless preload, crossfade, scrobbling), `Core::start_auto_continue` (Smart Radio seeding, podcast resume position) and `src-tauri/src/events.rs` (re-emits events to the webview).

## Connection state (`backend/state.rs`)

`AppState` fields:

- `connection: RwLock<ConnectionState>`: server URL, username, password (in memory only), and the set of detected `openSubsonicExtensions`.
- `http: reqwest::Client`: shared async HTTP client used by `commands/subsonic.rs` and `commands/lyrics.rs`. Separate from `AudioPlayer`'s `reqwest::blocking::Client`, which is dedicated to the decode-feeder thread.
- `local_library: RwLock<Option<LocalLibraryCache>>`: cached scan of `~/Music/Firmium`; `None` until first scan; invalidated after downloads or imports.
- `bus: EventBus`: handle for emitting `SessionExpired` from within the OpenSubsonic client.
- `external_streams: RwLock<HashMap<String, String>>`: direct stream URLs for non-library items (podcast episodes, keyed `podcast:<id>`); `queue::stream_url_for` checks it before the server.

`AppState::new(bus)` is the only constructor. The `Arc<AppState>` is cloned into every backend command that needs server access.

## Calling the backend from the UI

`src-tauri/src/commands.rs` holds one `#[tauri::command]` per UI action. Each takes `State<Arc<Core>>`, forwards to `Core` or a `backend::commands` function, and maps errors to `CmdError { kind, message }` (from `UserError` or `String`). Async commands that borrow `State` must return `Result`. Every command is registered in `generate_handler!` in `src-tauri/src/lib.rs`, and the UI wraps it in `src/lib/api.ts`.

Async fns in `backend/commands/` take owned `Arc<_>` handles so their futures are `'static`; sync fns take `&_`.

## `Core` (`backend/core/`)

App logic that is not tied to a UI toolkit:

- `settings.rs`: `Settings` snapshot, `set_setting(key, value)` (applies side effects, enforces crossfade/gapless/strict rules, persists), `reset_settings`, `apply_persisted_playback`.
- `accounts.rs`: `connect`, `auto_login`, `switch_account`, `logout`, `remove_account`, `auth_state`; passwords go through `commands/credentials.rs`.
- `library.rs`: server/offline routing (`albums`, `artists`, `search`, `album_list`, ...), `lyrics` (`TimedLyrics` with per-word timing), `cover_path`, `generate_mix`, `start_radio`, `seed_from`, `start_auto_continue`, artist helpers, podcast operations.
- `playlists.rs`: local-first playlists and server sync, see [Playlists](/desktop-indepth-playlists).
- `stats.rs`: `history_summary`, `recent_plays`, `export_history`.

## Commands (`backend/commands/`)

`backend/commands/mod.rs` declares each submodule. These are plain Rust functions with no Tauri attribute macros; `Core` and the shell's `commands.rs` call them:

- `auth.rs`: `generate_auth_params(username, password)` for MD5 token generation (random 8-byte salt, `token = md5(password + salt)`).
- `credentials.rs`: `save_password`, `get_password`, `delete_password` via the `keyring` crate (libsecret on Linux, Windows Credential Manager on Windows).
- `subsonic.rs`: `set_connection`, `validate_connection`, OpenSubsonic reads (albums, artists, search, genres, playlists), `scrobble`, `save_play_queue`/`get_play_queue`, `get_song_lyrics` (structured then legacy then LRCLIB cascade), `get_sonic_similar_tracks`. The internal `subsonic_request` emits `BackendEvent::SessionExpired` on 401 or error codes 40 and 41.
- `mappers.rs`: `map_albums`, `map_artists`, `map_songs` convert `serde_json::Value` to typed `Album`/`Artist`/`Song` structs; `infer_release_type` and `format_track_info` run here to keep JSON-shape logic out of the UI.
- `lyrics.rs`: `parse_lrc`, `fetch_lrclib_lyrics` for LRC line parsing and the LRCLIB HTTP fallback used by `get_song_lyrics`.
- `cover_cache.rs`: `get_cover_art`, `clear_cover_cache` managing a disk cache under `app_cache_dir()/covers/` (200 MB budget, mtime-based LRU eviction). The UI shows cached paths via `convertFileSrc`.
- `cover_colors.rs`: `extract_cover_colors`, `extract_cover_colors_from_path` for dominant-color extraction (used to tint the lyrics panel).
- `queue.rs`: queue mutation functions (`set_queue`, `shuffle_and_play`, `play_queue_index`, and others).
- `queue_manager.rs` (mounted as a peer module, not under `commands/`): the background task that drains the bus for crossfade timing, gapless preload, track advance, and scrobbling.
- `equalizer.rs`: `get_eq_state`, `save_eq_profile`, `delete_eq_profile`, `set_eq_active_profile`, `set_eq_bands`, `set_eq_enabled`. Profiles persist in `eq.toml` under the app config directory.
- `local_library.rs`: scans `~/Music/Firmium`, maps audio files to the same `Album`/`Artist`/`Song` shapes as `mappers.rs`. `import_local_files` handles drag-and-drop. `find_local_match` is used by `queue.rs` to prefer a local copy over a server stream.
- `downloads.rs`: `download_track`, `download_album` pull streams from the server into the local library folder.
- `stats.rs`: thin wrappers over `PlayHistory` and file-save helpers.
- `playlists.rs`: best-effort server push primitives used by `core/playlists.rs`.
- `app_info.rs`: `get_app_version`.
- `listenbrainz.rs`: ListenBrainz scrobbling.
- `themes.rs`: `list_themes` reads `.toml` theme files from the config directory.

## Audio engine (`backend/audio/`)

The audio engine uses `symphonia` 0.5 for decoding and `cpal` 0.17 for device I/O.

### `AudioPlayer` (`audio/mod.rs`)

`AudioPlayer` manages session lifecycle. Key fields:

- `sessions: SessionMap` (`Arc<RwLock<HashMap<PlayerId, Arc<Session>>>>`): each playback session keyed by a UUID string.
- `output: RwLock<OutputHandle>`: the live cpal stream and device handle.
- `http_client: reqwest::blocking::Client`: dedicated blocking client for decode-feeder threads.
- `bus: EventBus`: for emitting `PlaybackStateChanged`, `PlaybackPosition`, and `PlaybackFinished`.
- `crossfade_in_progress: AtomicBool`: stream reopens are deferred while a crossfade volume ramp is running.
- `bit_perfect_mode: Mutex<String>`: `"off"`, `"relaxed"`, or `"strict"`; controls whether the output is reopened at each track's native sample rate.
- `eq: Arc<EqShared>`: live-updatable EQ band config shared with every decode feeder.

`reopen_stream_if_needed()` reopens the cpal stream at the primary session's sample rate when bit-perfect mode is `"relaxed"` or `"strict"`, deferred when `crossfade_in_progress` is set.

### `StreamingReader` (`audio/streaming_reader.rs`)

`StreamingReader` implements `Read + Seek` over an HTTP response body, buffering the full stream locally. This keeps the HTTP connection open for the track's full duration so Subsonic/Navidrome sees "Now Playing" status throughout playback rather than only during the initial download. `VecSource` and `FileSource` are `MediaSource` wrappers for the seek-rebuild path and local file playback respectively.

### `DecoderHandle` (`audio/decoder.rs`)

Wraps a `symphonia` `FormatReader` and `Decoder`. Exposes `next_samples() -> Vec<f32>` (interleaved f32), `seek(secs)`, and accessors for `sample_rate`, `channels`, and optional duration. Defaults to 48000 Hz if the container does not report a sample rate.

### `Session` and the decode feeder (`audio/session.rs`)

`Session` holds:

- `ring: Mutex<VecDeque<f32>>`: interleaved f32 ring buffer (`RING_HIGH_WATER` = 48000 samples, roughly 0.5 s at 48 kHz stereo).
- `volume: Mutex<f32>`, `replay_gain_factor: AtomicU32`: per-session gain applied in the mixing callback.
- `playing: AtomicBool`: whether the cpal callback drains this session.

`spawn_decode_feeder(session, decoder, ...)` runs the blocking decode loop on `tokio::task::spawn_blocking`. Per decoded chunk, in order:

1. Applies the ReplayGain multiplier.
2. Applies the EQ chain (`EqChain::process_interleaved`), skipped entirely when bit-perfect mode is `"strict"`.
3. Applies the 25 ms fade-in ramp.
4. Pushes samples into `session.ring`.

The feeder checks `EqShared.generation` (an `AtomicU64`) each chunk; it rebuilds its `EqChain` only when the generation changes, so live EQ edits are cheap (one atomic read per chunk in the steady state).

### Mixing callback (`audio/output.rs`)

`mix_into` runs in the cpal realtime callback. For each active session it reads from `session.ring`, applies per-session volume, adapts channel count (mono-to-stereo or stereo-to-mono), and runs linear-interpolation resampling if the session's native rate does not match the currently open stream's rate. When rates match, the resampler step is exactly 1.0 and degenerates to a passthrough with no interpolation overhead.

## Equalizer DSP (`backend/audio/eq.rs`, `backend/commands/equalizer.rs`)

The EQ is a biquad IIR chain using RBJ Audio EQ Cookbook coefficients. `Biquad` uses transposed direct form II. `EqChain` holds one biquad per band per channel (filter state cannot be shared across interleaved channels) and exposes `process_interleaved()`.

`EqShared` holds:

- `generation: AtomicU64`: incremented each time the EQ config changes; decode feeders rebuild their `EqChain` only when this changes.
- `config: Mutex<EqRuntimeConfig>`: the active band configuration.

`commands/equalizer.rs` owns all file I/O. Profiles persist in `eq.toml` under the app config directory (same `toml` crate as themes), with `[settings] enabled`, `[profiles.NAME]`, and `[devices."NAME"] active_profile` tables. Each of the six commands (`get_eq_state`, `save_eq_profile`, `delete_eq_profile`, `set_eq_active_profile`, `set_eq_bands`, `set_eq_enabled`) mutates the file then calls `reapply()`, which re-resolves the default device's active profile and calls `AudioPlayer::set_eq_runtime()` to bump the generation. Graphic profiles map the first and last bands to low/high shelves and the rest to peaking filters; parametric profiles are all peaking with explicit Q values.

## CLI control socket (`backend/ipc.rs`)

A running instance listens for line-based commands on a Unix domain socket (`$XDG_RUNTIME_DIR/firmium.sock`, falling back to the app cache dir) on Linux/macOS, or a named pipe (`\\.\pipe\firmium-com.fossisawesome.firmium`) on Windows. `Backend::new()` spawns the listener via `ipc::start()`, holding clones of the same `Arc<QueueState>`, `Arc<AppState>`, `Arc<AudioPlayer>`, and `EventBus` handles the UI uses.

Each connection is one command: the client writes a line, the server calls the matching `commands::queue::*` fn directly (without going through the UI, since those fns only take backend `Arc` handles), writes one reply line, and closes. Commands: `play-pause`, `next`, `prev`, `volume <0-100>`, `seek <secs>`, `queue-index <n>`, `shuffle-toggle`, `repeat-cycle`, `status` (replies with a JSON snapshot built from `QueueState` + `AudioPlayer::get_state`/`get_current_position`/`get_duration`).

`src-tauri/src/main.rs` and `cli.rs` implement the client side: if `firmium` is invoked with args, `cli::run()` connects synchronously (`std::os::unix::net::UnixStream` / a `File` opened on the pipe path — no Tokio runtime needed for a one-shot call), sends the joined args as one line, prints the reply, and exits before the GUI starts.

## OS media controls (`src-tauri/src/media_controls.rs`)

`media_controls::start()` runs from the Tauri `setup` hook, after `Core::new()`. It builds a `souvlaki::MediaControls` (MPRIS over D-Bus on Linux, SMTC on Windows using the main window's HWND, `MPNowPlayingInfoCenter` on macOS) and does two things. Inbound, the `attach` callback turns each `MediaControlEvent` into the same `commands::queue::*` call the control socket uses (`toggle_play`, `queue_next`, `queue_prev`, `seek_queue`); a mirrored `AtomicBool` makes `Play` and `Pause` idempotent, since the backend only has a toggle. Outbound, a task subscribed to the `EventBus` calls `set_metadata` on `QueueStateChanged` and `set_playback` on `PlaybackStateChanged`, using the last `PlaybackPosition` as progress. Position ticks are not pushed individually, to avoid a D-Bus signal every tick. If the platform backend cannot start, it logs and the app runs without OS controls.

## See also

- [Desktop Architecture](/architecture-overview)
- [Settings & Themes Internals](/settings-themes-internals)
- [Command Line Control](/command-line-control)
