# Android In-depth: Settings

What each control in `ui/screens/SettingsScreen.kt` does. The Android settings screen is a
category list that drills down into per-category panels, mirroring the desktop app's
[Settings](/desktop-indepth-settings) categories.

## Settings (`ui/screens/SettingsScreen.kt`)

- **Appearance**
  - **Color Theme** — dropdown listing `ALL_THEMES`; selecting one applies its colors via
    `LocalFirmiumColors` immediately.
- **Playback**
  - **Bit-Perfect Audio** — segmented selector: Off / Relaxed / Strict.
    Stored as `"bit_perfect_mode"` in DataStore (`AppPreferences.BIT_PERFECT_MODE`).
    Code path: `PlayerViewModel.setBitPerfectMode()` → `AudioPlayer.bitPerfectMode` → read
    in `buildPlayer()` to set `AudioOffloadPreferences` on the ExoPlayer instance:
    - **Off** — no offload configuration; standard software pipeline.
    - **Relaxed** — `AUDIO_OFFLOAD_MODE_PREFERRED`, `setIsGaplessSupportRequired(false)`,
      offload scheduling enabled. `PlayerViewModel.skipToNext()` calls `crossfadeToNext()`
      only when `audioFormatsMatch()` returns true (same suffix, samplingRate, bitDepth);
      otherwise calls `playAt()` for a hard cut. The position-tracking crossfade pre-roll
      also fires for format-matched tracks.
    - **Strict** — `AUDIO_OFFLOAD_MODE_REQUIRED`, `setIsGaplessSupportRequired(true)`,
      offload scheduling enabled. Hard cuts; no crossfade.
    Enabling Relaxed or Strict sets `crossfadeEnabled = false` in prefs and state.
    Enabling Crossfade sets `bitPerfectMode = "off"`.
  - **Crossfade** — toggle plus a duration slider when enabled. Greyed out when
    Bit-Perfect is Relaxed or Strict.
  - **Gapless** — toggle for gapless playback. Greyed out when Bit-Perfect is Relaxed.
- **Downloads**
  - **Download Format** — dropdown (Original/MP3/FLAC/WAV/Opus) for track, album, and
    playlist downloads. See [Settings](/settings#downloads).
- **Services**
  - **External Lyrics (LRCLIB)** — toggle to fetch lyrics from LRCLIB when the server doesn't
    provide them.
  - **Last.fm Integration** — toggle, plus API Key/Secret fields with a show/hide control.
- **Account**
  - Displays the connected server URL and username, or "Not connected" when browsing
    the local library.
  - **Auto-Login** — toggle for automatically reconnecting on launch.
  - **Disconnect server** — signs out and falls back to the local library. The same
    connect/disconnect actions are also available from the account icon in the top app
    bar - see [Connecting to Navidrome](/connecting-to-navidrome).
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
