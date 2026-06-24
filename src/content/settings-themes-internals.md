# Settings & Themes Internals

This page documents how settings and themes are stored and wired up in code. For what each setting actually does, see [Settings](/settings) and [Customizing Themes](/custom-themes).

## Settings storage

Most settings are defined in [`src/views/Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) and persisted to `localStorage` via `SafeStorage` (in [`src/lib/utils.ts`](https://github.com/fossisawesome/firmium/blob/main/src/lib/utils.ts)), under keys prefixed `firmium_*`. A few sensitive values (Last.fm credentials) are stored in the OS keyring via `Keyring` ([`src/lib/api.ts`](https://github.com/fossisawesome/firmium/blob/main/src/lib/api.ts)).

| Setting | Storage key / location | Default | Notes |
| --- | --- | --- | --- |
| Window Decorations | `localStorage` `firmium_decorations` | shown | `Settings.svelte` calls `onapplyDecorations()`, which is `applyDecorations()` in `App.svelte`, calling Tauri's `getCurrentWindow().setDecorations(show)` |
| Theme | `localStorage` `firmium_theme` | `"firmium"` | `Settings.svelte` calls `onapplyTheme()` -> `applyThemeById()` in `App.svelte`. Themes loaded via the `list_themes` Tauri command (`src-tauri/src/lib.rs`) |
| Crossfade | `localStorage` `firmium_crossfade` | enabled | `setCrossfadeEnabled()` in `src/lib/stores.ts` updates the `crossfadeEnabled` store, used by `crossfadeToNext()` in `src/lib/playback.ts`. Mutually exclusive with Gapless |
| Crossfade Duration | `localStorage` `firmium_crossfade_duration` | `5` (1-12) | `setCrossfadeDuration()` updates `crossfadeDuration`; passed to the Tauri `crossfade_to()` command as `fade_duration_ms = duration * 1000` |
| Crossfade Curve | `localStorage` `firmium_crossfade_curve` | `"linear"` | `setCrossfadeCurve()` updates `crossfadeCurve` and calls the `set_crossfade_curve` Tauri command (`src-tauri/src/commands/queue.rs`), which sets `QueueStateInner::crossfade_curve`. `crossfade_to()` (`src-tauri/src/audio/mod.rs`) reads it: `"logarithmic"` maps ramp position `t` to `10^((t-1)*2)` (equal-power approximation), `"linear"` uses `t`. Android: `AppPreferences.CROSSFADE_CURVE` / `PlayerViewModel.setCrossfadeCurve()`, applied in `AudioPlayer.crossfadeTo()`. |
| Gapless Playback | `localStorage` `firmium_gapless` | enabled | `setGaplessEnabled()` updates `gaplessEnabled`. On track end, if gapless is enabled and crossfade isn't, `playback.ts` calls `preload_stream()` then `play_stream()`. Mutually exclusive with Crossfade |
| ReplayGain | `localStorage` `firmium_replaygain` | enabled | `setReplayGainEnabled()` updates `replayGainEnabled` and calls the `set_replay_gain_enabled` Tauri command (`src-tauri/src/commands/queue.rs`), which sets `QueueStateInner::replay_gain_enabled`. When disabled, `replay_gain_db` returns `None` at all call sites in `queue.rs` and `queue_manager.rs` (initial play, crossfade, gapless preload). Android: `AppPreferences.REPLAY_GAIN_ENABLED` / `PlayerViewModel.setReplayGainEnabled()`; `replayGainDb` is set to `null` in `playAt()` and `crossfadeToNext()`. |
| Last.fm Integration | `localStorage` `firmium_lastfm` | disabled | When enabled, reveals API Key/Secret fields |
| Last.fm API Key / Secret | OS keyring, `lastfm_api_key` / `lastfm_secret` | - | Saved/loaded via `Keyring.save()` / `Keyring.load()` in `src/lib/api.ts` |
| External Lyrics (LRCLIB) | `localStorage` `firmium_lrclib` | enabled | Checked in `src/lib/lyrics.ts` before falling back to the LRCLIB API |
| Auto-Login | `localStorage` `firmium_auto_login` | enabled | Read on mount in `App.svelte`. If enabled and a password is saved (`firmium_save_pass`), loads the password from the keyring and calls `doConnect()` |
| Download Format | `localStorage` `firmium_download_format` | `"original"` | `setDownloadFormat()` updates the `downloadFormat` store. Passed as `format` to the `download_track`/`download_album` Tauri commands (`"original"` maps to `format=raw`) - see [Desktop Backend Internals](/desktop-backend-internals) |
| Bit-Perfect Audio | `localStorage` `firmium_bit_perfect_mode` | `"relaxed"` | `setBitPerfectMode()` in `src/lib/stores.ts` updates the `bitPerfectMode` store and calls the `set_bit_perfect_mode` Tauri command (`src-tauri/src/commands/playback.rs`), which sets `AudioPlayer::bit_perfect_mode`. `"off"` disables stream reopening; `"relaxed"` (default) tries to match native sample rate; `"strict"` does the same but disables crossfade. |
| Recap weekly auto-show | `localStorage` `firmium_recap_last_shown` (desktop) / DataStore `recap_last_shown` (Android) | unset | Unix-millis timestamp of the last time Recap was surfaced. On app start (`App.svelte` `onMount`; Android `AppNavGraph` `LaunchedEffect`) Recap auto-opens if more than 7 days have passed, then the timestamp is rewritten. |
| Equalizer | `eq.toml` in the app config dir (not `localStorage`) | disabled / no profiles | `src/components/EqualizerSettings.svelte` drives the EQ via Tauri commands in `src-tauri/src/commands/equalizer.rs` (`get_eq_state`, `save_eq_profile`, `delete_eq_profile`, `set_eq_active_profile`, `set_eq_bands`, `set_eq_enabled`). Profiles, per-device active-profile assignments, and the enable flag all live in `eq.toml`; the backend applies them through the biquad chain in `audio/eq.rs` - see [Desktop Backend Internals](/desktop-backend-internals). |

### Debug actions

- **App Version**: calls the `get_app_version()` Tauri command (`src-tauri/src/commands/app_info.rs`), returning `env!("CARGO_PKG_VERSION")`
- **Wipe Cache**: calls `clearAll()` from `src/lib/coverCache.ts` (in-memory cover art cache only)
- **Delete User Settings**: loops over the `SETTINGS_KEYS` array and calls `SafeStorage.removeItem(k)` for each:

```
firmium_server, firmium_user, firmium_save_pass, firmium_auto_login,
firmium_lrclib, firmium_theme, firmium_decorations, firmium_crossfade,
firmium_crossfade_duration, firmium_crossfade_curve, firmium_volume, firmium_gapless, firmium_lastfm,
firmium_download_format, firmium_bit_perfect_mode, firmium_replaygain
```

## Play history & Recap internals

The Stats Export panel and Firmium Recap read from a local play-history store. No server calls are involved.

- **Desktop** — a SQLite database (`play_history.db` in the Tauri app data dir) managed by [`src-tauri/src/db.rs`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/db.rs). A row is written on track completion from `queue_manager.rs` (alongside `fire_scrobble`, via `fire_record_play`), so a play is recorded at the same moment it scrobbles. The `plays` table denormalizes track/artist/album names so Recap renders offline. Aggregation happens in SQL; the frontend calls the `get_recap_stats`, `get_play_history_summary`, and `export_play_history` Tauri commands (`src-tauri/src/commands/stats.rs`). Exports are written to a user-chosen path via the dialog plugin plus the `save_text_file` / `save_binary_file` commands.
- **Android** — a Room database (`firmium_play_history.db`) in `data/db/` (`PlayEntity`, `PlayDao`, `FirmiumDatabase`, `PlayHistoryRepository`). Rows are inserted from `PlaybackController` at the same completion points that scrobble. The Stats Export panel (`SettingsScreen.kt`) and `RecapScreen.kt` read through `FirmiumApplication.playHistory`; exports and card images share via `FileProvider` (`ShareUtils.kt`).
- **Recap UI** — desktop overlay `src/components/RecapPanel.svelte` (toggled by the `recapOpen` store), Android route `composable("recap")` → `RecapScreen.kt`. Card images are captured with `html-to-image` (desktop) and a Compose `GraphicsLayer` (Android). Recap has no nav entry; it opens from Stats Export and the weekly auto-show.

## Theme internals

Theme files are `.toml` files (see [Customizing Themes](/custom-themes) for the format and color reference). How they get from disk to the screen:

- The filename (without `.toml`) becomes the theme's `id`, used as the value of the `firmium_theme` `localStorage` key and shown in Settings.
- The `list_themes` Tauri command ([`src-tauri/src/lib.rs`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/lib.rs)) reads the bundled themes in [`themes/`](https://github.com/fossisawesome/firmium/tree/main/themes), merges in any user themes from the user's config directory (`~/.config/com.fossisawesome.firmium/themes/` on Linux), and returns the combined list to the frontend. A user theme with the same id as a built-in theme overrides it.
- On the frontend, `applyThemeData()` in [`src/App.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/App.svelte) sets each color from `[colors]` as a CSS custom property on `:root` (`--bg`, `--surface`, `--accent`, etc.), along with `color-scheme`, `--font`, and `--timing`.
