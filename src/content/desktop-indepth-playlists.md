# Desktop In-depth: Playlists

What each control in the playlist views and `PlaylistMenu.svelte` does.

## Playlists (`PlaylistsView`, `PlaylistDetail`, `PlaylistMenu.svelte`)

- **+ New** — opens a dialog to create a playlist. **Cancel** closes it without changes;
  **Create** creates the playlist and adds it to the list.
- **Playlist cards** — `PlaylistsView` renders a single unified list (`mergePlaylists()` in
  `stores.ts`), merging local playlists with the server's `getPlaylists()` result. A small
  cloud icon badge marks playlists that are synced with the server (local playlist with a
  matching `serverId`) or exist only on the server (`source: 'server-only'`).
- **Sync button** — local-only playlist cards (`source: 'local'`) show a **Sync** button
  that calls `Api.createPlaylist()`, links the result via `playlists.setServerId()`, and
  (if the local playlist has tracks) immediately calls `Api.updatePlaylist()` with
  `songIdsToAdd` so the server copy isn't created empty.
- **Play All** — queues every track in the playlist and starts playback.
- **Shuffle** — calls `shufflePlay()` (`src/lib/playback.ts`), which shuffles a copy of the
  playlist's tracks, sets the `shuffleEnabled` store, and starts playback from the first
  shuffled track via `setQueueSeamless()`. With `shuffleEnabled` on, the player bar's
  **Next** button continues picking random queue items (see [Player
  Bar](/desktop-indepth-player-bar)). The same `shufflePlay()` helper backs the Shuffle
  buttons on album and artist detail views.
- **Delete** — removes the playlist (after confirmation).
- **Editing cover/name/description** — available unless the playlist `isServerOnly` (i.e.
  it only exists on the server and isn't locally editable in this way).
- **Per-track actions** — each track row has **Add to playlist** (opens `PlaylistMenu.svelte`),
  **Move up/down** (reorder), and **Remove** (removes the track from the current playlist).
  Move and Remove work for both local and server-only playlists.
- **Reordering** — `PlaylistDetail.svelte::moveTrack()` reorders the local `tracks` array via
  `playlists.moveTrack()` (or `serverTracks` directly for server-only playlists). If the
  playlist has a `serverId`, the new order is pushed with a single `Api.updatePlaylist()`
  call passing `songIndicesToRemove` for every original index plus `songIdsToAdd` with the
  song IDs in the new order — OpenSubsonic's `updatePlaylist` has no native "move", so
  removing everything and re-adding in the desired order is the standard workaround.
- **`PlaylistMenu.svelte`** — a popup listing all playlists; selecting one calls
  `playlists.addTracks()` to add the chosen track(s) locally, then `Api.updatePlaylist()` to
  sync the change to the server.
- **Track add/remove sync** — for playlists with a `serverId`, adding or removing tracks
  immediately calls `Api.updatePlaylist()` with `songIdsToAdd`/`songIndicesToRemove`, fire
  and forget (errors are logged, not surfaced).
- **Retry on mount** — when `PlaylistsView` mounts, any local playlist whose initial
  `createPlaylist` call never succeeded (`createPending: true`, tracked via
  `createAttempts`) is retried, up to 3 attempts. If a server playlist with the same name
  already exists, its id is adopted instead of creating a duplicate.

## See also

- [Library Views](/desktop-indepth-library-views)
- [Settings](/desktop-indepth-settings)
