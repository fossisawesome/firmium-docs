# Android Internals

This page documents the Android app's state management, theming, navigation, and
persistence layers - for the audio engine and API client, see
[Android Architecture](/android-architecture).

## ViewModels (`viewmodel/*.kt`)

Each ViewModel is an `AndroidViewModel` exposing one or more `StateFlow`s of immutable UI
state data classes, collected in `AppNavGraph.kt` via `collectAsStateWithLifecycle()` and
passed down to screen composables as plain parameters + callbacks (no ViewModel
references inside screens).

- **`LibraryViewModel`**: owns `homeState`, `albumListState`, `artistListState`,
  `albumDetailState`, `artistDetailState` - each a `MutableStateFlow` of a small state
  data class (`isLoading`, `error`, and the loaded data). `loadHome()`/`loadAlbums()`/etc.
  are idempotent: they return early if data is already loaded or a load is in flight, so
  screens can call `onLoad` on every recomposition without refetching. `loadHome()` fetches
  recent and random albums concurrently with `async {}`/`await()`, then derives
  `recentArtists` by walking `recent` albums and de-duplicating by `artistId`.
- **`PlaylistViewModel`**: thin wrapper around `PlaylistRepository` (see below). `state`
  is derived from `repo.playlists` via `.stateIn(viewModelScope,
  SharingStarted.WhileSubscribed(5000), ...)` - the repository's `Flow<List<Playlist>>` is
  the source of truth, the ViewModel doesn't hold its own copy. `createAndAdd()` creates a
  playlist then immediately adds tracks to it in one suspend call.
- **`PlayerViewModel`**: backs the player bar/full-screen player/queue - `state`
  (`StateFlow` of playback state: current track, queue, position, repeat/shuffle, etc.)
  and `lyricsState`. Wraps `AudioPlayer`/`NowPlayingController` (see
  [Android Architecture](/android-architecture)).
- **`AuthViewModel`**: login/logout, wraps `AuthManager` + `SecureStorage`.
- **`SearchViewModel`**: debounced search-as-you-type state for `SearchScreen`.

State flows from the database/network up: ViewModel methods are called either on
`LaunchedEffect`/`onLoad` (initial fetch) or from UI callbacks (`onAlbumClick`, etc.),
mutate a `MutableStateFlow`, and the screen recomposes automatically via
`collectAsStateWithLifecycle()`. There's no separate "repository" layer for library data -
`LibraryViewModel` calls `ApiClient` directly.

## Theme system (`ui/theme/`)

The Android app does **not** use Compose `MaterialTheme` for color tokens - all theming
goes through a custom `FirmiumTheme`/`FirmiumColors` CompositionLocal defined in
`Theme.kt` and `FirmiumColors.kt`.

- `ALL_THEMES` in `Theme.kt` is a hardcoded `List<FirmiumTheme>`, one entry per theme,
  each a `FirmiumTheme(id, name, isDark, bg, surface, surface2, text, muted, accent,
  error)` with `Color` values built via `hex()`. These are manually ported from the
  desktop `themes/*.toml` files (see [Customizing Themes](/custom-themes)) - **adding a
  theme here requires manually copying the color values from the corresponding `.toml`**,
  there's no shared source of truth between desktop and Android.
- `themeById(id)` looks up a theme, falling back to `ALL_THEMES.first()`.
- `FirmiumTheme(themeId) { content }` (the composable) provides `LocalFirmiumColors` and
  `LocalFirmiumIsDark` via `CompositionLocalProvider`. Components read colors with
  `LocalFirmiumColors.current.bg`, `.accent`, etc.
- The selected theme id is persisted via `AppPreferences.THEME_ID`
  (`data/storage/AppPreferences.kt`) and passed into `FirmiumTheme` from
  `MainActivity`/`AppNavGraph`'s `currentThemeId` parameter; `onThemeSelected` writes it
  back.
- Separately, `AppPreferences.UI_THEME_ID` (`"firmium"` vs `"material3"`) controls a
  higher-level UI style switch (icon-only monospace nav vs standard Material 3
  components) - independent of the color theme above.

