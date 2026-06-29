# Settings

The Settings view is split into a few groups: Appearance, Playback, Equalizer, Downloads, Stats Export, Services, Account, and Debug.

## Appearance

### Window Decorations

Show or hide the native title bar and window borders (Linux desktop only). Turn this off for a more minimal, borderless look.

### Theme

Choose the color theme for the app, from the built-in options or any custom themes you've added. See [Customizing Themes](/custom-themes).

### Font

Choose the interface font from a curated list: Inter, Liberation Mono, Monospace, System, Iced, Comic Sans, Sans Serif, BigBlue Terminal, Cousine, FiraCode, and Hack.

On desktop, the new font applies the next time you launch Firmium. On Android, it applies immediately.

### Visualizer

Turn on an audio-reactive visualizer for the now playing screen. It's off by default. When enabled, pick a style: **Bars** (a frequency-bar spectrum), **Orb** (a glowing audio-reactive orb), or **Oscilloscope** (the waveform wrapped into a circle). On both desktop and mobile you can tap the visualizer to cycle styles, and the toggle in the now playing screen switches between the album art and the visualizer.

On desktop, **Cover-Colored Visualizer** (in Settings, on by default) tints the visualizer with the colors of the current album's artwork. Turn it off to have the visualizer follow your chosen theme's colors instead. On mobile the visualizer always follows the album artwork.

## Playback

### Bit-Perfect Audio

Controls how Firmium routes audio to the hardware. Three modes are available:

- **Off** — Standard software playback. Audio is resampled to the device's default output rate. Crossfade and Gapless work normally in this mode.
- **Relaxed** (default) — Tries to open the output stream at each track's native sample rate, avoiding resampling when the device supports it. Falls back gracefully to resampling if the device can't match. Crossfade and Gapless work normally.
- **Strict** — Same native-rate matching as Relaxed, but crossfade is automatically disabled. Tracks play with hard cuts between them.

Selecting Strict automatically turns off Crossfade. Enabling Crossfade while in Strict mode resets Bit-Perfect to Relaxed.

### Crossfade

Smoothly blends the end of one track into the start of the next. You can set how long the blend lasts (1-12 seconds), and pick the blend's curve: **Linear** fades volume evenly, while **Logarithmic** approximates an equal-power fade that sounds more even to the ear during the overlap. Turning this on turns off Gapless Playback, since the two don't work together. See [Queue & Playback](/queue-playback).

### Gapless Playback

Removes any pause between tracks by preparing the next track ahead of time. Turning this on turns off Crossfade. See [Queue & Playback](/queue-playback).

### ReplayGain

When enabled (the default), Firmium reads loudness gain values provided by your server (OpenSubsonic `replayGain` fields) and applies them during playback so tracks play at a consistent volume regardless of how they were mastered. Turn this off to hear tracks at their raw recorded levels.

### Continue playing after queue ends

When enabled, Firmium keeps playing once your queue runs out by adding tracks similar to the last song (Smart Radio). Off by default. See [Discovery & Smart Radio](/discovery).

## Equalizer

A multi-band equalizer with its own section in Settings. It's off by default; flip **Enable Equalizer** to apply the active profile to playback.

- **Output Device** — choose which device a profile is assigned to. Firmium auto-detects your output devices; the profile assigned to your current default device is the one you actually hear.
- **Mode** — **Graphic** gives a fixed 10-band layout (31 Hz to 16 kHz) with one gain slider per band. **Parametric** lets you define your own bands by frequency, gain, and Q.
- **Profile** — pick the active profile for the selected device, or **Save as** to store the current settings under a name. Delete removes a profile.

On desktop, profiles are stored in `eq.toml` in Firmium's config folder. On mobile you can't browse that file directly, so use **Import profile** to pick a `.toml` file (for example one exported from the desktop app) through the system file picker; its profiles are added to your list.

### Imported profiles (desktop drop folder)

On desktop you can also drop standalone profile files into `~/.config/firmium/eq-profiles/` (the folder is created for you). Each file is a single profile and appears in the profile list automatically, marked with a lock icon as **read-only** — you can select and listen to it, but renaming, editing its bands, or deleting it is disabled. To change an imported profile, edit its `.toml` file directly, or save a copy under a new name (which becomes an ordinary editable profile). A profile file looks like:

```toml
name = "My Profile"
type = "graphic"   # or "parametric"

[[bands]]
freq = 32
gain = 0.0

[[bands]]
freq = 63
gain = 2.5
# ...one [[bands]] table per band
```

If an imported profile has the same name as one you saved, the saved profile wins. Invalid files are skipped silently.

On desktop, the equalizer is bypassed when **Bit-Perfect Audio** is set to Strict, so the signal stays untouched in that mode. On Android the equalizer uses the system audio effects; parametric Q is approximated since the system equalizer only exposes fixed bands.

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
downloaded in the track list, even after restarting the app. An album, single, EP, or
playlist is marked as downloaded once every one of its tracks is saved.

### Download Entire Library

On Android, when connected to a server, this button downloads every album and track
from your library to the device for offline playback, using the chosen Download Format.
It shows live progress (tracks done out of total) and keeps running while you use the
rest of the app; tracks already downloaded are skipped.

## Stats Export

Firmium keeps a private play history on your device — every track you finish is recorded locally, with no server involved. This section turns that history into something you can look at and share. On desktop these controls appear under the **Account** category. See [Recap & Listening Stats](/recap).

- **Listening Summary** — a quick line showing your total plays, total listening time, and how many distinct tracks and artists you've heard.
- **Firmium Recap** — opens the full Recap: a set of full-screen, swipeable cards covering your top tracks, artists, albums, genre, listening times, biggest discovery, and streak.
- **Export Play History** — saves your full local history. On desktop you pick **CSV** or **JSON** and choose where to save the file; on Android the same choice opens the system share sheet. CSV opens in any spreadsheet; JSON keeps the raw structure.

## Services

### Last.fm Integration

Use your own [Last.fm](https://www.last.fm/) account to fetch artist photos and biographies. When enabled, you'll be asked for your Last.fm API key and secret.

### ListenBrainz Scrobbling

Submit each completed track to [ListenBrainz](https://listenbrainz.org/) alongside your server's own scrobbling. When enabled, paste your ListenBrainz user token; Firmium posts a listen (artist, track, release, timestamp) every time a track finishes. Clearing the token or turning this off stops submissions.

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
- **Wipe Cover-Art Cache**: clears cached cover art. Doesn't affect your server or saved settings.
- **Reset Preferences**: resets all preferences back to their defaults, including your saved login.

## Updating Firmium

How you get updates depends on your platform:

- **Linux (.deb / .rpm / COPR / AUR)**: update through your package manager (`apt`, `dnf`, etc.) or COPR/AUR repo, like any other system package.
- **Windows / Linux (AppImage)**: there's no in-app updater yet — download the latest installer/AppImage from the [releases page](https://github.com/fossisawesome/firmium/releases/latest).
- **Android**: update through the Play Store, or by installing a new APK manually.

For where each setting is stored and how it's wired up in the code, see [Settings & Themes Internals](/settings-themes-internals).
