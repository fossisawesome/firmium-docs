# Android In-depth: Library & Navigation

How the library screens and navigation work.

## Library & Navigation

- `LibraryViewModel` and `SearchViewModel` back the album/artist/search screens, fetching
  data via `ApiClient` and exposing it as Compose state.
- `FirmiumDetailHeader` is the shared header used on detail screens: a back arrow, a title,
  and an optional trailing action (e.g. Play All).
- **Add to playlist** and **Play All** actions on these screens mirror the desktop app's
  behavior — see [Desktop In-depth: Library Views](/desktop-indepth-library-views) for the
  equivalent desktop controls.

## See also

- [How it Works](/android-indepth-overview)
- [Playlists](/android-indepth-playlists)
