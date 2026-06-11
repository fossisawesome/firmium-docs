# Desktop Architecture

This page is a tour of how the Firmium desktop app is built, for anyone who wants to read the code, fix a bug, or add a feature. For a higher-level introduction to the whole project (including the Android app), see the [Developer Overview](/developer-overview).

## Desktop app

The desktop app is a [Tauri](https://tauri.app/) app: a web-based UI (built with [Svelte](https://svelte.dev/) and TypeScript) running inside a native window, backed by a small Rust program for things the browser can't do, like audio playback and talking to the OS keyring.

```
src/                  Svelte frontend (the UI)
  views/              One file per screen (AlbumList, ArtistDetail, Settings, ...)
  components/         Shared UI pieces (PlayerBar, Sidebar, LyricsPanel, PlaylistMenu, ...)
  lib/
    api.ts            Talks to your Navidrome/OpenSubsonic server
    stores.ts         Shared app state (current theme, queue, playback settings, ...)
    playback.ts       Decides what to play next, handles crossfade/gapless logic
    coverCache.ts      Caches album art in memory
  App.svelte          Top-level layout, routing, theme application

src-tauri/            Rust backend (runs natively, not in the browser)
  src/lib.rs          Tauri "commands" the frontend can call (list_themes, get_app_version, ...)
  src/audio.rs        Actual audio playback, using the `rodio` audio library

themes/               Built-in color theme files (.toml)
```

**How a screen works**: each view in `src/views/` is a Svelte component that calls functions in `src/lib/api.ts` to fetch data from your server (albums, artists, playlists, etc.) and renders it. Shared state, like what's currently playing or which theme is active, lives in `src/lib/stores.ts` so multiple views can read and update it.

**How playback works**: when you hit play, the frontend calls into `src-tauri/src/audio.rs` (via Tauri commands defined in `src-tauri/src/lib.rs`), which streams the audio file from your server and plays it through `rodio`. Settings like crossfade and gapless playback (see [Queue & Playback](/queue-playback)) are handled in `src/lib/playback.ts`, which decides when to tell the Rust side to start fading or preloading the next track.

**How themes work**: theme files are TOML files, either bundled in `themes/` or placed by the user in their config directory. The Rust side (`list_themes` in `lib.rs`) finds and merges both sets, and the frontend applies the chosen theme's colors as CSS variables. See [Settings & Themes Internals](/settings-themes-internals) for the full mechanism.

## Going further

For a control-by-control walkthrough of the UI (player bar, sidebar, library views, playlists, settings) and the data flow behind it, see [Desktop In-depth](/desktop-indepth-overview).

If your change affects settings, themes, or how the app is built/packaged, remember to update the relevant docs page too: [Settings](/settings), [Customizing Themes](/custom-themes), [Settings & Themes Internals](/settings-themes-internals), or [Building from Source](/building-from-source).
