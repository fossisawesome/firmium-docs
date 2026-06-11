# Android In-depth: Playlists

What each control in `ui/components/AddToPlaylistDialog.kt` does.

## Playlists (`ui/components/AddToPlaylistDialog.kt`)

- **New playlist** — a name field plus **Cancel** and **Create & Add** buttons. **Create &
  Add** is disabled until a name is entered; tapping it creates the playlist and adds the
  current track(s) to it.
- **Existing playlists** — a list of the user's playlists; tapping one adds the current
  track(s) to it and dismisses the dialog.

## See also

- [How it Works](/android-indepth-overview)
- [Player Bar & Full Screen Player](/android-indepth-player)