## Navigation (`ui/navigation/AppNavGraph.kt`)

Single `NavHost` with `rememberNavController()`, defined entirely in `AppNavGraph.kt`.
Routes:

| Route | Screen | Notes |
| --- | --- | --- |
| `home` | `HomeScreen` | start destination |
| `music` | `AlbumListScreen` | |
| `album/{albumId}` | `AlbumDetailScreen` | slide-in transition from the right |
| `artists` | `ArtistListScreen` | |
| `artist/{artistId}` | `ArtistDetailScreen` | slide-in transition |
| `playlists` | `PlaylistsScreen` | |
| `playlist/{playlistId}` | `PlaylistDetailScreen` | slide-in transition; looks up the playlist from `playlistsState.playlists` by id, renders nothing if not found |
| `search` | `SearchScreen` | reached via the search icon, not a bottom-nav tab |
| `settings` | `SettingsScreen` | reached via the settings icon |

- `bottomDests` (home/music/artists/playlists) drive both the bottom nav bar
  (`FirmiumBottomBar`) and the side nav rail (`FirmiumNavRail`, shown when
  `configuration.screenWidthDp >= 600`).
- `routeSection(route)` maps detail routes back to their tab root (e.g. `album/123` ->
  `music`) so the correct nav item highlights.
- `onNavigate(destRoute)`: if already on that route, no-op; if navigating to the current
  section's root, tries `popBackStack(destRoute, inclusive = false)` first (falls back to
  `navigate` with `popUpTo("home") { saveState = true }` if the route isn't in the back
  stack); otherwise navigates normally with `launchSingleTop = true` and
  `restoreState = true`.
- Detail routes (`album/*`, `artist/*`, `playlist/*`) use custom slide
  transitions (`slideInHorizontally`/`slideOutHorizontally` with `FastOutSlowInEasing`);
  the top-level tabs use plain `fadeIn`/`fadeOut`.
- The player bar, full-screen player, queue sheet, lyrics sheet, and add-to-playlist
  dialog are all rendered as overlays *outside* the `NavHost` in `AppNavGraph`, driven by
  local `remember { mutableStateOf(...) }` flags (`showFullPlayer`, `showQueue`,
  `showLyrics`, `pendingAddAlbumId`) rather than being nav destinations.

## Storage & persistence (`data/storage/`)

- **`AppPreferences`**: wraps a Jetpack `DataStore<Preferences>` (file `firmium_prefs`).
  All non-sensitive settings live here as typed keys (`stringPreferencesKey`,
  `booleanPreferencesKey`, etc.) - server URL, username, volume, crossfade/gapless
  settings, repeat/shuffle mode, theme ids, LRCLIB/Last.fm toggles, auto-login, and the
  serialized playlists JSON (`PLAYLISTS_JSON`). Each key has a `Flow` getter (with a
  default) and a `suspend fun set...()`. `clear()` wipes everything (used by Settings >
  Reset).
- **`SecureStorage`**: Android Keystore-backed key/value store for credentials (server
  password, Last.fm API key/secret) - the Android equivalent of the desktop's OS keyring
  (`commands/credentials.rs`).
- **`PlaylistRepository`**: persists playlists as a single JSON array (via Gson) in
  `AppPreferences.PLAYLISTS_JSON` - mirrors the desktop's `localStorage`-backed playlists
  store (`src/lib/stores.ts`). Exposes `playlists: Flow<List<Playlist>>` derived from
  `prefs.playlistsJson`. All mutations (`create`, `delete`, `rename`, `addTracks`,
  `removeTrack`) go through a `mutate { ... }` helper that loads the full list, applies
  the change, and re-saves it as JSON - there's no per-playlist storage, the whole list is
  read/written atomically on every change. `addTracks` de-duplicates by song id.

## See also

- [Android Architecture](/android-architecture)
- [Settings & Themes Internals](/settings-themes-internals) (desktop equivalent)
