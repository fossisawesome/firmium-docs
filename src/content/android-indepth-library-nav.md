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
  calls `playerViewModel.playAt(songs, idx)` directly.
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

## Cross-platform note

These screens' data-loading pattern (idempotent `load*()` + `StateFlow` state) has no
direct desktop equivalent - the desktop app fetches via `Api` calls directly inside
Svelte components/views. See [Desktop In-depth: Library Views](/desktop-indepth-library-views)
for the desktop side.

## See also

- [How it Works](/android-indepth-overview)
- [Android Internals](/android-internals)
- [Playlists](/android-indepth-playlists)
