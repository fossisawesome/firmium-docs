# Android In-depth: Library & Navigation

How the library screens, their ViewModels, and navigation fit together. For the
ViewModel state pattern and the full route table, see [Android Internals](/android-internals).

## Screens and their ViewModels (`ui/screens/`)

- **`HomeScreen`** - renders `LibraryViewModel.homeState` (recent albums, derived
  `recentArtists`, random albums). `onRefresh` calls `loadHome()`, which is a no-op if
  `recentAlbums` is already populated or a load is in flight.
- **`AlbumListScreen`** / **`ArtistListScreen`** - render `albumListState` /
  `artistListState`. `onLoad` calls `loadAlbums()` / `loadArtists()`, each guarded the
  same way (skip if already loaded or loading). `AlbumListScreen` also receives
  `playlists` from `PlaylistViewModel` to support "add album to playlist" inline.
- **`AlbumDetailScreen`** / **`ArtistDetailScreen`** - render `albumDetailState` /
  `artistDetailState`. `onLoad` calls `loadAlbumDetail(id)` / `loadArtistDetail(id)`,
  which short-circuit if the currently-loaded detail already matches `id`. `onPlayAll`
  calls `playerViewModel.playAt(songs, idx)` directly. `AlbumDetailScreen` shows a left-aligned
  header (cover, title, artist link, song count, Play/Shuffle) and marks downloaded tracks from
  `albumDetailState.downloadedSongIds` (and the whole album when `allDownloaded`).
  `ArtistDetailScreen` shows an image header with Shuffle/Radio, a "Songs" preview from
  `artistDetailState.topSongs` (loaded via `ApiClient.getTopSongs`), and `AlbumCard` carousels
  for Albums and Singles & EPs grouped by `effectiveType()`.
- **`SearchScreen`** - driven by `SearchViewModel.state`; `onQueryChange` calls
  `searchViewModel.onQueryChanged(query)`.

## Navigation wiring (`ui/navigation/AppNavGraph.kt`)

- `AppNavGraph` collects all five `LibraryViewModel` state flows up front (`homeState`,
  `albumListState`, `artistListState`, `albumDetailState`, `artistDetailState`) and passes
  the relevant one into each `composable { }` block as `state`.
- List screens navigate to detail routes by id: `onAlbumClick = { navController.navigate("album/$it") }`,
  same for `artist/$it`. Detail screens get the id back via
  `back.arguments?.getString("albumId")` / `"artistId"`.
- The bottom nav / side rail (`bottomDests`: home, music, artists, playlists) and
  `routeSection()` (which maps `album/*` -> `music`, `artist/*` -> `artists`, etc.) decide
  which nav item is highlighted for detail routes - see [Android Internals](/android-internals)
  for the full route table and `onNavigate` back-stack logic.
- `coverUrlFor` is a shared `(String?) -> String?` closure (`auth.coverArtUrl(id, 300)`)
  passed to every screen that renders cover art.
- `FirmiumPageHeader` (top app bar on phones) and `FirmiumNavRail` (tablets) include an
  account icon alongside search/settings, opening `AccountDialog` - the Android
  equivalent of the desktop sidebar's account icon (see
  [Desktop In-depth: Sidebar & Navigation](/desktop-indepth-sidebar-nav)).

## Track ratings

`PlayerViewModel.setRating()` calls `ApiClient.setRating()` (fire-and-forget) and updates the current track's `userRating` in `PlaybackController`. `FullScreenPlayer.kt` renders a `StarRating` composable (5 `Icons.Default.Star`/`StarBorder` icons) in an animated popup over the cover art, shown only on long-press of the art.

## Filter chips

`AlbumListScreen.kt` extracts unique genres and decades from `state.albums` and renders `FlowRow` filter chips. Filtering is client-side using `remember` derivations. Genre/decade selections use AND across categories, OR within a category. `AlbumDetailScreen.kt` shows BPM range chips when tracks have BPM data.

## Multi-server

`AuthManager` manages a server list persisted as JSON in `AppPreferences.serverListJson`. `savedServers()` returns the list, `addToServerList()` upserts, `removeFromServerList()` deletes (including SecureStorage credential). `switchToSaved()` loads the password from SecureStorage (keyed by `firmium::$url`), calls `setCredentials()`, and updates active server prefs. `AuthViewModel` exposes `switchToServer()` and `removeServer()` to the UI. `AccountDialog` renders a `SavedServersList` composable above the login form when saved servers exist.

## Local library

When `AuthManager.isAuthenticated` is false, the same screens render the **local
library** instead: music files under `Music/Firmium` on device storage, scanned by
`LocalLibraryRepository` (`data/local/`) via a MediaStore query (with a direct file-listing
fallback on API <29) and mapped into the same `Album`/`Artist`/`Song` model classes used
by `ApiClient`. `AppNavGraph.kt` picks between `ApiClient` and `LocalLibraryRepository`
based on auth state, and `coverUrlFor` branches on a `"local:"` id prefix to load
embedded cover art (via `MediaMetadataRetriever`) instead of a server cover URL. See
[Desktop In-depth: Library Views](/desktop-indepth-library-views) for the desktop
equivalent (`local_library.rs` + `LocalApi`).

## Cross-platform note

These screens' data-loading pattern (idempotent `load*()` + `StateFlow` state) has no
direct desktop equivalent - the desktop app fetches via `$dataSource` calls directly inside
Svelte components/views. See [Desktop In-depth: Library Views](/desktop-indepth-library-views)
for the desktop side.

## See also

- [How it Works](/android-indepth-overview)
- [Android Internals](/android-internals)
- [Playlists](/android-indepth-playlists)
