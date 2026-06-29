# Desktop In-depth: Settings

What each control in the Settings screen does, and where it lives in the native
iced code. The whole screen is built in `src/app/view/settings.rs` — there is no Svelte. For how
settings and themes are stored and wired up internally, see
[Settings & Themes Internals](/settings-themes-internals).

## Layout (`settings_view` in `src/app/view/settings.rs`)

`settings_view` renders a two-column layout: a fixed 180px category rail on the
left (a `column` of category buttons driving `Message::SetSettingsCategory`) and,
to the right, the active category's content panel. The selected category is held
on `App` as `settings_category: SettingsCategory` (enum: `Appearance`, `Playback`,
`Equalizer`, `Downloads`, `Services`, `Account`, `Debug`). Each category's content
is produced by its own method (`settings_appearance`, `settings_playback`, …),
and every row uses the `sett_row(title, desc, control)` / `sett_panel_title(title)`
helpers for consistent styling.

## Appearance (`settings_appearance`)

- **Theme** — a grid of theme swatches (`theme_swatch`), built from
  `self.themes` (`commands::themes::list_themes`). Selecting one applies its colors
  immediately and persists `theme_id` to config.
- **Window Decorations** — toggles the native title bar/borders via
  `Message::SetDecorations`. winit only supports *toggling* at runtime, so the
  handler calls `iced::window::toggle_decorations` on the latest window; the
  persisted value (`config.window_decorations`) is applied at boot in `src/main.rs`
  through `iced::application(...).decorations(...)`.

## Playback (`settings_playback`)

- **Crossfade** — toggle (`Message::SetCrossfadeEnabled`); when on, a **Crossfade
  Duration** slider (1–12 s) appears. Both call
  `commands::queue::set_crossfade_settings`.
- **Gapless Playback** — `commands::queue::set_gapless_enabled`.
- **ReplayGain** — `commands::queue::set_replay_gain_enabled`.
- **Auto-continue (Smart Radio)** — `commands::queue::set_auto_continue`.
- **Bit-Perfect Audio** — a segmented Off / Relaxed / Strict control
  (`Message::SetBitPerfect` → `AudioPlayer::set_bit_perfect_mode`).

## Equalizer (`settings_equalizer`)

This category is a redirect: an **Open Equalizer** button toggles the dedicated EQ
side panel (`Message::TogglePanel(Panel::Equalizer)`), rendered by `App::eq_panel`.
The EQ itself is driven through `commands::equalizer` (`set_eq_enabled`,
`set_eq_active_profile`, `save_eq_profile`, `set_eq_bands`, …) and persists to
`eq.toml`. DSP details: see [Backend Internals](/desktop-backend-internals).

## Downloads (`settings_downloads`)

- **Download Format** — segmented control (Original / MP3 / FLAC / WAV / Opus).
  The selection is stored in `config.download_format` and threaded into
  `commands::downloads::download_track` and `download_album` as their `format`
  argument. "Original" maps to `raw` (the file exactly as stored on the server).

## Services (`settings_services`)

- **Last.fm Integration** — toggle plus **API Key** and **Secret** fields. Values
  are saved to the OS keyring (service `firmium-desktop`, keys `lastfm_key` /
  `lastfm_secret`) via `commands::credentials::save_password`. When a key is set,
  `commands::subsonic::get_artist_info` overlays a richer bio (and any
  non-placeholder image) from Last.fm's `artist.getInfo` over the server baseline.
- **ListenBrainz Scrobbling** — toggle plus a **Token** field, saved to the keyring
  (`listenbrainz_token`). Presence of the token is what enables submission;
  `queue_manager` calls `commands::listenbrainz::fire_listenbrainz_listen` on track
  completion, which reads the token from the keyring.
- **External Lyrics (LRCLIB)** — toggle stored in `config.lrclib_enabled`, passed as
  the `use_lrclib_fallback` argument to `commands::subsonic::get_song_lyrics`.
- **Word-by-Word Lyrics Animation** — toggle stored in `config.lyrics_word_fill`.
  When on, `App::lyrics_panel` renders the active synced line as a karaoke fill.
  LRC carries only line-level timing, so per-word progress is approximated by
  distributing the line's time window evenly across its words.

## Account (`settings_account`)

- **Connection** — shows `username @ server` (read from `AppState.connection`) with
  a **Log out** button (`Message::Logout`), or **Connect**
  (`Message::ToggleAccountSwitcher`) when signed out.
- **Listening Stats** — the play-history summary (`self.history_summary`) with
  **Export CSV** / **Export JSON** (`Message::ExportStats`) and **View Recap**.

## Debug (`settings_debug`)

- **App Version** — `commands::app_info::get_app_version`.
- **Wipe Cache** — `Message::WipeCoverCache` → `commands::cover_cache::clear_cover_cache`
  (also clears the in-memory `cover_cache`).
- **Delete Settings** — `Message::DeleteSettings` resets preference fields to their
  defaults (connection and saved accounts are left untouched) and re-pushes them to
  the backend queue state.

## See also

- [Settings & Themes Internals](/settings-themes-internals)
- [How it Works](/desktop-indepth-overview)
