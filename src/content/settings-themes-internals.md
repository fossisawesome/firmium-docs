# Settings & Themes Internals

This page documents how settings and themes are stored and wired up in code (desktop: Tauri + Rust). For what each setting actually does, see [Settings](/settings) and [Customizing Themes](/custom-themes).

## Settings storage

Settings are owned by Rust (`Core`, [`backend/core/settings.rs`](https://github.com/fossisawesome/firmium/blob/main/backend/core/settings.rs)). Persisted values live in `<config dir>/config.toml` (the `Config` struct in [`backend/config.rs`](https://github.com/fossisawesome/firmium/blob/main/backend/config.rs)); Last.fm/ListenBrainz secrets live in the OS keyring (service `firmium-desktop`). The UI holds a mirrored `Settings` object in the `settings` store and changes it only through `updateSetting(key, value)` (`src/lib/stores.ts`), which calls `Core::set_setting` and stores the returned snapshot. The webview's `localStorage` is not used for settings (only a first-run onboarding flag).

| Setting (key) | Storage | Default | Notes |
| --- | --- | --- | --- |
| Window Decorations (`windowDecorations`) | `config.toml` `window_decorations` | shown | Applied at startup in `src-tauri/src/lib.rs` and live via `set_window_decorations`. No-op on compositors without server-side decorations (Hyprland, Sway); works on GNOME/KDE/X11 |
| Color Theme (`themeId`) | `config.toml` `theme_id` | `"firmium"` | Themes come from `commands::themes::list_themes()`; `applyAppearance()` writes them to CSS variables |
| UI Theme (`uiThemeId`) | `config.toml` `ui_theme_id` | `"default"` | Layout axis, see "UI theme internals" |
| Font (`fontFamily`) | `config.toml` `font_family` | `"Liberation Mono"` | Mapped to a CSS font stack by `fontStack()` in `stores.ts` |
| Scrollbar Width (`scrollbarWidth`) | `config.toml` `scrollbar_width` | `10` (6-20) | `--scrollbar-width` |
| Crossfade (`crossfadeEnabled`) | `config.toml` `crossfade_enabled` | off | Mutually exclusive with Gapless; also relaxes strict bit-perfect. Read by `queue_manager.rs` |
| Crossfade Duration (`crossfadeDuration`) | `config.toml` `crossfade_duration` | `5` (1-12 s) | `queue::set_crossfade_settings` |
| Crossfade Curve (`crossfadeCurve`) | `config.toml` `crossfade_curve` | `"linear"` | `QueueStateInner::crossfade_curve`. `AudioPlayer::crossfade_to()` (`backend/audio/mod.rs`): `"logarithmic"` maps ramp position `t` to `10^((t-1)*2)` (equal-power approximation), `"linear"` uses `t`. Android: `AppPreferences.CROSSFADE_CURVE` |
| Gapless (`gaplessEnabled`) | `config.toml` `gapless_enabled` | on | On track end, if gapless is on and crossfade isn't, `queue_manager.rs` calls `preload_stream()` then promotes the preloaded session. Turning it on turns Crossfade off; strict bit-perfect turns it off |
| ReplayGain (`replayGainEnabled`) | `config.toml` `replay_gain_enabled` | on | `QueueStateInner::replay_gain_enabled`; when off, `replay_gain_db` is `None` at every call site in `queue.rs`/`queue_manager.rs` |
| Auto-continue (`autoContinue`) | `config.toml` `auto_continue` | off | `QueueStateInner::auto_continue`; `Core::start_auto_continue` reacts to `QueueExhausted` |
| Bit-Perfect (`bitPerfectMode`) | `config.toml` `bit_perfect_mode` | `"relaxed"` | `AudioPlayer::set_bit_perfect_mode()`. `"off"` never reopens the stream; `"relaxed"` tries the track's native rate; `"strict"` also disables crossfade and gapless |
| Volume (`volume`) | `config.toml` `volume` | `0.8` | `queue::set_queue_volume` |
| External Lyrics (`lrclibEnabled`) | `config.toml` `lrclib_enabled` | on | Checked by `Core::lyrics` before `get_song_lyrics` falls back to LRCLIB (`commands/lyrics.rs`) |
| Word-by-word lyrics (`lyricsWordFill`) | `config.toml` `lyrics_word_fill` | off | UI-only toggle; the timings come from `TimedLyrics` |
| Download Format (`downloadFormat`) | `config.toml` `download_format` | `"raw"` | Read by the `download_track` / `download_album` commands, see [Desktop Backend Internals](/desktop-backend-internals) |
| Last.fm (`lastfmKey`, `lastfmSecret`) | OS keyring (`lastfm_key`, `lastfm_secret`) | - | Stored via `commands::credentials`; the Settings toggle is derived from whether a key is set |
| ListenBrainz (`listenbrainzToken`) | OS keyring (`listenbrainz_token`) | - | A stored token enables submission (`commands/listenbrainz.rs`) |
| Equalizer | `eq.toml` in the config dir | disabled / no profiles | Driven via `backend/commands/equalizer.rs`; profiles, per-device assignments and the enable flag live in `eq.toml`, applied through the biquad chain, see [Desktop Backend Internals](/desktop-backend-internals) |

### Debug actions

- **App Version**: calls `commands::app_info::get_app_version()`, returning `env!("CARGO_PKG_VERSION")`
- **Wipe Cover-Art Cache**: calls `commands::cover_cache::clear_cover_cache()` (clears the on-disk cover cache, `~/.cache/<id>/covers/`)
- **Reset Settings**: `Core::reset_settings()` clears the preference fields in `config.toml` (accounts and connection are kept) and re-applies defaults to the queue state

## Play history internals

The Stats Export panel reads from a local play-history store. No server calls are involved.

- **Desktop** — a SQLite database (`play_history.db` in the app's data dir, `~/.local/share/<id>/`) managed by [`backend/db.rs`](https://github.com/fossisawesome/firmium/blob/main/backend/db.rs)'s `PlayHistory`. A row is written on track completion from `queue_manager.rs` (`fire_record_play`, alongside `fire_scrobble`), so a play is recorded at the same moment it scrobbles. The `plays` table denormalizes track/artist/album names so exports work offline. Aggregation happens in SQL via `PlayHistory::summary()`; the UI reaches it through `Core::history_summary`, `export_history` (`backend/core/stats.rs`). Exports are written to a user-chosen path (via a native save dialog opened from Rust, `tauri-plugin-dialog`) written by the shell (`export_history`).
- **Android** — a Room database (`firmium_play_history.db`) in `data/db/` (`PlayEntity`, `PlayDao`, `FirmiumDatabase`, `PlayHistoryRepository`). Rows are inserted from `PlaybackController` at the same completion points that scrobble. The Stats Export panel (`SettingsScreen.kt`) reads through `FirmiumApplication.playHistory`; exports share via `FileProvider` (`ShareUtils.kt`).

## Theme internals

Theme files are `.toml` files (see [Customizing Themes](/custom-themes) for the format and color reference). How they get from disk to the screen:

- The filename (without `.toml`) becomes the theme's `id`, stored in `config.toml`'s `theme_id` and shown in Settings.
- `commands::themes::list_themes()` ([`backend/commands/themes.rs`](https://github.com/fossisawesome/firmium/blob/main/backend/commands/themes.rs)) reads the built-in themes — embedded into the binary at compile time via `include_dir!` (no resource-bundling step is needed, and it works on every platform) — merges in any user themes from `~/.config/<id>/themes/`, and returns the combined list. A user theme with the same id as a built-in overrides it.
- On desktop the UI applies the chosen theme's `[colors]` table as CSS custom properties on `:root` (`applyAppearance()` in `src/lib/stores.ts`: `--bg`, `--surface`, `--accent`, ...), so every SCSS rule themes itself through those variables.

## UI theme internals

UI Theme is a second, independent axis from color theme: it swaps layout/structure (nav placement, player bar composition, browsing-row size and headers), not colors. Any color theme can pair with either UI theme.

- **Desktop** — the `uiThemeId` setting (`config.toml` `ui_theme_id`) sets `data-ui-theme` on `<html>` (`applyAppearance()`). All Spotify-style differences are CSS overrides scoped by `html[data-ui-theme='spotify']` in `src/styles/_spotify.scss` (pill buttons, rounded cards, larger artwork, darker player bar); the only markup difference is the "Your Library" playlist list in `Sidebar.svelte`.
- **Android** — `AppPreferences.uiThemeId` (DataStore, values `"default"`/`"spotify"`), read once in `MainActivity.kt` and provided app-wide via `LocalUiTheme` (`ui/theme/Theme.kt`), so screens read `LocalUiTheme.current` directly instead of threading a parameter through every composable. `ui/components/PlayerBar.kt` and the bottom nav in `AppNavGraph.kt` (`FirmiumBottomBar`/`SpotifyBottomBar`) fully branch into separate composables; browsing screens read `LocalUiTheme.current` to size rows/cards and swap section-header text, same pattern as desktop.
- Track/song row rendering (`TrackRow.svelte` desktop, `SearchTrackRow` etc. Android) is shared across both UI themes — a plain numbered track row already reads as "Spotify-style."
