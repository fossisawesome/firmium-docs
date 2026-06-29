# Desktop In-depth: Playlists

How the local-first playlist system works in the native iced/Rust desktop app. The
model mirrors Android's `PlaylistRepository`: playlists are created locally, persisted to
disk, and best-effort synced to the OpenSubsonic server.

## Data model and persistence (`src/playlists.rs`)

- `Playlist` holds `id` (local UUID), `name`, `tracks: Vec<Song>`, `created_at`, an optional
  `server_id`, and the sync-retry fields `create_pending` / `create_attempts`.
- `load_playlists()` / `save_playlists()` read and write the whole list as a JSON array at
  `~/.config/<id>/playlists.json` (separate from `config.toml`). A missing or corrupt file
  loads as an empty list.
- Pure mutators operate on the in-memory `Vec<Playlist>` and return what the server push
  needs: `add_tracks()` (dedupes by song id, returns the ids actually added),
  `move_track()` (returns the new ordered id list), `remove_track()` (returns the removed
  index).

## Server sync (`backend/commands/playlists.rs`)

Async primitives invoked via `iced::Task::perform`, each taking an owned `Arc<AppState>`.
They wrap the existing `commands/subsonic.rs` calls (`create_playlist`, `update_playlist`,
`delete_playlist`):

- `sync_create()` creates the playlist on the server and adds its tracks; returns the raw
  server object whose `"id"` becomes the local `server_id`.
- `push_rename`, `push_delete`, `push_add`, `push_remove`, `push_reorder` are fire-and-forget
  (errors are logged, never surfaced). `push_reorder` removes every original index and
  re-adds song ids in the new order, since OpenSubsonic `updatePlaylist` has no native move.

## State and the merged list (`src/app.rs`)

- `App` owns `playlists: Vec<Playlist>` (local), `server_playlists: Vec<serde_json::Value>`
  (from `get_playlists`), and the derived `playlist_items: Vec<PlaylistListItem>`.
- `rebuild_playlist_items()` merges them: local playlists first, then server playlists whose
  id is not already a local playlist's `server_id`. `PlaylistListItem` is `Local(usize)` or
  `ServerOnly(usize)`.
- The in-memory mutation happens synchronously in `App::update` (then `save_playlists`),
  immediately before spawning the matching server push as a `Task`.

## Views

- **Playlists list** (`playlists_view` / `playlist_row`) — header with a **+ New** button
  (`OpenCreatePlaylist`), one row per merged item. A cloud icon marks synced rows. Local rows
  show a **Sync** button (`SyncPlaylistNow`, only while unsynced) and a **Delete** button
  (`DeleteLocalPlaylist`). Server-only rows have no trailing buttons.
- **Create dialog** (`create_playlist_overlay`) — a `stack`-based modal (same pattern as the
  add-to-playlist and account-switcher overlays) emitting `CreatePlaylist`.
- **Detail** (`playlist_detail_view` / `playlist_track_row`) — local playlists build their
  detail from memory (`refresh_local_detail`); server-only playlists (`"server-<id>"`
  navigation id) fetch via `get_playlist_tracks`. Each track row adds **up/down** reorder
  (`MovePlaylistTrack` / `MoveServerTrack`, disabled at the ends) and **remove**
  (`RemovePlaylistTrack` / `RemoveServerTrack`). The title carries an inline rename editor
  for local playlists (`StartRenamePlaylist` → `CommitRenamePlaylist` → `RenamePlaylist`).
- **Cover mosaic** (`playlist_cover`) — up to four distinct track covers in a 2x2 grid for
  local playlists, the single server cover for server-only playlists, and the list icon as a
  fallback when empty.
- **Add-to-playlist overlay** (`add_to_playlist_overlay`) — lists the local playlists; picking
  one calls `add_tracks` locally and pushes to the server when the playlist is synced.

## Retry and adopt-by-name

Opening the Playlists view re-fetches `get_playlists`. In the `PlaylistsLoaded` handler, each
unsynced local playlist still under `CREATE_ATTEMPT_CAP` (3) either adopts a same-named server
playlist's id (avoiding a duplicate) or is retried via `sync_create`.

## See also

- [Library Views](/desktop-indepth-library-views)
- [Settings](/desktop-indepth-settings)
