# Settings & Themes Internals

This page documents how settings and themes are stored and wired up in code (desktop, native Rust/iced). For what each setting actually does, see [Settings](/settings) and [Customizing Themes](/custom-themes).

## Settings storage

The desktop app is a single Rust binary — there's no `localStorage`. Most settings live as fields on the `App` struct ([`src/app/mod.rs`](https://github.com/fossisawesome/firmium/blob/main/src/app/mod.rs)), set from `view/settings.rs` controls and handled in `update/settings.rs`. A subset is persisted to `~/.config/<id>/config.toml` via [`src/config.rs`](https://github.com/fossisawesome/firmium/blob/main/src/config.rs)'s `Config` struct; everything else resets to its default on every launch. Last.fm/ListenBrainz credentials are stored in the OS keyring via `commands::credentials::save_password()`/`get_password()`.

| Setting | Storage | Default | Notes |
| --- | --- | --- | --- |
| Window Decorations | `config.toml` `window_decorations` | shown | `update/settings.rs` toggles `App.window_decorations` and saves config; applied via iced's window API on next launch |
| Theme | `config.toml` `theme_id` | `"firmium"` | Themes are read by `commands::themes::list_themes()` ([`backend/commands/themes.rs`](https://github.com/fossisawesome/firmium/blob/main/backend/commands/themes.rs)) |
| Cover-Colored Visualizer | `config.toml` `viz_cover_colors` | on | `App::viz_config()` builds the visualizer gradient. When on and the current track has a cover, `maybe_fetch_viz_colors()` calls `commands::cover_colors::extract_cover_colors()` and the gradient cycles the extracted `OrbPalette`; when off (or no cover), it falls back to an accent-based ramp from the active theme's tokens |
| Crossfade | `App.crossfade_enabled` (session only — not persisted, defaults off each launch) | disabled | Mutually exclusive with Gapless; read by `queue_manager.rs` when deciding how to advance tracks |
| Crossfade Duration | `App.crossfade_duration` (session only) | `5` (1-12 s) | Passed to `commands::playback::crossfade_to()` as `fade_duration_ms = duration * 1000` |
| Crossfade Curve | `App` state → `commands::queue::set_crossfade_curve()` (session only) | `"linear"` | Sets `QueueStateInner::crossfade_curve` (`backend/commands/queue.rs`). `AudioPlayer::crossfade_to()` (`backend/audio/mod.rs`) reads it: `"logarithmic"` maps ramp position `t` to `10^((t-1)*2)` (equal-power approximation), `"linear"` uses `t` directly. Android: `AppPreferences.CROSSFADE_CURVE` / `PlayerViewModel.setCrossfadeCurve()`, applied in `AudioPlayer.crossfadeTo()` |
| Gapless Playback | `App.gapless_enabled` (session only) | enabled | On track end, if gapless is on and crossfade isn't, `queue_manager.rs` calls `preload_stream()` then promotes the preloaded session. Mutually exclusive with Crossfade |
| ReplayGain | `App.replay_gain_enabled` (session only) | enabled | Backed by `QueueStateInner::replay_gain_enabled`. When disabled, `replay_gain_db` returns `None` at all call sites in `queue.rs`/`queue_manager.rs` (initial play, crossfade, gapless preload). Android: `AppPreferences.REPLAY_GAIN_ENABLED` / `PlayerViewModel.setReplayGainEnabled()` |
| Last.fm Integration | `App` state, toggled in Settings | disabled | When enabled, reveals API Key/Secret fields |
| Last.fm API Key / Secret | OS keyring (`firmium-desktop` / `lastfm_key`, `lastfm_secret`) | - | Saved/loaded via `commands::credentials::save_password()`/`get_password()`, called from `update/settings.rs` |
| External Lyrics (LRCLIB) | `config.toml` `lrclib_enabled` | enabled | Checked in `commands::subsonic::get_song_lyrics()` before falling back to the LRCLIB API (`commands/lyrics.rs`) |
| Download Format | `config.toml` `download_format` | `"raw"` (original) | Passed as `format` to `commands::downloads::download_track`/`download_album` — see [Desktop Backend Internals](/desktop-backend-internals) |
| Bit-Perfect Audio | `App.bit_perfect_mode` (session only) | `"relaxed"` | Calls `AudioPlayer::set_bit_perfect_mode()` (`backend/audio/mod.rs`). `"off"` disables stream reopening; `"relaxed"` (default) tries to match the track's native sample rate; `"strict"` does the same but disables crossfade |
| Recap weekly auto-show | `data_dir`-adjacent state (desktop) / DataStore `recap_last_shown` (Android) | unset | Unix-millis timestamp of the last time Recap was surfaced; auto-opens if more than 7 days have passed, then the timestamp is rewritten |
| Equalizer | `eq.toml` in the config dir | disabled / no profiles | `view/settings.rs`'s equalizer panel drives the EQ via `backend/commands/equalizer.rs` (`get_eq_state`, `save_eq_profile`, `delete_eq_profile`, `set_eq_active_profile`, `set_eq_bands`, `set_eq_enabled`). Profiles, per-device active-profile assignments, and the enable flag all live in `eq.toml`; the backend applies them through the biquad chain — see [Desktop Backend Internals](/desktop-backend-internals) |

### Debug actions

- **App Version**: calls `commands::app_info::get_app_version()`, returning `env!("CARGO_PKG_VERSION")`
- **Wipe Cover-Art Cache**: calls `commands::cover_cache::clear_cover_cache()` (clears the on-disk cover cache, `~/.cache/<id>/covers/`)
- **Reset Preferences**: deletes `config.toml` and resets `App` fields to their defaults

## Play history & Recap internals

The Stats Export panel and Firmium Recap read from a local play-history store. No server calls are involved.

- **Desktop** — a SQLite database (`play_history.db` in the app's data dir, `~/.local/share/<id>/`) managed by [`backend/db.rs`](https://github.com/fossisawesome/firmium/blob/main/backend/db.rs)'s `PlayHistory`. A row is written on track completion from `queue_manager.rs` (`fire_record_play`, alongside `fire_scrobble`), so a play is recorded at the same moment it scrobbles. The `plays` table denormalizes track/artist/album names so Recap renders offline. Aggregation happens in SQL via `PlayHistory::recap()`/`summary()`; the UI calls `commands::stats::get_recap_stats`, `get_play_history_summary`, and `export_play_history` (`backend/commands/stats.rs`). Exports are written to a user-chosen path (via `rfd` in the UI layer) with `save_text_file`/`save_binary_file`.
- **Android** — a Room database (`firmium_play_history.db`) in `data/db/` (`PlayEntity`, `PlayDao`, `FirmiumDatabase`, `PlayHistoryRepository`). Rows are inserted from `PlaybackController` at the same completion points that scrobble. The Stats Export panel (`SettingsScreen.kt`) and `RecapScreen.kt` read through `FirmiumApplication.playHistory`; exports and card images share via `FileProvider` (`ShareUtils.kt`).
- **Recap UI** — desktop screen `view/recap.rs` (`recap_view`, toggled via `App` state), Android route `composable("recap")` → `RecapScreen.kt`. Card images are saved via `export.rs` (desktop) and a Compose `GraphicsLayer` (Android). Recap has no nav entry; it opens from Stats Export and the weekly auto-show.

## Theme internals

Theme files are `.toml` files (see [Customizing Themes](/custom-themes) for the format and color reference). How they get from disk to the screen:

- The filename (without `.toml`) becomes the theme's `id`, stored in `config.toml`'s `theme_id` and shown in Settings.
- `commands::themes::list_themes()` ([`backend/commands/themes.rs`](https://github.com/fossisawesome/firmium/blob/main/backend/commands/themes.rs)) reads the built-in themes — embedded into the binary at compile time via `include_dir!` (a single-binary native app has no resource-bundling step) — merges in any user themes from `~/.config/<id>/themes/`, and returns the combined list. A user theme with the same id as a built-in overrides it.
- [`src/theme.rs`](https://github.com/fossisawesome/firmium/blob/main/src/theme.rs) parses a theme's `[colors]` table into `iced::Color`s and builds the `iced::Theme` consumed by every `view/*.rs` screen — there's no CSS or `:root` custom properties, since there's no web view.
