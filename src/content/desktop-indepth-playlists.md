# Desktop In-depth: Playlists

How the local-first playlist system works in the desktop app. The
model mirrors Android's `PlaylistRepository`: playlists are created locally, persisted to
disk, and best-effort synced to the OpenSubsonic server.

## Data model and persistence (`backend/core/playlists.rs`)

- `Playlist` holds `id` (local UUID), `name`, `tracks: Vec<Song>`, `created_at`, an optional `server_id`, and the sync-retry fields `create_pending` / `create_attempts`.
- `load()` / `save()` read and write the whole list as a JSON array at `<config dir>/playlists.json` (separate from `config.toml`). A missing or corrupt file loads as an empty list.
- Pure mutators on `&mut [Playlist]` return what the server push needs: `add_tracks()` (dedupes by song id, including duplicates within one batch, returns the ids actually added), `move_track()` (returns the new ordered id list), `remove_track()` (returns the removed index). They have unit tests.

## Core operations (`impl Core` in the same file)

Each operation mutates `Core.playlists` (a `Mutex<Vec<Playlist>>`), saves, then pushes to the server and returns the updated local list, so the UI never edits playlists itself: `create_playlist`, `rename_local_playlist`, `delete_local_playlist`, `add_to_local_playlist`, `move_local_track`, `remove_local_track`, `sync_playlist_now`, `reconcile_playlists`. Server-only playlists have `add_to_server_playlist`, `reorder_server_playlist`, `remove_from_server_playlist`.

## Server sync (`backend/commands/playlists.rs`)

Async primitives taking an owned `Arc<AppState>`, wrapping `commands/subsonic.rs` (`create_playlist`, `update_playlist`, `delete_playlist`):

- `sync_create()` creates the playlist on the server and adds its tracks; the returned object's `"id"` becomes the local `server_id`.
- `push_rename`, `push_delete`, `push_add`, `push_remove`, `push_reorder` are best-effort (errors are logged, never surfaced). `push_reorder` removes every original index and re-adds song ids in the new order, since OpenSubsonic `updatePlaylist` has no native move.

## Retry and adopt-by-name

`Core::reconcile_playlists(server)` runs when the Playlists view opens (`Api.syncServerPlaylists()`). Each unsynced local playlist still under `CREATE_ATTEMPT_CAP` (3) either adopts a same-named server playlist's id (avoiding a duplicate) or is retried via `sync_create`. It returns `PlaylistLists { local, serverOnly }`; `serverOnly` is every server playlist no local entry claims.

## Views

- **Playlists list** (`views/PlaylistsView.svelte`): local playlists first, then server-only ones; a cloud badge marks synced rows; unsynced local rows show **Sync** (`Api.syncPlaylistNow`). State sits in `lib/playlists.ts` (`localPlaylists`, `serverOnlyPlaylists`).
- **Detail** (`views/PlaylistDetail.svelte`): local playlists read from the `localPlaylists` store; server-only ones (`server-<id>` navigation id) fetch via `Api.serverPlaylistTracks`. Reorder, remove and inline rename call the matching command and replace the store with the returned list.
- **Cover mosaic** (`components/PlaylistMosaic.svelte`): up to four distinct track covers.
- **Add-to-playlist popup** (`components/PlaylistMenu.svelte`): lists local and server-only playlists; **Create New** calls `Api.createPlaylist(name, firstTrack)`.

Custom cover images and descriptions are not supported.

## See also

- [Library Views](/desktop-indepth-library-views)
- [Settings](/desktop-indepth-settings)
