# Desktop In-depth: Player Bar

What each control in `src/components/PlayerBar.svelte` does. For the data flow behind
playback, see [How it Works](/desktop-indepth-overview).

## Player Bar (`src/components/PlayerBar.svelte`)

- **Album art / track info** — shows the current track's cover, title, and artist, read from
  the playback stores. Clicking the cover or text doesn't trigger navigation. Below the
  artist, a format line (e.g. `FLAC · 96 kHz · 24-bit · 1411 kbps`) is shown via
  `formatTrackInfo()` when the server provides this metadata.
- **Volume slider** — drags call `setVolume()`, which updates the volume store and calls
  `audioBridge.setVolume()` to change playback volume on the Rust side immediately.
- **Seek bar** — shows playback progress. While dragging, `isSeeking` is set so the position
  display follows your drag instead of the live polled position; releasing calls
  `audioBridge.seek()` to jump to that position in the stream.
- **Previous** — calls `prevTrack()`. If more than a couple seconds into the track, restarts
  the current track instead of going back; otherwise moves to the previous queue item.
- **Play/Pause** — calls `togglePlay()`, which toggles `playbackState` and tells the audio
  bridge to pause or resume the stream.
- **Next** — calls `nextTrack()` to advance to the next item in the queue. When
  `shuffleEnabled` is true, `nextTrack()` instead picks a random index (other than the
  current one) from the queue. `shuffleEnabled` is set by the **Shuffle** button on
  album, artist, and playlist detail views (see [Library
  Views](/desktop-indepth-library-views) and [Playlists](/desktop-indepth-playlists)),
  not from the player bar itself.
- **Repeat** — calls `cycleRepeat()`, cycling through Off → Repeat All → Repeat One. A small
  badge on the icon indicates the current mode.
- **Lyrics** — toggles the `lyricsOpen` store and calls `fetchAndShowLyrics()` to load synced
  or unsynced lyrics for the current track from LRCLIB (if enabled in Settings).
- **Similar Tracks** — always shown. Toggles the `similarTracksOpen` store; if
  `hasSonicSimilarity` is true (the server advertises the `sonicSimilarity` OpenSubsonic
  extension), calls `Api.getSonicSimilarTracks()`, otherwise calls
  `Api.getSimilarTracksFallback()` (genre and similar-artist matches), to populate
  `SimilarTracksPanel.svelte` with similar tracks for the current track (see
  [Queue & Playback](/queue-playback)).
- **Visualizer** — toggles the `visualizerOpen` store, opening
  `VisualizerPanel.svelte`. On open it invokes `set_visualizer_enabled(true)`
  (gating the backend FFT task) and `start_visualizer_renderer(channel, w, h)`,
  passing a `tauri::ipc::Channel`; on close it calls `stop_visualizer_renderer`
  and `set_visualizer_enabled(false)`. Rendering happens in Rust (wgpu) — the
  panel is a passive 2D `<canvas>` that blits the raw RGBA frames it receives on
  the channel via `putImageData`. Mode buttons / tapping the canvas cycle
  orb → bars → oscilloscope (`set_visualizer_mode`), and cover-art colors are
  forwarded via `set_visualizer_palette` (see
  [Queue & Playback](/queue-playback) and
  [Desktop Backend Internals](/desktop-backend-internals)).
- **Audio Stats** — toggles the `audioStatsOpen` store, opening
  `AudioStatsPanel.svelte`. Display only (no API calls): it reads the current
  track's `trackInfo`, `bpm`, and `replayGain` (typed `ReplayGain` with
  track/album gain and peak) from the playback stores and renders them as a
  small table. Fields the server omits are shown as `—` or hidden.

## See also

- [How it Works](/desktop-indepth-overview)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Settings](/desktop-indepth-settings)
