# Desktop In-depth: Library Views

What each control in the library views (`src/views/*.svelte`) does.

## Library views (`src/views/*.svelte`)

- **Album/Artist grids** (`AlbumList.svelte`, `ArtistList.svelte`) — fetch and display albums
  or artists as a grid of covers. Clicking an item navigates to its detail view.
- **Album/Artist detail** (`AlbumDetail.svelte`, `ArtistDetail.svelte`) — show the track list
  or discography for the selected item. Both include **Play All** and **Shuffle** buttons:
  Play All queues the album's (or, for `ArtistDetail`, the artist's whole discography's)
  tracks via `setQueueSeamless()`; Shuffle calls `shufflePlay()` (`src/lib/playback.ts`) to
  shuffle the same track list, enable the `shuffleEnabled` store, and start playback from
  the first shuffled track (see [Player Bar](/desktop-indepth-player-bar) and
  [Playlists](/desktop-indepth-playlists) for the shared `shufflePlay()` helper).
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

## Track ratings

`TrackRow.svelte` has an `onRate` callback prop. When authenticated, parent views (`AlbumDetail.svelte`, `PlaylistDetail.svelte`) pass a handler that calls `Api.setRating()` (fire-and-forget via `set_rating` Tauri command in `commands/subsonic.rs`) and updates the track's `userRating` in local state. The rating widget renders 5 inline SVG stars (`IconStarFilled`/`IconStarEmpty` from `icons.ts`), hidden by default and visible on row hover or when the track has a nonzero rating (CSS in `style.css`, `.track-stars`).

## Filter chips

`AlbumList.svelte` extracts unique genres and decades from the album list (using `extractGenres()` and `albumDecade()` from `utils.ts`) and renders them as filter chips above the `VirtualList`. Filtering is client-side via `$derived` reactivity. Genre and decade selections use AND across categories, OR within a category.

`AlbumDetail.svelte` and `PlaylistDetail.svelte` show BPM range chips (`<80`, `80-120`, `120+`) when any track in the list has BPM data. These filter the displayed track list client-side.

## Multi-server

`stores.ts` maintains a `serverList` store (persisted to `firmium_servers` in localStorage) as `SavedServer[]`. `Setup.svelte` renders saved servers above the login form. `switchServer()` in `stores.ts` clears the queue, clears the list cache (`clearAll()` from `listCache.ts`), calls `setAuth()`, and bumps `dataSourceVersion` to trigger library reload. Keyring entries are parameterized by server URL via the `service` parameter in `credentials.rs`.

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
