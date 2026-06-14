# Desktop In-depth: Library Views

What each control in the library views (`src/views/*.svelte`) does.

## Library views (`src/views/*.svelte`)

- **Album/Artist grids** (`AlbumList.svelte`, `ArtistList.svelte`) — fetch and display albums
  or artists as a grid of covers. Clicking an item navigates to its detail view.
- **Album/Artist detail** (`AlbumDetail.svelte`, `ArtistDetail.svelte`) — show the track list
  or discography for the selected item. `ArtistDetail` includes a **Play All** button that
  queues all of the artist's tracks and starts playback.
- **Search** (`SearchView.svelte`) — typing and pressing **Search** (or Enter) calls
  `$dataSource.search()` and shows matching albums, artists, and tracks.
- **Add to playlist** — available throughout these views on individual tracks/albums; opens
  `PlaylistMenu.svelte` (see [Playlists](/desktop-indepth-playlists)) to choose a destination
  playlist.
- **Download** — `AlbumRow.svelte` and `TrackRow.svelte` show a download button next to the
  add-to-playlist button when connected to a server. Clicking it calls
  `Api.downloadTrack()`/`Api.downloadAlbum()` with the format from the `downloadFormat`
  store, saving into `~/Music/Firmium`.
- **Downloaded indicator** — `AlbumDetail.svelte` calls
  `Api.getLocalAlbumTrackKeys()` (Tauri command `get_local_album_track_keys` in
  `commands/local_library.rs`) on load, matching local files by `(trackNumber, title)`
  against the server track list. Matching `TrackRow`s receive a `downloaded` prop and
  render as already-downloaded, including after restarting the app — there is no
  separate persisted "downloaded" flag, the filesystem is the source of truth.

## Local library

When not connected to a server, these same views render your local library instead:
`src/lib/dataSource.ts` swaps `Api` for `LocalApi`, which calls the `local_library.rs`
Tauri commands to scan `~/Music/Firmium`. The UI doesn't change - covers, track lists,
and search all work the same way, just without download buttons, playlists, or artist
bios (server-only features). See [Desktop Architecture](/architecture-overview) for how
the data source switch works.

## See also

- [How it Works](/desktop-indepth-overview)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Playlists](/desktop-indepth-playlists)
