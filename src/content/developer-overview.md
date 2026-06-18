# Developer Overview

This page is a starting point for anyone who wants to read the Firmium code, fix a bug, or add a feature. It's written to be readable without deep Rust, Svelte, or Kotlin knowledge, but assumes you're comfortable with general programming concepts.

## The repositories

Firmium is split across a few repositories:

- **firmium**: the actual app — both the Linux/Windows desktop app and the Android app live here.
- **firmium-site**: the marketing/showcase website for Firmium.
- **firmium-docs**: this documentation site.

This page (and the rest of the Developer section) is about the `firmium` repo.

## Two apps, one product

Firmium ships as two separate apps that aim to feel like the same product:

- **Desktop** (Linux/Windows) — a [Tauri](https://tauri.app/) app: a Svelte/TypeScript UI running in a native window, backed by a Rust program for audio playback and OS integration.
- **Android** — a native Kotlin + Jetpack Compose app, built independently with Gradle, using Media3/ExoPlayer for playback.

They're built with completely different tech stacks, but both implement the same core ideas:

- **Library browsing** — albums, artists, and search against your Navidrome/OpenSubsonic server.
- **Queue & playback** — play/pause, skip, shuffle, repeat, crossfade, gapless playback, volume.
- **Playlists** — create, view, and add tracks to playlists, synced to the server where possible.
- **Lyrics & artist bios** — synced/unsynced lyrics, and artist info from Last.fm.
- **Themes & settings** — a shared set of color themes and a settings screen with the same categories (Appearance, Playback, Services, Account, Debug/About).

Whenever a change adds or changes a user-facing feature on one platform, check whether the same feature makes sense on the other platform too, since Firmium aims to keep them in sync where it makes sense.

## Where to go next

- [Desktop Architecture](/architecture-overview) and [Desktop In-depth](/desktop-indepth-overview) — Tauri/Svelte app structure, screens, and what each UI control does.
- [Android Architecture](/android-architecture) and [Android In-depth](/android-indepth-overview) — Kotlin/Compose app structure, screens, and what each UI control does.
- [Building from Source](/building-from-source) — set up a dev environment for either platform.
- [Settings & Themes Internals](/settings-themes-internals) — how settings and themes are stored and wired up (desktop).

## Making a change

A typical workflow:

1. Run the app locally with `npm run dev:app` (desktop) or `./gradlew installDebug` (Android). See [Building from Source](/building-from-source) for full setup.
2. For UI changes, find the relevant view in `src/views/` (desktop) or the matching screen/composable in `android/app/src/main/java/...` (Android).
3. For changes to how data is fetched or stored, look in `src/lib/api.ts` and `src/lib/stores.ts` (desktop) or the equivalent ViewModel/repository classes (Android).
4. For audio/playback changes, the desktop logic is split between `src/lib/playback.ts` (when to do what) and `src-tauri/src/audio/` (how it's actually played); Android playback is handled by `audio/AudioPlayer` and `audio/NowPlayingService`.

If your change affects settings, themes, or how the app is built/packaged, remember to update the relevant docs page too: [Settings](/settings), [Customizing Themes](/custom-themes), [Settings & Themes Internals](/settings-themes-internals), or [Building from Source](/building-from-source).
