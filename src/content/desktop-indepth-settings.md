# Desktop In-depth: Settings

What each control in `src/views/Settings.svelte` does. For how settings and themes are stored
and wired up internally, see [Settings & Themes Internals](/settings-themes-internals).

## Settings (`src/views/Settings.svelte`)

- **Appearance**
  - **Window Decorations** — toggles native window title bar/borders.
  - **Theme** — dropdown of available color themes (built-in and user-installed); selecting
    one applies its colors immediately.
- **Playback**
  - **Crossfade** — toggle, plus a duration slider when enabled. Mutually exclusive with
    Gapless.
  - **Gapless** — toggle for gapless playback between tracks. Mutually exclusive with
    Crossfade.
- **Equalizer** (`src/components/EqualizerSettings.svelte`)
  - A dedicated category rendering its own component. On mount it calls `get_eq_state` and
    `list_audio_devices`, then drives the EQ entirely through Tauri commands.
  - **Enable Equalizer** → `set_eq_enabled`. **Output Device** dropdown is fed by
    `list_audio_devices` (real cpal enumeration in `audio/mod.rs::list_devices`).
  - **Profile** dropdown → `set_eq_active_profile(device, profile)`; **Delete** →
    `delete_eq_profile`; **Save as** → `save_eq_profile(name, kind, bands)`.
  - **Mode** toggle switches a profile between `graphic` (fixed 10-band ISO sliders) and
    `parametric` (freq/gain/Q rows). Slider/field edits debounce-call `set_eq_bands(profile,
    bands)`, which the backend live-applies to running decode feeders.
  - Commands live in `src-tauri/src/commands/equalizer.rs`; config persists to
    `eq.toml` in the app config dir. DSP details: see
    [Backend Internals](/desktop-backend-internals).
- **Services**
  - **Last.fm Integration** — toggle, plus fields for an API Key and Secret, stored in the OS
    keyring.
  - **External Lyrics (LRCLIB)** — toggle to enable fetching lyrics from LRCLIB when the
    server doesn't provide them.
- **Account**
  - **Auto-Login** — toggle for automatically reconnecting on launch.
  - **Logout** — signs out and returns to the login screen (same as Sidebar's Disconnect).
- **Debug**
  - **App Version** — displays the current version.
  - **Software Update** — checks for and installs a newer version (Windows/Linux AppImage
    builds).
  - **Wipe Cache** — clears cached covers and list data.
  - **Delete User Settings** — clears all `firmium_*` keys from localStorage, resetting the
    app to defaults.

## See also

- [Settings & Themes Internals](/settings-themes-internals)
- [How it Works](/desktop-indepth-overview)
