# Usage

## Logging In

Open Firmium and enter your OpenSubsonic server URL (e.g. `http://your-navidrome-server:4533`), along with your username and password.

If **Auto-Login** is enabled (the default — see [Settings](/settings#account)) and you chose to save your password, Firmium reconnects automatically on the next launch. Credentials are stored securely in your OS keyring (GNOME Keyring / KWallet on Linux, Keystore-backed EncryptedSharedPreferences on Android) — never written to disk in plaintext.

## Navigation

The sidebar gives you quick access to:

- **Home** — recently added and recently played albums
- **Albums** — your full album library
- **Artists** — browse by artist, with biography and discography
- **Search** — search across artists, albums, and tracks
- **Playlists** — view and manage server-side playlists
- **Settings** — configure the app (see [Settings](/settings))

## Playback

The player bar at the bottom controls playback: play/pause, skip, seek, and volume. Volume is remembered per device.

Firmium can transition between tracks in two ways, configurable in [Settings → Playback](/settings#playback):

- **Crossfade** — smoothly blends the end of one track into the start of the next, with a configurable duration (1–12 seconds)
- **Gapless Playback** — pre-buffers the next track so there's no pause between songs

These two modes are mutually exclusive — enabling one disables the other.

## Lyrics

Open the lyrics panel from the player bar to view synced (karaoke-style) or unsynced lyrics for the current track. If your server doesn't provide lyrics, Firmium can optionally fetch them from [LRCLIB](https://lrclib.net/) — see [Settings → Services](/settings#services).

## Artist Biographies

Artist pages can show a biography and photo fetched from Wikipedia, or from Last.fm if you've configured your own API key (see [Settings → Services](/settings#services)).

## Themes

Firmium ships with a number of built-in color themes (including `firmium`, `gruvbox`, `dracula`, `nord`, `tokyo-night`, the Catppuccin family, and more), selectable from [Settings → Appearance](/settings#appearance). You can also create your own — see [Custom Themes](/custom-themes).

## Settings

All app preferences live in the Settings view, accessible from the sidebar. See the full [Settings reference](/settings) for every option, what it does, and how it's stored.
