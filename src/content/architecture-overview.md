# Architecture Overview

This page is a tour of how Firmium is built, for anyone who wants to read the code, fix a bug, or add a feature. It's written to be readable without deep Rust or Svelte knowledge, but assumes you're comfortable with general programming concepts.

## The repositories

Firmium is split across a few repositories:

- **firmium**: the actual app, both the Linux desktop app and the Android app live here.
- **firmium-site**: the marketing/showcase website for Firmium.
- **firmium-docs**: this documentation site.

This page is about the `firmium` repo.

## Desktop app

The desktop app is a [Tauri](https://tauri.app/) app: a web-based UI (built with [Svelte](https://svelte.dev/)) running inside a native window, backed by a small Rust program for things the browser can't do, like audio playback and talking to the OS keyring.

```
src/                  Svelte frontend (the UI)
  views/              One file per screen (AlbumList, ArtistDetail, Settings, ...)
  lib/
    api.js            Talks to your Navidrome/OpenSubsonic server
    stores.js         Shared app state (current theme, queue, playback settings, ...)
    playback.js       Decides what to play next, handles crossfade/gapless logic
    coverCache.js      Caches album art in memory
  App.svelte          Top-level layout, routing, theme application

src-tauri/            Rust backend (runs natively, not in the browser)
  src/lib.rs          Tauri "commands" the frontend can call (list_themes, get_app_version, ...)
  src/audio.rs        Actual audio playback, using the `rodio` audio library

themes/               Built-in color theme files (.toml)
```

**How a screen works**: each view in `src/views/` is a Svelte component that calls functions in `src/lib/api.js` to fetch data from your server (albums, artists, playlists, etc.) and renders it. Shared state, like what's currently playing or which theme is active, lives in `src/lib/stores.js` so multiple views can read and update it.

**How playback works**: when you hit play, the frontend calls into `src-tauri/src/audio.rs` (via Tauri commands defined in `src-tauri/src/lib.rs`), which streams the audio file from your server and plays it through `rodio`. Settings like crossfade and gapless playback (see [Queue & Playback](/queue-playback)) are handled in `src/lib/playback.js`, which decides when to tell the Rust side to start fading or preloading the next track.

**How themes work**: theme files are TOML files, either bundled in `themes/` or placed by the user in their config directory. The Rust side (`list_themes` in `lib.rs`) finds and merges both sets, and the frontend applies the chosen theme's colors as CSS variables. See [Settings & Themes Internals](/settings-themes-internals) for the full mechanism.

## Android app

The Android app is a separate, native app written in Kotlin with Jetpack Compose, built independently of the desktop app with Gradle. It lives in `android/` and has its own architecture document at [`android/CLAUDE.md`](https://github.com/fossisawesome/firmium/blob/main/android/CLAUDE.md).

It mirrors the same ideas as the desktop app (browse a Navidrome server, play music, manage playlists) but with Android-native UI and playback (ExoPlayer) instead of Svelte and Tauri/rodio.

## Making a change

A typical workflow:

1. Run the app locally with `npm run dev:app` (desktop) or `./gradlew installDebug` (Android). See [Building from Source](/building-from-source) for full setup.
2. For UI changes, find the relevant view in `src/views/` (desktop) or the matching screen in `android/app/src/main/java/...` (Android).
3. For changes to how data is fetched or stored, look in `src/lib/api.js` and `src/lib/stores.js` (desktop) or the equivalent ViewModel/repository classes (Android).
4. For audio/playback changes, the desktop logic is split between `src/lib/playback.js` (when to do what) and `src-tauri/src/audio.rs` (how it's actually played).

Whenever a change adds or changes a user-facing feature on one platform, check whether the same feature makes sense on the other platform too (desktop and Android), since Firmium aims to keep them in sync where it makes sense.

If your change affects settings, themes, or how the app is built/packaged, remember to update the relevant docs page too: [Settings](/settings), [Customizing Themes](/custom-themes), [Settings & Themes Internals](/settings-themes-internals), or [Building from Source](/building-from-source).
