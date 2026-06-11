# Desktop In-depth: Library Views

What each control in the library views (`src/views/*.svelte`) does.

## Library views (`src/views/*.svelte`)

- **Album/Artist grids** (`AlbumList.svelte`, `ArtistList.svelte`) — fetch and display albums
  or artists as a grid of covers. Clicking an item navigates to its detail view.
- **Album/Artist detail** (`AlbumDetail.svelte`, `ArtistDetail.svelte`) — show the track list
  or discography for the selected item. `ArtistDetail` includes a **Play All** button that
  queues all of the artist's tracks and starts playback.
- **Search** (`SearchView.svelte`) — typing and pressing **Search** (or Enter) calls
  `Api.search3()` and shows matching albums, artists, and tracks.
- **Add to playlist** — available throughout these views on individual tracks/albums; opens
  `PlaylistMenu.svelte` (see [Playlists](/desktop-indepth-playlists)) to choose a destination
  playlist.

## See also

- [How it Works](/desktop-indepth-overview)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Playlists](/desktop-indepth-playlists)
