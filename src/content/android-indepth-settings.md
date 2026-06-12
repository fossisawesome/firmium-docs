# Android In-depth: Settings

What each control in `ui/screens/SettingsScreen.kt` does. The Android settings screen is a
category list that drills down into per-category panels, mirroring the desktop app's
[Settings](/desktop-indepth-settings) categories.

## Settings (`ui/screens/SettingsScreen.kt`)

- **Appearance**
  - **Color Theme** — dropdown listing `ALL_THEMES`; selecting one applies its colors via
    `LocalFirmiumColors` immediately.
- **Playback**
  - **Crossfade** — toggle plus a duration slider when enabled.
  - **Gapless** — toggle for gapless playback.
- **Services**
  - **External Lyrics (LRCLIB)** — toggle to fetch lyrics from LRCLIB when the server doesn't
    provide them.
  - **Last.fm Integration** — toggle, plus API Key/Secret fields with a show/hide control.
- **Account**
  - Displays the connected server URL and username.
  - **Auto-Login** — toggle for automatically reconnecting on launch.
  - **Disconnect server** — signs out and returns to the login screen.
- **About**
  - **App Version** — displays the current version.
  - **Wipe Cache** — clears cached covers and list data.
  - **Clear Cache** — removes all cached app data from disk.
  - **Reset Settings** — resets all settings to defaults.

Settings are stored via `AppPreferences` and `SecureStorage`, the Android equivalents of the
desktop app's localStorage and OS keyring usage — see
[Settings & Themes Internals](/settings-themes-internals) for the desktop-side details.

## See also

- [How it Works](/android-indepth-overview)
- [Desktop In-depth: Settings](/desktop-indepth-settings)
