# Desktop In-depth: Playlists

What each control in the playlist views and `PlaylistMenu.svelte` does.

## Playlists (`PlaylistsView`, `PlaylistDetail`, `PlaylistMenu.svelte`)

- **+ New** — opens a dialog to create a playlist. **Cancel** closes it without changes;
  **Create** creates the playlist and adds it to the list.
- **Playlist cards** — show the playlist's cover and name. A small cloud icon badge marks
  playlists that are synced with the server.
- **Play All** — queues every track in the playlist and starts playback.
- **Delete** — removes the playlist (after confirmation).
- **Editing cover/name/description** — available unless the playlist `isServerOnly` (i.e.
  it only exists on the server and isn't locally editable in this way).
- **Per-track actions** — each track row has **Add to playlist** (opens `PlaylistMenu.svelte`)
  and **Remove** (removes the track from the current playlist).
- **`PlaylistMenu.svelte`** — a popup listing all playlists; selecting one calls
  `playlists.addTracks()` to add the chosen track(s) locally, then `Api.updatePlaylist()` to
  sync the change to the server.

## See also

- [Library Views](/desktop-indepth-library-views)
- [Settings](/desktop-indepth-settings)
