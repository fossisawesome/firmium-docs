# Android In-depth: Player Bar & Full Screen Player

What each control in `ui/components/PlayerBar.kt` and `ui/components/FullScreenPlayer.kt`
does.

## Player Bar (`ui/components/PlayerBar.kt`)

- **Cover art / track info** — shows the current track's cover, title, and artist from
  `PlayerState`, plus a format line (e.g. `FLAC · 44.1 kHz · 16-bit · 1004 kbps`) when the
  server provides this metadata.
- **Play/Pause** — toggles playback.
- **Next** — advances to the next track; disabled (greyed out) when `state.hasNext` is false.
- **Tapping the bar** — opens the Full Screen Player.

## Full Screen Player (`ui/components/FullScreenPlayer.kt`)

- **Album art** — displayed with a background gradient extracted from the art via Android's
  Palette API, darkened to ~22% opacity. The art shrinks slightly when playback is paused.
- **Track format** — shows the same format line as the player bar below the artist name,
  when available.
- **Tap album art** — opens the Lyrics sheet.
- **Swipe left/right** — swiping the art left skips to the next track, swiping right goes to
  the previous track.
- **Drag handle** — drag down to dismiss the full screen player back to the player bar.
- **Seek bar** — shows and controls playback position.
- **Previous / Play-Pause / Next** — standard transport controls.
- **Shuffle** — toggles shuffle mode for the queue.
- **Repeat** — cycles Off → Repeat All → Repeat One, showing a "1" badge in Repeat One mode.
- **Add to playlist** — opens `AddToPlaylistDialog.kt` (see [Playlists](/android-indepth-playlists)).
- **Queue** — opens the Queue sheet (see [Queue & Lyrics](/android-indepth-queue-lyrics)).
- **Similar Tracks** — only shown when the server advertises the `sonicSimilarity`
  OpenSubsonic extension; opens `SimilarTracksSheet.kt` with audio-similar tracks for the
  current song (see [Queue & Lyrics](/android-indepth-queue-lyrics)).
- **Volume slider** — adjusts playback volume.

In landscape orientation, the layout switches to place the album art beside the controls
rather than stacking them.

## See also

- [How it Works](/android-indepth-overview)
- [Queue & Lyrics](/android-indepth-queue-lyrics)
