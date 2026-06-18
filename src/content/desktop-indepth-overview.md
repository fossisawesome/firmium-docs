# Desktop In-depth: How It Works

A look at the data and playback flow behind the desktop UI. For the high-level picture
first, see [Desktop Architecture](/architecture-overview).

## Data and playback flow

`App.svelte` is the root component: on mount it checks for saved credentials, applies the
saved theme and window decorations, and decides which view to show based on
`activeView` in `src/lib/stores.ts`.

Views (`src/views/*.svelte`) call functions in `src/lib/api.ts` (the `Api` object) to fetch
albums, artists, playlists, and search results from your Navidrome/OpenSubsonic server, and
render the results directly — there's no separate caching layer beyond `coverCache.ts` (album
art) and `listCache.ts` (list responses).

When you press play, `playerControls.ts` (`togglePlay`, `nextTrack`, `prevTrack`,
`cycleRepeat`) updates `stores.ts` and calls into `playback.ts`, which:

- Calls `audioBridge` (a Tauri IPC wrapper in `audio-bridge.ts`) to start streaming the track
  via the Rust `play_stream` command.
- Polls playback position/state every 750ms and writes it back to `currentPosition` /
  `playbackState` stores, which the Player Bar reads reactively.
- Watches for the track nearing its end and, depending on the Crossfade/Gapless settings,
  calls `crossfade_to()` or `preload_stream()`/`play_stream()` for the next track.

## See also

- [Player Bar](/desktop-indepth-player-bar)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Library Views](/desktop-indepth-library-views)
- [Playlists](/desktop-indepth-playlists)
- [Settings](/desktop-indepth-settings)
