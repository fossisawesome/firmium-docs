# Desktop Backend Internals

This page covers the internal structure of the Firmium desktop app: how backend modules are wired at the crate root, how the `EventBus`/`BackendEvent` model works, how `AppState` is shared, and how `iced::Task::perform` drives every backend call from the UI. For a higher-level map of the whole app, see [Desktop Architecture](/architecture-overview).

## Crate structure and module mounting

The desktop app is a single Rust crate. The iced UI lives under `src/`; the backend lives under `backend/`, a sibling directory to `src/`. Because they share one crate, `src/main.rs` mounts every backend module at the crate root with `#[path]` attributes:

```rust
#[path = "../backend/events.rs"]    mod events;
#[path = "../backend/state.rs"]     mod state;
#[path = "../backend/audio/mod.rs"] mod audio;
#[path = "../backend/commands/mod.rs"] mod commands;
// ... repeated for init, queue_state, queue_manager, visualizer, etc.
```

Code inside `backend/` can reference `crate::events::EventBus`, `crate::commands::subsonic::get_albums`, and so on without any re-export indirection. `src/app.rs` uses the same `crate::` paths. The full mounting order is in `src/main.rs`.

`main()` creates a Tokio runtime, enters it, then calls `iced::application(boot, App::update, App::view)`. The `boot` function calls `Backend::new()` and returns the initial `App` state plus an auto-login task.

## Backend bootstrap (`backend/init.rs`)

`Backend::new()` is called once inside the entered Tokio runtime. It builds every shared handle in order:

1. Creates `EventBus` (the broadcast sender).
2. Creates `Arc<AudioPlayer>` (opens the default cpal output device, spawns background tasks).
3. Creates `Arc<AppState>` (wraps an async `reqwest::Client` and a `parking_lot::RwLock<ConnectionState>`).
4. Creates `Arc<QueueState>` (the authoritative queue and playback settings).
5. Optionally creates `Arc<PlayHistory>` (SQLite-backed play history; initialization failures are non-fatal and yield `None`).
6. Calls `queue_manager::start(...)` to launch the background task that reacts to playback events.

The resulting `Backend` struct is stored on the `App` struct in `src/app.rs` and accessed by `update()` when dispatching backend calls.

## Event bus (`backend/events.rs`)

`EventBus` wraps a `tokio::sync::broadcast::Sender<BackendEvent>` with capacity 1024. `bus.emit(event)` broadcasts to all active receivers; `bus.subscribe()` returns an independent `broadcast::Receiver`.

`BackendEvent` variants:

- `PlaybackStateChanged { player_id, state, audio_info }`: playback transitioned state; `audio_info` carries the native sample rate and channel count when state is `Playing`.
- `PlaybackPosition { player_id, position, duration }`: fired roughly every 250 ms by the decode feeder; drives the scrubber in the player bar.
- `PlaybackFinished { player_id }`: the decode feeder exhausted the stream; triggers track advance in the queue manager.
- `QueueStateChanged(QueueStateSnapshot)`: the queue was mutated (new track, reorder, clear); the UI subscription updates the queue panel.
- `QueueExhausted(Song)`: the queue ran out; the seed song is forwarded for Smart Radio continuation.
- `SessionExpired`: emitted by `commands/subsonic.rs` on HTTP 401 or OpenSubsonic error codes 40 or 41; the UI subscription routes it to the login overlay.

Two consumers subscribe to the bus at startup: `queue_manager::start` (gapless preload, crossfade, scrobbling) and `App::subscription` in `src/app.rs` (bridges events into `Message::Backend(BackendEvent)` for the iced update loop).

## Connection state (`backend/state.rs`)

`AppState` fields:

- `connection: RwLock<ConnectionState>`: server URL, username, password (in memory only), and the set of detected `openSubsonicExtensions`.
- `http: reqwest::Client`: shared async HTTP client used by `commands/subsonic.rs` and `commands/lyrics.rs`. Separate from `AudioPlayer`'s `reqwest::blocking::Client`, which is dedicated to the decode-feeder thread.
- `local_library: RwLock<Option<LocalLibraryCache>>`: cached scan of `~/Music/Firmium`; `None` until first scan; invalidated after downloads or imports.
- `bus: EventBus`: handle for emitting `SessionExpired` from within the OpenSubsonic client.

