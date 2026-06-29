# Desktop In-depth: Library Views

What each control in the library views (`src/app.rs`) does. The whole desktop UI is one
Rust crate — there are no separate component files; each "view" below is a method on `App`
returning an `iced::Element`.

## Library views (`src/app.rs`)

- **Album grid** (`album_list_view` / `album_row`) — fetches and lists albums (windowed:
  only the visible rows are built via the `list_window` helper). Clicking a row navigates to
  `View::AlbumDetail`.
- **Artist list** (`artists_view` / `artist_row`) — same windowed-list pattern for artists.
  Clicking a row navigates to `View::ArtistDetail`.
- **Album detail** (`album_detail_view`) — cover, title, track count, and **Play**
  (`Message::PlayAlbumAt(0)`), **Shuffle** (`Message::ShuffleAlbum`, calls
  `commands::queue::shuffle_and_play` with the album's tracks), and **Download**
  (`Message::DownloadAlbum`) buttons above the track list.
- **Artist detail** (`artist_detail_view`) — name, album count, Last.fm bio (if a key is
  configured in Settings → Services), a "you might also like" row of similar-artist names,
  and the artist's albums as a list. There's no Play/Shuffle here — playback starts from an
  album's own Play/Shuffle buttons.
- **Search** (`search_view`) — typing and pressing **Search** (or Enter) calls
  `Message::SubmitSearch` → `commands::subsonic::search`, showing a min-rating filter row
  (`rating_filter_row`), up to 40 matching albums, and up to 100 matching songs (`song_row`).
- **Add to playlist** — the **+** icon on track/song rows (`Message::OpenAddToPlaylist`)
  opens `add_to_playlist_overlay` (see [Playlists](/desktop-indepth-playlists)) to choose a
  destination playlist.
- **Download** — `track_row` (album/genre detail) and `song_row` (search results) show a
  download icon (`Message::DownloadTrack`) next to the add-to-playlist icon; `album_detail_view`
  has an album-level **Download** button (`Message::DownloadAlbum`). Both call
  `commands::downloads::download_track`/`download_album` with the format from
  `config.download_format`, saving into `~/Music/Firmium`.

## Track ratings

`track_row` and `song_row` render `star_rating`: 5 inline SVG stars
(`icons::STAR_FILLED`/`STAR_EMPTY`), one `Message::SetRating(song_id, n)` button per star.
The handler applies the new rating optimistically to any in-memory copy of that song (album
detail, playlist detail, search results, similar-tracks results) before firing
`commands::subsonic::set_rating` in the background. A separate `avg_rating_badge` shows the
server's average rating (if any) next to the stars when nonzero.

## Multi-server

`config.rs`'s `Config.accounts: Vec<SavedAccount>` records every server/username you've
connected with; a new entry is appended on `Message::Connect`. Keyring credentials are
parameterized by server: `save_password`/`get_password` (`backend/commands/credentials.rs`)
take the server URL as the keyring `service`, so each server's password is stored separately.
The connect form (`account_switcher_overlay`, opened via the sidebar's account icon) only
exposes a single login form plus **Disconnect** when signed in — it doesn't yet render the
saved-accounts list for one-click switching, even though the data is persisted.

## Local library

`backend/commands/local_library.rs` can scan `~/Music/Firmium` and serve it as albums/artists
(`get_local_albums`, `get_local_album_tracks`, `search_local`, …), and `App::local_view`
renders that as an "Offline Library" screen. This is wired for `View::LocalAlbumDetail`
(reachable by tapping a local album once the view is showing), but `View::Local` itself has
no nav entry point in the current build — the sidebar's nav list (`Home`, `Albums`, `Artists`,
`Playlists`, `Search`, `Mix`, `Settings`) doesn't include it.

## See also

- [How it Works](/desktop-indepth-overview)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Playlists](/desktop-indepth-playlists)
