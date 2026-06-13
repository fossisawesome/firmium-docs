# Android In-depth: Queue & Lyrics

What each control in `ui/components/QueueSheet.kt`, `ui/components/LyricsSheet.kt`, and
`ui/components/SimilarTracksSheet.kt` does.

## Queue (`ui/components/QueueSheet.kt`)

- Each row shows the track's position, title, artist, and duration.
- The currently playing track is highlighted and shows a play icon instead of its position
  number.
- Tapping a row calls `onPlayAt(index)`, jumping playback directly to that track.
- The sheet auto-scrolls to keep the active track visible when opened.

## Lyrics (`ui/components/LyricsSheet.kt`)

Lyrics fetching, caching, and playback-position sync are handled by
`viewmodel/LyricsController.kt`, mirroring the `syncLyricsToPosition` logic
used by the desktop app. It cancels in-flight fetches when the track changes
so a slow response for a previous track can't overwrite the current one.

- Shows a loading spinner while lyrics are being fetched.
- Shows a "No lyrics available" message if none are found.
- For synced lyrics, the currently playing line is highlighted and the view auto-scrolls to
  follow playback.
- For unsynced lyrics, the full text is shown without line-by-line highlighting.

## Similar Tracks (`ui/components/SimilarTracksSheet.kt`)

Only available when the server advertises the `sonicSimilarity` OpenSubsonic extension
(`ApiClient.hasExtension("sonicSimilarity")`).

- `PlayerViewModel.fetchSimilarTracks()` calls `ApiClient.getSonicSimilarTracks(songId)`
  for the current track and exposes the result via `similarTracksState`
  (`SimilarTracksState`: `isLoading`, `matches`, `error`).
- Each row shows the matched track's title, artist, and similarity percentage
  (`ApiClient.SimilarMatch.similarity`, 0.0-1.0).
- Tapping a row calls `onPlayAt(songs, index)`, which plays the full similar-tracks list
  starting at that track via `PlayerViewModel.playAt()`.
- Shows a loading spinner while fetching, and "No similar tracks found" on error or empty
  results.

## See also

- [How it Works](/android-indepth-overview)
- [Player Bar & Full Screen Player](/android-indepth-player)
