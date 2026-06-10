# Firmium

*Smooth, fast, simple. Forever.*

Firmium is a cross-platform [OpenSubsonic](https://opensubsonic.netlify.app/) music streaming client built with Tauri 2, targeting **Linux desktop and Android**. It connects to any OpenSubsonic-compatible server — such as [Navidrome](https://www.navidrome.org/) — and provides lightweight, low-latency audio playback using the native OS audio engine.

> **Note:** Firmium is a *client only* — you need a self-hosted OpenSubsonic-compatible server to use it. [Navidrome](https://www.navidrome.org/) is the most popular choice and is free and open source.

## Features

**What makes Firmium stand out:**

- Native OS audio engine via Rodio (Linux) / ExoPlayer (Android) — no Electron, no Chromium audio stack
- Crossfade between tracks with configurable overlap
- Credentials stored securely in the OS keyring (GNOME Keyring / KWallet on Linux) or Android Keystore-backed EncryptedSharedPreferences — never written to disk in plaintext
- Android MediaSession integration: lock screen controls and persistent playback notification

**Everything else:**

- Synced and unsynced lyrics
- Wikipedia artist biographies
- Pretty UI with built-in color themes
- Cover art caching
- Per-device volume control
- Full OpenSubsonic API support (scrobbling, search, playlists, and more)

## Documentation

- [Installing](/installing) — install pre-built packages for Linux desktop and Android
- [Building from Source](/building-from-source) — set up a development environment and build packages yourself
- [Usage](/usage) — logging in, browsing your library, and using playback features
- [Custom Themes](/custom-themes) — write your own `.toml` theme file
- [Settings](/settings) — every option in the Settings page, what it does, and where it lives in the code

## Project Links

- [GitHub repository](https://github.com/fossisawesome/firmium)
- [Releases](https://github.com/fossisawesome/firmium/releases/latest)
- [Issue tracker](https://github.com/fossisawesome/firmium/issues)
- [License: GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html)
