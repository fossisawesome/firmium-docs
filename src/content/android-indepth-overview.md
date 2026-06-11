# Android In-depth: How It Works

A look at the data and playback flow behind the Android UI. For the high-level picture first,
see [Android Architecture](/android-architecture).

## Data and playback flow

Each screen under `ui/screens/` is a `@Composable` backed by a ViewModel — `AuthViewModel`,
`LibraryViewModel`, `PlayerViewModel`, `PlaylistViewModel`, `SearchViewModel`. ViewModels call
`ApiClient` from `viewModelScope.launch`; any blocking OkHttp call is wrapped in
`withContext(Dispatchers.IO)` to avoid `NetworkOnMainThreadException`.

`PlayerViewModel` exposes a `PlayerState` (current track, position, playing/paused, queue,
shuffle/repeat mode) consumed by the player UI. It drives `audio/AudioPlayer`, a wrapper
around Media3/ExoPlayer. Playback runs inside `audio/NowPlayingService`, a foreground service,
so audio keeps playing when the app is backgrounded; `NowPlayingController` bridges the
service and the UI/notification, keeping `PlayerState` in sync with the actual player.

## See also

- [Player Bar & Full Screen Player](/android-indepth-player)
- [Library & Navigation](/android-indepth-library-nav)
- [Queue & Lyrics](/android-indepth-queue-lyrics)
- [Playlists](/android-indepth-playlists)
- [Settings](/android-indepth-settings)
