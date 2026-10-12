# Desktop In-depth: Library Views

The library screens in `src/views/` and the backend calls behind them. Long lists use `src/lib/VirtualList.svelte`, which only renders the rows in the scroll viewport.

## Views

- **Albums** (`AlbumList.svelte`): `Api.albums()`, release-type filtered to full albums, with genre and decade filter chips derived from the loaded list.
- **Album detail** (`AlbumDetail.svelte`): `Api.albumTracks(id)`; Play All / Shuffle go through `setQueueSeamless` / `shuffleAndPlay`; heart toggles `Api.setStarred(id, 'album', ...)`; Download calls `Api.downloadAlbum`. Tracks already in the offline library are marked via `Api.localAlbumTrackKeys`. A BPM chip row appears when tracks carry BPM.
- **Artists** (`ArtistList.svelte`): `Api.artists()`; photos load lazily through the `use:artistPhoto` action, backed by `Core::artist_image` (session cache).
- **Artist detail** (`ArtistDetail.svelte`): `Api.artistDetails`, bio and photo from `Api.artistInfo` (uses the stored Last.fm key when set), Play All Songs / Shuffle via `Core::play_artist` (walks every album), and "You might also like" from `Core::artist_recommendations` (server similar artists, Last.fm fallback, limited to artists in your library).
- **Search** (`SearchView.svelte`): `Api.search(query)`; the min-rating chips filter by the higher of your rating and the server average.
- **Favorites** (`FavoritesView.svelte`): `Api.starred()` (`getStarred2`): songs, albums, artists.
- **Genre** (`GenreView.svelte`): `Api.songsByGenre(name)`; reached from the Home genre chips.
- **Home** (`HomeView.svelte`): recently played albums/artists come from the local play history (`Api.recentPlays`), random picks from `Api.albumList('random', 12)`, genre chips from `Api.genres()`.
- **Mix** (`MixView.svelte`): `Api.generateMix(energy, genre)` (`Core::generate_mix`).

## Rows (`components/TrackRow.svelte`, `AlbumRow.svelte`)

- Heart (`setStarred`), download (`downloadTrack`, uses the Download Format setting in Rust) and the **+** button, which opens the popup (`PlaylistMenu.svelte`, state in `lib/menu.ts`): Start Radio (`Api.startRadio`) and Add to playlist.
- Star ratings: `Api.setRating`; the view applies the new rating to its in-memory list.
- `data-source` routing is not in the UI: `Core` picks server or offline per call, so rows for `local:` ids simply hide server-only actions (`serverTrack` check).

## Multi-server

`config.toml` keeps `accounts` (server + username); passwords sit in the keyring keyed by server URL (`commands/credentials.rs`). `Core::switch_account` / `remove_account` implement switching; see [Sidebar & Navigation](/desktop-indepth-sidebar-nav).

## Offline library

Logged out, every `Core` read falls back to `commands/local_library.rs`, which scans `~/Music/Firmium` (embedded art for `local:` cover ids). Dropping files on the window calls `Api.importLocalFiles`; Settings → Downloads has a file picker (`pick_and_import`).

## See also

- [How it Works](/desktop-indepth-overview)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Playlists](/desktop-indepth-playlists)
