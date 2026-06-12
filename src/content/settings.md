# Settings

The Settings view is split into a few groups: Appearance, Playback, Services, Account, and Debug.

## Appearance

### Window Decorations

Show or hide the native title bar and window borders (Linux desktop only). Turn this off for a more minimal, borderless look.

### Theme

Choose the color theme for the app, from the built-in options or any custom themes you've added. See [Customizing Themes](/custom-themes).

## Playback

### Crossfade

Smoothly blends the end of one track into the start of the next. You can set how long the blend lasts (1-12 seconds). Turning this on turns off Gapless Playback, since the two don't work together. See [Queue & Playback](/queue-playback).

### Gapless Playback

Removes any pause between tracks by preparing the next track ahead of time. Turning this on turns off Crossfade. See [Queue & Playback](/queue-playback).

### Bit-perfect Audio

On by default. Reopens the audio output device at each track's native sample rate when possible, so the file plays without being resampled. May cause a brief click when the sample rate changes between tracks. See [Queue & Playback](/queue-playback).

## Services

### Last.fm Integration

Use your own [Last.fm](https://www.last.fm/) account to fetch artist photos and biographies. When enabled, you'll be asked for your Last.fm API key and secret.

### External Lyrics (LRCLIB)

When your server doesn't have lyrics for a song, Firmium can look them up from [LRCLIB](https://lrclib.net/), a free community lyrics database. On by default.

## Account

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
