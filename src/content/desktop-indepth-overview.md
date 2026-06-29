# Desktop In-depth: How It Works

A look at the data and playback flow behind the desktop UI. For the high-level picture
first, see [Desktop Architecture](/architecture-overview).

## Data and playback flow

The desktop app is a single native [iced](https://iced.rs) (Rust) binary — no web view, no
JavaScript. `src/app.rs` holds all UI state on the `App` struct, a `Message` enum for every
user action and async result, `App::update` (handles each `Message`), and `App::view`
(re-rendered after every message). There's no separate store layer: `App` is the single
source of truth.

`App::update` reacts to navigation (`Message::Navigate(View)`) by checking saved credentials
in the OS keyring and, when authenticated, returning an `iced::Task::perform` that calls into
`backend/commands/subsonic.rs` to fetch albums, artists, playlists, or search results from
your Navidrome/OpenSubsonic server. Results come back as another `Message` (e.g.
`Message::AlbumsLoaded`) and get stored directly on `App`; cover art goes through a disk cache
(`backend/commands/cover_cache.rs`) into an `iced::widget::image::Handle` cached on `App`.

When you press play, the relevant `Message` (`PlaySong`, `PlayAlbumAt`, `Next`, `Prev`, …) is
handled in `App::update` by calling into `backend/commands/queue.rs`, which:

- Calls `backend/commands/playback.rs::play_stream` to start streaming the track through the
  audio engine (`backend/audio/`: `symphonia` decode + `cpal` output).
- The audio engine pushes `PlaybackStateChanged`/`PlaybackPosition` events onto the in-process
  `EventBus` (`backend/events.rs`, a `tokio::sync::broadcast` channel); the UI's
  `App::subscription` bridges that into `Message::Backend(BackendEvent)`, which updates
  `App`'s position/duration fields directly — no polling.
- The background `queue_manager` task (started by `Backend::new()` in `backend/init.rs`) watches
  for a track nearing its end and, depending on the Crossfade/Gapless settings, calls
  `AudioPlayer::crossfade_to()` or `preload_stream()`/`play_stream()` for the next track.

## See also

- [Player Bar](/desktop-indepth-player-bar)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Library Views](/desktop-indepth-library-views)
- [Playlists](/desktop-indepth-playlists)
- [Settings](/desktop-indepth-settings)
