# Android In-depth: Player Bar & Full Screen Player

What each control in `ui/components/PlayerBar.kt` and `ui/components/FullScreenPlayer.kt`
does.

## Player Bar (`ui/components/PlayerBar.kt`)

- **Cover art / track info** — shows the current track's cover, title, and artist from
  `PlayerState`, plus a format line (e.g. `FLAC · 44.1 kHz · 16-bit · 1004 kbps`) when the
  server provides this metadata.
- **Shuffle** — toggles shuffle mode for the queue.
- **Play/Pause** — toggles playback.
- **Next** — advances to the next track; disabled (greyed out) when `state.hasNext` is false.
- **Repeat** — cycles Off → Repeat All → Repeat One (same logic as the full player), with a "1" badge in Repeat One mode.
- **Tapping the bar** — opens the Full Screen Player.

## Full Screen Player (`ui/components/FullScreenPlayer.kt`)

- **Album art** — displayed with a background gradient extracted from the art via Android's
  Palette API, darkened to ~22% opacity. The art shrinks slightly when playback is paused.
- **Track format** — shows the same format line as the player bar below the artist name,
  when available. Tapping it expands an audio-stats block (the `AudioStats` composable):
  BPM and ReplayGain track/album gain + peak read from the `Song` model (display only, no
  API calls). Fields the server omits are shown as `—`.
- **Tap album art** — shows the lyrics in place of the art via the shared `LyricsLines`
  composable (`ui/components/LyricsSheet.kt`); an X button in the corner returns to the art.
- **Long-press album art** — pops up the `StarRating` row (1-5 stars) over the art with a
  scale/fade animation; tapping a star calls `onRate` and dismisses the popup.
- **Swipe left/right** — swiping the art left skips to the next track, swiping right goes to
  the previous track (handled via `detectHorizontalDragGestures`).
- **Drag handle** — drag down to dismiss the full screen player back to the player bar.
- **Seek bar** — shows and controls playback position.
- **More button** — the three-dot button beside the time row opens `PlayerMoreSheet.kt`, a
  grid of tiles: volume slider, add to playlist (`AddToPlaylistDialog.kt`), visualizer toggle,
  track info (expands `AudioStats`), view artist, add to queue, equalizer, and download.
- **Previous / Play-Pause / Next** — standard transport controls.
- **Shuffle** — toggles shuffle mode for the queue.
- **Repeat** — cycles Off → Repeat All → Repeat One, showing a "1" badge in Repeat One mode.
- **Queue** — opens the Queue sheet (see [Queue & Lyrics](/android-indepth-queue-lyrics)).
- **Similar Tracks** — shown when available; opens `SimilarTracksSheet.kt` with similar tracks
  for the current song (see [Queue & Lyrics](/android-indepth-queue-lyrics)).

In landscape orientation, the layout switches to place the album art beside the controls
rather than stacking them.

## See also

- [How it Works](/android-indepth-overview)
- [Queue & Lyrics](/android-indepth-queue-lyrics)
