# Desktop In-depth: Player Bar

`components/PlayerBar.svelte` and the side panels. For the flow behind playback, see [How it Works](/desktop-indepth-overview).

## Player bar

State comes from `src/lib/stores.ts`: `currentTrack` (derived from `queueState`), `playbackState`, `position`, `duration`, `volume`. Every control calls `src/lib/api.ts`.

- **Cover / title / format**: `use:cover` loads art through the backend cache; `trackInfo` is the "FLAC · 96 kHz · 24-bit" string built in `commands/mappers.rs`.
- **Heart**: `Api.setStarred(id, 'song', ...)`, hidden for `local:` and `podcast:` ids.
- **Volume**: `Api.setSetting('volume', v)` → `Core::set_setting` persists it and calls `queue::set_queue_volume`.
- **Seek bar**: while dragging the bar shows the dragged value; on release `Api.seek(position)` → `queue::seek_queue`.
- **Shuffle / Previous / Play-Pause / Next**: `toggleShuffle`, `prev`, `togglePlay`, `next`.
- **Repeat**: cycles Off → Repeat All → Repeat One via `Api.setRepeat(repeatOne, repeatAll)`.

## Side panels

One panel is open at a time (`openPanel` store, `togglePanel(name)`). Each is a flex sibling next to the main area that animates its width.

- **Queue** (`QueuePanel.svelte`): the `queue` store; clicking a row calls `Api.playIndex(i)`.
- **Lyrics** (`LyricsPanel.svelte`): `Api.lyrics(song)` returns `TimedLyrics`; the active line is the last line whose `start` is at or before `position`. With word fill enabled, a `requestAnimationFrame` loop interpolates between position events and sets each word's `--progress` CSS variable. The panel glow uses `Api.coverColors(coverId).dominant`.
- **Similar tracks** (`SimilarTracksPanel.svelte`): `Api.similarTracks(song)`; Rust chooses `getSonicSimilarTracks` when the server advertises `sonicSimilarity`, otherwise the genre/artist fallback.
- **Equalizer** (`EqPanel.svelte` wrapping `EqualizerSettings.svelte`): `get_eq_state`, `set_eq_bands`, `set_eq_active_profile`, ...; edits are debounced 120 ms and applied live by `AudioPlayer::set_eq_runtime`.
- **Audio stats** (`AudioStatsPanel.svelte`): format, BPM and ReplayGain read from the current `Song`.

## See also

- [How it Works](/desktop-indepth-overview)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Settings](/desktop-indepth-settings)
