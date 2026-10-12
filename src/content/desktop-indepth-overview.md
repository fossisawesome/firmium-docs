# Desktop In-depth: How It Works

The data and playback flow behind the desktop UI. For the layout of the codebase, see [Desktop Architecture](/architecture-overview).

## Request path

1. A Svelte view or component calls a wrapper in `src/lib/api.ts`, e.g. `Api.albums()` → `invoke('get_albums')`.
2. `src-tauri/src/commands.rs` receives it with `State<Arc<Core>>` and forwards to `Core::albums()` (`backend/core/library.rs`).
3. `Core` checks `auth_state().authed`: logged in goes to `backend/commands/subsonic.rs`, otherwise to `backend/commands/local_library.rs`. Both return the same structs from `commands/mappers.rs`.
4. Errors reject the promise as `{ kind, message }` (`CmdError`). `toastError()` in `stores.ts` shows them and ignores `SessionExpired`.

## Playback

Pressing play calls a queue command (`set_queue`, `set_queue_seamless`, `play_queue_index`, ...) in `backend/commands/queue.rs`, which:

- resolves the stream URL, preferring a local file match, then `AppState.external_streams` (podcasts), then the Subsonic stream;
- calls `AudioPlayer::play_stream` (`backend/audio/`: `symphonia` decode + `cpal` output);
- emits `QueueStateChanged` on the `EventBus`.

`src-tauri/src/events.rs` re-emits bus events as Tauri events. `initBackend()` in `src/lib/stores.ts` listens and fills `queueState`, `playbackState`, `position` and `duration`; events are matched against `queueState.playerId` so stale sessions are ignored. No polling.

The `queue_manager` task (started by `Backend::new()`) watches `PlaybackPosition`: near the end of a track it preloads the next one (gapless) or calls `AudioPlayer::crossfade_to()`, depending on the settings in `QueueState`.

## Settings flow

Preferences live in `config.toml` and the OS keyring (Last.fm / ListenBrainz secrets). `Core::set_setting(key, value)` (`backend/core/settings.rs`) applies the side effect (queue state, audio engine, keyring), persists, and returns the full `Settings`. `updateSetting()` in `stores.ts` stores the result, and `applyAppearance()` writes theme, font and scrollbar width to `:root`.

## See also

- [Player Bar](/desktop-indepth-player-bar)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Library Views](/desktop-indepth-library-views)
- [Playlists](/desktop-indepth-playlists)
- [Settings](/desktop-indepth-settings)
