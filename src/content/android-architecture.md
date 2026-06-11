# Android Architecture

This page is a tour of how the Firmium Android app is built, for anyone who wants to read
the code, fix a bug, or add a feature. For a higher-level introduction to the whole project
(including the desktop app), see the [Developer Overview](/developer-overview). The
canonical reference for this app is
[`android/CLAUDE.md`](https://github.com/fossisawesome/firmium/blob/main/android/CLAUDE.md).

## The Android app

The Android app is a separate, native app written in Kotlin with Jetpack Compose, built
independently of the desktop app with Gradle. It shares the same OpenSubsonic API contract
as the desktop app, but none of its code — there's no shared TypeScript or Rust.

```
android/app/src/main/java/com/fossisawesome/firmium/
  MainActivity.kt           App entry point
  FirmiumApplication.kt     Application class

  viewmodel/                State holders feeding Compose UI
    AuthViewModel.kt
    LibraryViewModel.kt
    PlayerViewModel.kt
    PlaylistViewModel.kt
    SearchViewModel.kt

  audio/                    Playback engine
    AudioPlayer.kt          Media3/ExoPlayer wrapper
    NowPlayingService.kt    Foreground media service
    NowPlayingController.kt

  data/
    api/                    ApiClient, AuthManager — OpenSubsonic REST + token handling
    model/                  Artist, Album, Song, Playlist data classes
    storage/                AppPreferences, PlaylistRepository, SecureStorage (Keystore)

  ui/
    components/             Compose UI: PlayerBar, FullScreenPlayer, QueueSheet,
                             LyricsSheet, AddToPlaylistDialog, FirmiumUi/-Header/
                             -TextField/-Switch/-Slider/-BottomSheet, CoverImage
    screens/                Top-level screens (e.g. SettingsScreen)
    theme/                  Theme.kt — Compose theming
```

**How a screen works**: each screen is a `@Composable` function that observes state from a
ViewModel (`viewmodel/`). ViewModels call `ApiClient` (in `data/api/`) to fetch data and
expose it as Compose state; the UI recomposes automatically when that state changes.

**How playback works**: `PlayerViewModel` drives `AudioPlayer`, which wraps Media3/ExoPlayer.
Playback runs in the foreground `NowPlayingService` so audio continues when the app is in
the background, with `NowPlayingController` bridging the service and the UI/notification.

**How data fetching works**: all networking goes through `ApiClient.kt` (OkHttp), not
`src/lib/*.ts` from the desktop app. Coroutine-based calls run via `viewModelScope.launch`
on the main dispatcher; any blocking OkHttp `.execute()` call must be wrapped in
`withContext(Dispatchers.IO)`, or it throws `NetworkOnMainThreadException` (which can be
silently swallowed by surrounding `catch` blocks — a common source of "nothing happens"
bugs).

**How themes work**: `ui/theme/Theme.kt` defines `ALL_THEMES` and exposes the active theme's
colors via `LocalFirmiumColors`, mirroring the desktop app's TOML-based theme colors (see
[Customizing Themes](/custom-themes)).

**Credentials**: stored via `SecureStorage` (Android Keystore-backed), the Android
equivalent of the desktop app's OS keyring usage.

## Going further

For a control-by-control walkthrough of the UI (player bar, full-screen player, queue,
lyrics, playlists, settings), see [Android In-depth](/android-indepth-overview).

## Building

See [Building from Source → Building for Android](/building-from-source#building-for-android)
for prerequisites and Gradle commands.
