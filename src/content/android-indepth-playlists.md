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

`Playlist` (`data/model/Playlist.kt`) has three fields tracking server sync state:
`serverId: String?` (the server-side playlist id once synced), `createPending: Boolean`
(true until the first successful server create, or until retries are exhausted), and
`createAttempts: Int`. Old DataStore records missing these fields deserialize with their
data-class defaults (`null` / `true` / `0`) via Gson reflection, so existing local
playlists automatically become retry candidates.

`PlaylistRepository` takes an `ApiClient` and pushes every mutation to the server on a
best-effort basis (wrapped in `try/catch`, errors swallowed):

- `create(name)` - prepends a new `Playlist(id = UUID.randomUUID(), name)`, then calls
  `syncCreate(p)`.
- `syncCreate(p)` - calls `api.createPlaylist(p.name)`. On success, sets `serverId` and
  `createPending = false`. On failure, increments `createAttempts`; `createPending`
  stays `true` until `createAttempts >= 3`.
- `delete(id)` - removes the local entry, then `api.deletePlaylist(serverId)` if synced.
- `rename(id, name)` - renames locally, then `api.updatePlaylist(serverId, name = name)`
  if synced.
- `addTracks(id, songs)` - appends songs (de-duped by song id), then
  `api.updatePlaylist(serverId, songIdsToAdd = newSongs.map { it.id })` if synced and any
  new songs were added.
- `removeTrack(id, trackId)` - removes the track, then
  `api.updatePlaylist(serverId, songIndicesToRemove = listOf(removedIndex))` if synced.
- `retryPendingCreates(serverPlaylists)` - for each local playlist with `serverId == null
  && createPending && createAttempts < 3`, either adopts a same-named server playlist's
  id (avoiding a duplicate create) or calls `syncCreate(p)` again.
- `syncNow(id)` - manually triggers `syncCreate(p)` for a single local playlist with
  `serverId == null`, used by the row's "Sync" button to push it to the server on demand.

## API client (`data/api/ApiClient.kt`)

The "Playlists" section of `ApiClient` mirrors `subsonic.rs`'s playlist commands:
`getPlaylists()`, `getPlaylistTracks(id)`, `createPlaylist(name)`,
`updatePlaylist(id, name?, comment?, songIdsToAdd, songIndicesToRemove)`, and
`deletePlaylist(id)`. `updatePlaylist` needs repeated query params (multiple
`songIdToAdd`/`songIndexToRemove`), which `AuthManager.buildUrl`'s `Map<String, String>`
signature can't express - both `AuthManager.buildUrl` and `ApiClient`'s private `fetch`
have a `List<Pair<String, String>>` overload for this, with the existing `Map`-based
signatures delegating via `.toList()`.

## ViewModel (`viewmodel/PlaylistViewModel.kt`)

`state: StateFlow<PlaylistsUiState>` combines `repo.playlists` (local) with an internal
`_serverPlaylists: MutableStateFlow<List<ServerPlaylist>>` via `mergePlaylists()`, producing
`PlaylistsUiState(playlists, serverPlaylists, items)`. `items: List<PlaylistListItem>` is
the unified display list:

- `PlaylistListItem.Local(playlist)` - a local playlist; `isSynced` is true if it has a
  `serverId`.
- `PlaylistListItem.ServerOnly(server)` - a server playlist with no matching local entry
  (id `server-<id>`); always `isSynced = true`.

`refreshServerPlaylists()` fetches `api.getPlaylists()`, stores the result, and calls
`repo.retryPendingCreates(fetched)`. `loadServerPlaylistTracks(serverId)` fetches and
caches a server-only playlist's tracks (`serverTracks: StateFlow<Map<String,
ServerPlaylistTracks>>`) for the detail screen.

All mutation methods (`create`, `delete`, `rename`, `addTracks`, `removeTrack`) just
`viewModelScope.launch { repo.X(...) }` and rely on the `Flow` to push the updated list
back to observers. `createAndAdd(name, songs)` is the one composite operation: it awaits
`repo.create(name)` then calls `repo.addTracks(playlist.id, songs)` with the new
playlist's id.

## UI entry points

- **`PlaylistsScreen`** - renders `state.items`. `LaunchedEffect(Unit) {
  onRefreshServer() }` calls `playlistViewModel.refreshServerPlaylists()` on first
  composition. Each row shows a cloud icon when `item.isSynced`; the delete button is
  only shown for `PlaylistListItem.Local` items, and a sync icon button is shown for
  `PlaylistListItem.Local` items where `!isSynced`, calling `onSync` ->
  `playlistViewModel.syncNow(id)`. `onCreate`/`onDelete` call
  `playlistViewModel.create()`/`delete()` directly (these operate on local ids only).
- **`PlaylistDetailScreen`** - `AppNavGraph` detects `playlist/server-<id>` routes and
  passes `isServerOnly = true` with tracks loaded via
  `playlistViewModel.loadServerPlaylistTracks(serverId)` (cached in
  `playlistViewModel.serverTracks`). For local ids, it looks up the playlist in
  `playlistsState.playlists` and passes its tracks directly; `onRemoveTrack` calls
  `removeTrack(playlistId, trackId)`.
- **`AddToPlaylistDialog`** (`ui/components/`) - the "add to playlist" UI shown from
  album/artist/search screens, the full-screen player, and the queue. Takes the current
  `playlists` list plus `onAddTo(playlistId)` / `onCreateAndAdd(name)` callbacks, which
  `AppNavGraph` wires to `playlistViewModel.addTracks(...)` /
  `playlistViewModel.createAndAdd(...)`. For album-level "add to playlist", `AppNavGraph`
  lazily fetches the album's tracks via `api.getAlbumDetail(albumId).tracks` before
  showing the dialog (`pendingAddAlbumId`/`pendingAddAlbumTracks`). Only local playlists
  are valid "add to" targets - server-only entries aren't shown here.

## Cross-platform note

Both platforms now sync playlist create/rename/delete/track-add/track-remove to the
server and show a unified local+server list (see [Desktop In-depth:
Playlists](/desktop-indepth-playlists) for the equivalent `mergePlaylists()`/
`markCreateAttempt()` on desktop). Neither platform polls for changes made on other
devices in real time - the server playlist list and server-only track lists are only
refreshed when the relevant view is mounted, consistent with the "Known Cross-Platform
Divergences" precedent (e.g. play queue) in the root `CLAUDE.md`.

## See also

- [How it Works](/android-indepth-overview)
- [Android Internals](/android-internals)
- [Player Bar & Full Screen Player](/android-indepth-player)
