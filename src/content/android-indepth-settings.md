# Android In-depth: Settings

What each control in `ui/screens/SettingsScreen.kt` does. The Android settings screen is a
category list that drills down into per-category panels, mirroring the desktop app's
[Settings](/desktop-indepth-settings) categories.

## Settings (`ui/screens/SettingsScreen.kt`)

- **Appearance**
  - **Color Theme** — dropdown listing `allThemes(context)` (built-in `ALL_THEMES` plus
    imported themes); selecting one applies its colors via `LocalFirmiumColors`
    immediately.
  - **Import theme** — `ActivityResultContracts.GetContent()` file picker. The picked
    file is validated and copied by `importThemeFromUri()` into `filesDir/themes/`
    (`ui/theme/ThemeImport.kt`, hand-rolled TOML parser mirroring `TomlEqParser`); a Toast
    reports success or the error. Imported themes show a trash icon that calls
    `deleteImportedTheme()`; built-ins don't. Rejected when the file is over 50 KB, isn't
    valid TOML, or has no `name`; a duplicate name overwrites silently.
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
  - **Crossfade** — toggle plus a duration slider and a curve dropdown (Linear /
    Logarithmic) when enabled. The curve is stored in `AppPreferences.CROSSFADE_CURVE`
    and applied by `AudioPlayer.crossfadeTo()`. Greyed out when Bit-Perfect is Relaxed
    or Strict.
  - **Gapless** — toggle for gapless playback. Greyed out when Bit-Perfect is Relaxed.
- **Equalizer** (`FirmiumEqualizerPanel` in `SettingsScreen.kt`)
  - Self-contained panel that talks to `AppPreferences` directly (DataStore keys
    `eq_enabled`, `eq_mode`, `eq_active_profile`, `eq_profiles_json`). Profiles are stored as
    a Gson JSON array of `EqProfile` (`data/eq/EqProfile.kt`).
  - **Enable Equalizer**, a profile list (tap to activate, Delete to remove), a Graphic/
    Parametric editor (10 sliders / freq-gain-Q rows), and **Save as** to create a profile.
  - **Import profile** launches `ActivityResultContracts.OpenDocument()`; the picked `.toml`
    is parsed by the hand-rolled `data/eq/TomlEqParser.kt` (handles the desktop's
    array-of-tables output and inline tables), merged into the profile list, and activated.
  - `PlaybackController` observes the four EQ prefs via `combine(...)`, builds an
    `EqualizerController.Config`, and calls `AudioPlayer.equalizer.setConfig()`. The
    `EqualizerController` (`audio/EqualizerController.kt`) attaches
    `android.media.audiofx.Equalizer` + `BassBoost` to each ExoPlayer session id (assigned up
    front in `AudioPlayer.setupEq()`), mapping each system band to the nearest logical band's
    gain. Parametric Q is not representable in the system EQ and is ignored.
- **Downloads**
  - **Download Format** — dropdown (Original/MP3/FLAC/WAV/Opus) for track, album, and
    playlist downloads. See [Settings](/settings#downloads).
  - **Download entire library** — shown when connected to a server; calls
    `DownloadManager.startDownloadAll()` and reflects its `downloadAllState` progress.
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
desktop app's `config.toml` and OS keyring usage — see
[Settings & Themes Internals](/settings-themes-internals) for the desktop-side details.

## See also

- [How it Works](/android-indepth-overview)
- [Desktop In-depth: Settings](/desktop-indepth-settings)
