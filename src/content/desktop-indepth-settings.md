# Desktop In-depth: Settings

What each control in the Settings screen does and where it lives. The screen is `src/views/Settings.svelte`; every change goes through `updateSetting(key, value)` in `src/lib/stores.ts` → `Api.setSetting` → `Core::set_setting` (`backend/core/settings.rs`), which applies the side effect, persists, and returns the full `Settings`. For storage details see [Settings & Themes Internals](/settings-themes-internals).

## Layout

A fixed category rail (Appearance, Playback, Equalizer, Downloads, Services, Stats, Account, Debug) and the active category's panel. The selected category is local component state. Dropdowns and toggles are Svelte snippets (`dropdown`, `toggle`) reused across rows.

## Appearance

- **Window Decorations**: `windowDecorations` setting; `updateSetting` also calls `Api.setWindowDecorations` (`WebviewWindow::set_decorations`), and `lib.rs` applies the saved value at startup. On wlroots-based Wayland compositors (Hyprland, Sway) server-side decorations may be ignored, so the toggle can be a visible no-op there.
- **Color Theme**: `themeId`; `applyAppearance()` writes the theme's colors to CSS variables on `:root`.
- **UI Theme**: `uiThemeId` (`default` or `spotify`); sets `data-ui-theme` on `<html>`, which `styles/_spotify.scss` keys off.
- **Font**: `fontFamily`, from `FONT_OPTIONS` in `stores.ts`; bundled fonts are declared in `styles/_fonts.scss`.
- **Scrollbar Width**: `scrollbarWidth` (6-20), exposed as `--scrollbar-width`.

## Playback

- **Crossfade** / **Duration** / **Curve**: `crossfadeEnabled`, `crossfadeDuration` (1-12 s), `crossfadeCurve` (`linear` or `logarithmic`) → `queue::set_crossfade_settings` / `set_crossfade_curve`. Enabling crossfade turns gapless off and relaxes strict bit-perfect.
- **Gapless**: `gaplessEnabled`. Enabling it turns crossfade off.
- **ReplayGain**: `replayGainEnabled` → `queue::set_replay_gain_enabled`.
- **Auto-continue (Smart Radio)**: `autoContinue` → `queue::set_auto_continue`; the seeding task is `Core::start_auto_continue`.
- **Bit-Perfect Audio**: `bitPerfectMode` (`off` / `relaxed` / `strict`) → `AudioPlayer::set_bit_perfect_mode`. Strict also disables gapless.

All playback settings persist in `config.toml` and are restored at startup by `Core::apply_persisted_playback` (`queue::init_playback_settings`).

## Equalizer

Embeds `components/EqualizerSettings.svelte` (the same component as the side panel). It calls `get_eq_state`, `save_eq_profile`, `set_eq_bands`, `set_eq_active_profile`, `set_eq_enabled`, `delete_eq_profile` and persists to `eq.toml`; see [Backend Internals](/desktop-backend-internals) for the DSP.

## Downloads

- **Download Format**: `downloadFormat` (`raw` = Original, `mp3`, `flac`, `wav`, `opus`), read by `download_track` / `download_album` in Rust.
- **Import Local Files**: `pick_and_import` opens a native file dialog (`tauri-plugin-dialog`, called from Rust) and copies the files into `~/Music/Firmium`.

## Services

- **Last.fm**: `lastfmKey` / `lastfmSecret` are stored in the OS keyring (service `firmium-desktop`, keys `lastfm_key` / `lastfm_secret`), not in `config.toml`. The on/off switch is UI state derived from whether a key exists; turning it off clears both. With a key, `get_artist_info` overlays Last.fm's bio and `artist_recommendations` can use `artist.getsimilar`.
- **ListenBrainz**: `listenbrainzToken` in the keyring; a stored token enables submission (`commands/listenbrainz.rs`).
- **LRCLIB**: `lrclibEnabled`, read by `Core::lyrics`.
- **Word-by-word lyrics**: `lyricsWordFill`. LRC has only line timing, so `TimedLyrics` (`backend/core/library.rs`) spreads each line's window across its words by character length.

## Stats

Shows the history summary (`Api.historySummary`), and **Export** CSV/JSON (`Api.exportHistory` serializes in Rust and opens a save dialog).

## Account

Connection status with **Disconnect** / **Connect**, and a button into the account modal for saved accounts.

## Debug

**App Version** (`get_app_version`), **Wipe Cover Cache** (`clear_cover_cache`), **Reset Settings** (`Core::reset_settings`; connection and accounts are kept).

## See also

- [Settings & Themes Internals](/settings-themes-internals)
- [How it Works](/desktop-indepth-overview)
