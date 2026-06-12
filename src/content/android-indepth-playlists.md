# Android In-depth: Playlists

How playlist state is persisted, exposed to the UI, and modified - for the desktop
equivalent, see [Desktop In-depth: Playlists](/desktop-indepth-playlists).

## Storage (`data/storage/PlaylistRepository.kt`)

Playlists are stored as a single JSON array (serialized with Gson) in
`AppPreferences.PLAYLISTS_JSON` - there is no per-playlist record, the whole list is
read and rewritten on every mutation via a `mutate { ... }` helper that loads the list,
applies a lambda, and re-saves. `playlists: Flow<List<Playlist>>` is derived from
`prefs.playlistsJson` and is the single source of truth. This mirrors the desktop's
`localStorage`-backed playlists store in `src/lib/stores.ts`, but desktop stores each
playlist as a separate entry rather than one JSON blob.

- `create(name)` - prepends a new `Playlist(id = UUID.randomUUID(), name)`.
- `delete(id)` / `rename(id, name)`.
- `addTracks(id, songs)` - appends songs, filtering out any whose `id` is already in
  `existing.tracks` (de-dupe by song id).
- `removeTrack(id, trackId)` - filters the track out of `existing.tracks`.

## ViewModel (`viewmodel/PlaylistViewModel.kt`)

`PlaylistViewModel` doesn't hold its own state - `state: StateFlow<PlaylistsUiState>` is
`repo.playlists.map { PlaylistsUiState(it) }.stateIn(viewModelScope,
SharingStarted.WhileSubscribed(5000), PlaylistsUiState())`. All mutation methods
(`create`, `delete`, `rename`, `addTracks`, `removeTrack`) just `viewModelScope.launch {
repo.X(...) }` and rely on the `Flow` to push the updated list back to observers.
`createAndAdd(name, songs)` is the one composite operation: it awaits `repo.create(name)`
then calls `repo.addTracks(playlist.id, songs)` with the new playlist's id.

## UI entry points

- **`PlaylistsScreen`** - renders `state.playlists`; `onCreate`/`onDelete` call
  `playlistViewModel.create()`/`delete()` directly.
- **`PlaylistDetailScreen`** - looked up by id from `playlistsState.playlists` in
  `AppNavGraph` (not loaded separately); `onRemoveTrack` calls `removeTrack(playlistId,
  trackId)`.
- **`AddToPlaylistDialog`** (`ui/components/`) - the "add to playlist" UI shown from
  album/artist/search screens, the full-screen player, and the queue. Takes the current
  `playlists` list plus `onAddTo(playlistId)` / `onCreateAndAdd(name)` callbacks, which
  `AppNavGraph` wires to `playlistViewModel.addTracks(...)` /
  `playlistViewModel.createAndAdd(...)`. For album-level "add to playlist", `AppNavGraph`
  lazily fetches the album's tracks via `api.getAlbumDetail(albumId).tracks` before
  showing the dialog (`pendingAddAlbumId`/`pendingAddAlbumTracks`).

## Cross-platform note

Android persists playlists as local-only JSON via DataStore; the desktop app can sync
playlists with the server (`Api.updatePlaylist()`, see
[Desktop In-depth: Playlists](/desktop-indepth-playlists)). `PlaylistRepository` has no
server-sync call - if adding one, check with the user first per "Known Cross-Platform
Divergences" in the root `CLAUDE.md`.

## See also

- [How it Works](/android-indepth-overview)
- [Android Internals](/android-internals)
- [Player Bar & Full Screen Player](/android-indepth-player)