`AppState::new(bus)` is the only constructor. The `Arc<AppState>` is cloned into every backend command that needs server access.

## Calling backend functions from the UI (`src/app.rs`)

All UI state lives on `App`. `update(message) -> Task<Message>` handles every message variant.

For async backend calls, `update` returns `iced::Task::perform(future, Message::SomeDone)`:

```rust
Task::perform(
    commands::subsonic::get_albums(Arc::clone(&self.backend.app_state), offset),
    Message::AlbumsFetched,
)
```

The future runs on the Tokio runtime. When it completes, `Message::AlbumsFetched(result)` re-enters `update`. Async fns in `backend/commands/` take owned `Arc<_>` handles so the future is `'static`; sync fns take `&_` and are called inline in `update`.

`App::subscription` returns an `iced::Subscription` that reads from an `EventBus` receiver and maps each `BackendEvent` to `Message::Backend(BackendEvent)`, feeding audio and queue state into the update loop.

## Commands (`backend/commands/`)

`backend/commands/mod.rs` declares each submodule. These are plain Rust functions with no Tauri attribute macros and no IPC serialization layer:

- `auth.rs`: `generate_auth_params(username, password)` for MD5 token generation (random 8-byte salt, `token = md5(password + salt)`).
- `credentials.rs`: `save_password`, `get_password`, `delete_password` via the `keyring` crate (libsecret on Linux, Windows Credential Manager on Windows).
- `subsonic.rs`: `set_connection`, `validate_connection`, OpenSubsonic reads (albums, artists, search, genres, playlists), `scrobble`, `save_play_queue`/`get_play_queue`, `get_song_lyrics` (structured then legacy then LRCLIB cascade), `get_sonic_similar_tracks`. The internal `subsonic_request` emits `BackendEvent::SessionExpired` on 401 or error codes 40 and 41.
- `mappers.rs`: `map_albums`, `map_artists`, `map_songs` convert `serde_json::Value` to typed `Album`/`Artist`/`Song` structs; `infer_release_type` and `format_track_info` run here to keep JSON-shape logic out of the UI.
- `lyrics.rs`: `parse_lrc`, `fetch_lrclib_lyrics` for LRC line parsing and the LRCLIB HTTP fallback used by `get_song_lyrics`.
- `cover_cache.rs`: `get_cover_art`, `clear_cover_cache` managing a disk cache under `app_cache_dir()/covers/` (200 MB budget, mtime-based LRU eviction). The UI loads cached paths into an `iced::widget::image::Handle`.
- `cover_colors.rs`: `extract_cover_colors`, `extract_cover_colors_from_path` for dominant-color extraction (used as the visualizer palette).
- `queue.rs`: queue mutation functions (`set_queue`, `shuffle_and_play`, `play_queue_index`, and others).
- `queue_manager.rs` (mounted as a peer module, not under `commands/`): the background task that drains the bus for crossfade timing, gapless preload, track advance, and scrobbling.
- `playback.rs`: thin wrappers over `AudioPlayer`: `play_stream`, `preload_stream`, pause/resume/stop, `seek_position`, `set_volume`, `crossfade_to`, `list_audio_devices`.
- `equalizer.rs`: `get_eq_state`, `save_eq_profile`, `delete_eq_profile`, `set_eq_active_profile`, `set_eq_bands`, `set_eq_enabled`. Profiles persist in `eq.toml` under the app config directory.
- `local_library.rs`: scans `~/Music/Firmium`, maps audio files to the same `Album`/`Artist`/`Song` shapes as `mappers.rs`. `import_local_files` handles drag-and-drop. `find_local_match` is used by `playback.rs` to prefer a local copy over a server stream.
- `downloads.rs`: `download_track`, `download_album` pull streams from the server into the local library folder.
- `stats.rs`: play-history aggregation for the Recap view and CSV export.
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
- `visualizer: Arc<VisualizerState>`: shared with the decode feeder and the iced canvas in `src/viz.rs`.
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
3. Taps the visualizer (`visualizer::process_chunk`).
4. Applies the 25 ms fade-in ramp.
5. Pushes samples into `session.ring`.

