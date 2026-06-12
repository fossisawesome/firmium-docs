# Desktop In-depth: Player Bar

What each control in `src/components/PlayerBar.svelte` does. For the data flow behind
playback, see [How it Works](/desktop-indepth-overview).

## Player Bar (`src/components/PlayerBar.svelte`)

- **Album art / track info** — shows the current track's cover, title, and artist, read from
  the playback stores. Clicking the cover or text doesn't trigger navigation. Below the
  artist, a format line (e.g. `FLAC · 96 kHz · 24-bit · 1411 kbps`) is shown via
  `formatTrackInfo()` when the server provides this metadata, with "Bit-perfect" appended
  when the audio output is running at the track's native sample rate (see
  [Queue & Playback](/queue-playback)).
- **Volume slider** — drags call `setVolume()`, which updates the volume store and calls
  `audioBridge.setVolume()` to change playback volume on the Rust side immediately.
- **Seek bar** — shows playback progress. While dragging, `isSeeking` is set so the position
  display follows your drag instead of the live polled position; releasing calls
  `audioBridge.seek()` to jump to that position in the stream.
- **Previous** — calls `prevTrack()`. If more than a couple seconds into the track, restarts
  the current track instead of going back; otherwise moves to the previous queue item.
- **Play/Pause** — calls `togglePlay()`, which toggles `playbackState` and tells the audio
  bridge to pause or resume the stream.
- **Next** — calls `nextTrack()` to advance to the next item in the queue (respecting shuffle
  if enabled).
- **Repeat** — calls `cycleRepeat()`, cycling through Off → Repeat All → Repeat One. A small
  badge on the icon indicates the current mode.
- **Lyrics** — toggles the `lyricsOpen` store and calls `fetchAndShowLyrics()` to load synced
  or unsynced lyrics for the current track from LRCLIB (if enabled in Settings).

## See also

- [How it Works](/desktop-indepth-overview)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Settings](/desktop-indepth-settings)
