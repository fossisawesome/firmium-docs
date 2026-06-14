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
  - **Bit-perfect Audio** — toggle, on by default. Reopens the audio output device at each
    track's native sample rate when possible, avoiding resampling by rodio/cpal. May cause a
    brief click when the sample rate changes between tracks. On PipeWire systems this only
    affects the stream Firmium opens — the ALSA sink itself may still be locked to a fixed
    rate and resample downstream unless `default.clock.allowed-rates` is configured. See
    [Troubleshooting](/troubleshooting).
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