The feeder checks `EqShared.generation` (an `AtomicU64`) each chunk; it rebuilds its `EqChain` only when the generation changes, so live EQ edits are cheap (one atomic read per chunk in the steady state).

### Mixing callback (`audio/output.rs`)

`mix_into` runs in the cpal realtime callback. For each active session it reads from `session.ring`, applies per-session volume, adapts channel count (mono-to-stereo or stereo-to-mono), and runs linear-interpolation resampling if the session's native rate does not match the currently open stream's rate. When rates match, the resampler step is exactly 1.0 and degenerates to a passthrough with no interpolation overhead.

## Visualizer (`backend/visualizer.rs`)

`VisualizerState` is shared between the decode feeder, a background analysis task, and the iced canvas in `src/viz.rs`.

Key fields:

- `enabled: AtomicBool`: gates both the sample tap and the analysis task. No overhead when the visualizer panel is closed.
- `buffer: Mutex<VecDeque<f32>>`: mono ring buffer, capacity 8192 samples.
- `smooth_bars`, `smooth_bass`, `smooth_mid`, `smooth_treble`, and corresponding `last_*` snapshots: the analysis results read by the canvas.
- `dirty: AtomicBool`: set after each analysis frame; cleared by the renderer after consuming, preventing redundant redraws.

`process_chunk(samples, channels, state)` is called inline from the decode feeder. It downmixes interleaved samples to mono (sum one sample per channel, divide by channel count) and pushes them into `buffer`.

A background analysis task spawned once from `AudioPlayer::new` wakes every 16 ms while `enabled` is true:

1. Takes the most recent 2048 samples from `buffer`.
2. Applies a Hann window and runs a forward FFT via `rustfft::FftPlanner`.
3. Computes `bass` as peak magnitude in the 40-250 Hz bins, normalized to 0..1.
4. Groups the magnitude spectrum into 120 log-spaced bars (40 Hz to 18 kHz, peak per band), normalized to 0..1.
5. Downsamples the window to 120 points for the oscilloscope waveform (`WAVE_POINTS = 120`).
6. Applies per-value smoothing (fast attack, slow decay) and stores the results.

`src/viz.rs` implements the iced `canvas::Program` for bars, oscilloscope, and orb modes, reading the latest snapshot via `VisualizerState` getters. All rendering is CPU-side inside iced's canvas; there is no separate GPU compute path for the visualizer.

## Equalizer DSP (`backend/audio/eq.rs`, `backend/commands/equalizer.rs`)

The EQ is a biquad IIR chain using RBJ Audio EQ Cookbook coefficients. `Biquad` uses transposed direct form II. `EqChain` holds one biquad per band per channel (filter state cannot be shared across interleaved channels) and exposes `process_interleaved()`.

`EqShared` holds:

- `generation: AtomicU64`: incremented each time the EQ config changes; decode feeders rebuild their `EqChain` only when this changes.
- `config: Mutex<EqRuntimeConfig>`: the active band configuration.

`commands/equalizer.rs` owns all file I/O. Profiles persist in `eq.toml` under the app config directory (same `toml` crate as themes), with `[settings] enabled`, `[profiles.NAME]`, and `[devices."NAME"] active_profile` tables. Each of the six commands (`get_eq_state`, `save_eq_profile`, `delete_eq_profile`, `set_eq_active_profile`, `set_eq_bands`, `set_eq_enabled`) mutates the file then calls `reapply()`, which re-resolves the default device's active profile and calls `AudioPlayer::set_eq_runtime()` to bump the generation. Graphic profiles map the first and last bands to low/high shelves and the rest to peaking filters; parametric profiles are all peaking with explicit Q values.

## See also

- [Desktop Architecture](/architecture-overview)
- [Settings & Themes Internals](/settings-themes-internals)
