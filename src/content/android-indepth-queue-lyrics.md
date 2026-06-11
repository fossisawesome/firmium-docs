# Android In-depth: Queue & Lyrics

What each control in `ui/components/QueueSheet.kt` and `ui/components/LyricsSheet.kt` does.

## Queue (`ui/components/QueueSheet.kt`)

- Each row shows the track's position, title, artist, and duration.
- The currently playing track is highlighted and shows a play icon instead of its position
  number.
- Tapping a row calls `onPlayAt(index)`, jumping playback directly to that track.
- The sheet auto-scrolls to keep the active track visible when opened.

## Lyrics (`ui/components/LyricsSheet.kt`)

- Shows a loading spinner while lyrics are being fetched.
- Shows a "No lyrics available" message if none are found.
- For synced lyrics, the currently playing line is highlighted and the view auto-scrolls to
  follow playback.
- For unsynced lyrics, the full text is shown without line-by-line highlighting.

## See also

- [How it Works](/android-indepth-overview)
- [Player Bar & Full Screen Player](/android-indepth-player)
