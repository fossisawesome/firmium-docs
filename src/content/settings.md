# Settings

The Settings view is split into a few groups: Appearance, Playback, Downloads, Services, Account, and Debug.

## Appearance

### Window Decorations

Show or hide the native title bar and window borders (Linux desktop only). Turn this off for a more minimal, borderless look.

### Theme

Choose the color theme for the app, from the built-in options or any custom themes you've added. See [Customizing Themes](/custom-themes).

### Visualizer

Turn on an audio-reactive visualizer for the now playing screen. It's off by default. When enabled, pick a style: **Bars** (a frequency-bar spectrum), **Orb** (a glowing audio-reactive orb), or **Oscilloscope** (the waveform wrapped into a circle). On mobile you can also tap the visualizer to cycle styles, and the toggle in the now playing screen switches between the album art and the visualizer.

## Playback

### Bit-Perfect Audio

Controls how Firmium routes audio to the hardware. Three modes are available:

- **Off** — Standard software playback. Audio is resampled to the device's default output rate. Crossfade and Gapless work normally in this mode.
- **Relaxed** (default) — Tries to open the output stream at each track's native sample rate, avoiding resampling when the device supports it. Falls back gracefully to resampling if the device can't match. Crossfade and Gapless work normally.
- **Strict** — Same native-rate matching as Relaxed, but crossfade is automatically disabled. Tracks play with hard cuts between them.

Selecting Strict automatically turns off Crossfade. Enabling Crossfade while in Strict mode resets Bit-Perfect to Relaxed.

### Crossfade

Smoothly blends the end of one track into the start of the next. You can set how long the blend lasts (1-12 seconds). Turning this on turns off Gapless Playback, since the two don't work together. See [Queue & Playback](/queue-playback).

### Gapless Playback

Removes any pause between tracks by preparing the next track ahead of time. Turning this on turns off Crossfade. See [Queue & Playback](/queue-playback).

### ReplayGain

When enabled (the default), Firmium reads loudness gain values provided by your server (OpenSubsonic `replayGain` fields) and applies them during playback so tracks play at a consistent volume regardless of how they were mastered. Turn this off to hear tracks at their raw recorded levels.

## Downloads

### Download Format

Sets the file format used when you download a track, album, single, EP, or playlist
track to your local library (see [Library Basics](/library-basics)). Choices are
**Original** (the file exactly as stored on your server, no conversion), **MP3**,
**FLAC**, **WAV**, or **Opus**. Defaults to Original. If your server can't produce the
chosen format, the download fails with an error instead of saving a broken file.

Downloaded files are saved under `~/Music/Firmium/<Album Artist>/<Album>/` (the same
folder used for local-library imports). On Windows this is
`%USERPROFILE%\Music\Firmium\...`. Tracks already present in this folder show as
downloaded in the track list, even after restarting the app.

## Services

### Last.fm Integration

Use your own [Last.fm](https://www.last.fm/) account to fetch artist photos and biographies. When enabled, you'll be asked for your Last.fm API key and secret.

### External Lyrics (LRCLIB)

When your server doesn't have lyrics for a song, Firmium can look them up from [LRCLIB](https://lrclib.net/), a free community lyrics database. On by default.

## Account

Shows your connection status, with a **Connect** or **Disconnect** button (same action
as the account icon - see [Connecting to Navidrome](/connecting-to-navidrome)).

### Auto-Login

When enabled, Firmium signs you in automatically the next time you open the app, using your saved credentials. See [Connecting to Navidrome](/connecting-to-navidrome).

## Debug

These options are mainly useful for troubleshooting or reporting bugs:

- **App Version**: shows the version of Firmium you're running.
- **Software Update**: checks for a newer release and installs it in place. See [Updating Firmium](#updating-firmium) below.
- **Wipe Cache**: clears cached cover art. Doesn't affect your server or saved settings.
- **Delete User Settings**: resets all preferences back to their defaults, including your saved login.

## Updating Firmium

How you get updates depends on your platform:

- **Windows**: use the Software Update button under Settings > Debug. Firmium checks the latest GitHub release, and if a newer version is available, downloads and installs it, then restarts.
- **Linux (AppImage)**: same in-app update flow as Windows.
- **Linux (.deb / .rpm / COPR)**: update through your package manager (`apt`, `dnf`, etc.) or COPR repo, like any other system package. The in-app update button isn't available for these builds, since package managers handle their own installs.
- **Android**: update through the Play Store, or by installing a new APK manually.

For where each setting is stored and how it's wired up in the code, see [Settings & Themes Internals](/settings-themes-internals).
