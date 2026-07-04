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
    PlaybackController.kt   App-scoped queue/transport orchestration (source of truth)
    NowPlayingService.kt    Foreground media service
    NowPlayingController.kt MediaSessionCompat + media notification
    FirmiumMediaBrowserService.kt  Android Auto browse tree + session
    MediaTree.kt            Android Auto media-id scheme + parser

  wear/                     Wear OS companion bridge (phone side)
    WearContract.kt         Data Layer paths/keys (mirrored in the :wear module)
    WearRemoteService.kt    Receives watch transport commands (WearableListenerService)
    WearStateSync.kt        Pushes now-playing snapshots + art to the watch

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

**How playback works**: queue and transport orchestration lives in `PlaybackController`, an
application-scoped singleton held by `FirmiumApplication`. It owns the player state, drives
`AudioPlayer` (which wraps Media3/ExoPlayer), and updates `NowPlayingController`.
`PlayerViewModel` is a thin Activity-scoped facade that exposes `PlaybackController.state` to
Compose and adds the UI-only concerns (lyrics, similar tracks). Keeping orchestration at app
scope is what lets Android Auto control playback while no Activity exists. Playback runs in the
foreground `NowPlayingService` so audio continues when the app is in the background, with
`NowPlayingController` bridging the media session, notification, and `PlaybackController`.

### Android Auto

Android Auto is a media app, so the car does not render Firmium's Compose UI; it draws its own
driver-safe templated UI from two things Firmium provides:

- **`FirmiumMediaBrowserService`** (a `MediaBrowserServiceCompat`, declared in the manifest with
  the `android.media.browse.MediaBrowserService` intent filter and the
  `com.google.android.gms.car.application` metadata pointing at `res/xml/automotive_app_desc.xml`).
  Its `onLoadChildren`/`onSearch` build the browse tree (Home, Albums, Artists, Playlists, plus
  search) from the same `ApiClient`/`LocalLibraryRepository` the phone UI uses.
- **The shared `MediaSessionCompat`**, owned by `NowPlayingController` and exposed via
  `session()`. The browser service publishes its token, so the car's now-playing screen and
  transport controls reuse the existing session.

Browse-tree nodes and playable tracks are identified by ids defined in `MediaTree.kt`
(e.g. `album:<id>`, `track|album|<albumId>|<songId>`). When the car plays an item, the session's
`onPlayFromMediaId`/`onPlayFromSearch` callbacks forward to `PlaybackController`, which resolves
the id to a queue and plays it through the same engine as the phone. State stays in sync because
both the phone and the car drive the one `PlaybackController`.

### Wear OS companion

The Wear OS app is a second Gradle module, `android/wear/`, with its own Compose for Wear OS UI.
It shares the phone app's `applicationId` (`com.fossisawesome.firmium`) so the system associates
the two, but shares no code with `:app` — types with the same name (`ApiClient`, `AudioPlayer`,
`WearContract`) are independent copies duplicated across modules, kept manually in sync.

The watch supports two modes, both reachable from `HomeScreen`:

**Remote-control mode** (phone plays, watch controls) — `RemoteScreen.kt`, driven by
`WearPlaybackClient`. Talks to the phone over the **Wearable Data Layer API**
(`play-services-wearable`): commands (watch → phone) go over the `MessageClient` on path
`/firmium/cmd` (`play_pause`, `next`, `prev`, `set_volume:<0..1>`), received on the phone by
`WearRemoteService` (a `WearableListenerService`) which calls the phone's `PlaybackController`.
State (phone → watch) goes over the `DataClient` on path `/firmium/now_playing`, written by
`WearStateSync` (started from the phone's `FirmiumApplication`) whenever
`PlaybackController.state` changes.

**Standalone mode** (watch authenticates, fetches, and plays on its own — no phone needed at
runtime) — the default screen (`WearNavGraph.kt`, `wear/ui/*Screen.kt`), built up across four
increments:

1. **Credential handoff** — the phone's `WearAuthSync` (started from `FirmiumApplication`) pushes
   the active account's server URL/username/password to a `DataItem` on path `/firmium/auth`
   whenever it changes (login, account switch, logout, app-start restore). The watch's
   `WearAuthClient` listens and writes into `WatchSecureStorage` (Keystore-backed, mirrors the
   phone's `SecureStorage`).
2. **API client** — `data/api/ApiClient.kt` on the watch is a near-verbatim port of the phone's
   (albums, artists, search, playlists, scrobble, playback reporting, lyrics — everything except
   what needs infra the watch doesn't have). Its `WatchAuthManager` reads from
   `WatchSecureStorage` and builds the same MD5-token Subsonic auth params as the phone's
   `AuthManager`, refreshing whenever `WearAuthClient` receives new credentials.
3. **Playback engine** — `audio/AudioPlayer.kt` (ExoPlayer session engine — crossfade, gapless
   queue, ReplayGain; no EQ) and `audio/WatchPlaybackController.kt` (queue/transport
   orchestration, scrobble + playback reporting) are scoped-down ports of the phone's equivalents,
   dropping Android Auto entry points, local-library preference, play history, auto-continue
   radio, and ListenBrainz. `audio/WatchNowPlayingNotifier.kt` + `WatchNowPlayingService.kt` give
   the watch a plain foreground-service notification (title/artist, single play-pause toggle) —
   no `MediaSessionCompat`/`MediaStyle` yet. `data/storage/WatchPreferences.kt` persists just the
   8 playback-relevant settings (volume, repeat, shuffle, crossfade, gapless, ReplayGain) in a
   watch-local DataStore.
4. **Browse UI** — `wear/ui/` holds one composable screen per file (Home, Artists, Artist detail,
   Album detail, Playlists, Playlist detail, Search, Downloads, Now Playing), wired by
   `WearNavGraph.kt`'s `SwipeDismissableNavHost`. No ViewModel layer — screens call
   `FirmiumWearApplication` singletons directly and load data via `produceState`. Search uses the
   system voice/text input intent (`RemoteInputIntentHelper`, `androidx.wear:wear-input`) rather
   than an on-screen keyboard. Playlists are read-only (browse + play, no create/edit/delete).
5. **Mode persistence + offline downloads** — `WearNavGraph.kt` observes its own
   `NavController` back-stack (`currentBackStackEntryAsState`) and persists whichever top-level
   route is active (`"remote"` vs. everything else) to `WatchPreferences.lastMode`, resolving it
   again on next launch to pick `SwipeDismissableNavHost`'s `startDestination` — the app reopens
   into whichever mode was last used. Switching into remote mode also pauses any active standalone
   playback. `data/download/WatchDownloadManager.kt` downloads tracks to app-private storage
   (`filesDir/downloads/<songId>`) via a dedicated `OkHttpClient` GET on
   `WatchAuthManager.downloadUrl()` (format read from `WatchPreferences.downloadFormat`, synced —
   see below), persisting a manifest of downloaded `Song` objects as Gson JSON in its own
   DataStore file. `WatchPlaybackController.streamUrlFor` checks
   `downloadManager.localPathFor(songId)` first (`"file://..."` URI for ExoPlayer), falling back
   to `auth.streamUrl()` — same local-file-first pattern as the phone's
   `PlaybackController.streamUrlFor`. `AlbumDetailScreen`/`PlaylistDetailScreen` get bulk
   download buttons plus per-track download icons; `DownloadsScreen` lists downloads with total
   storage used and per-item delete.
6. **Settings sync** — no watch-side settings screen; the phone's `WearSettingsSync` (started
   from `FirmiumApplication`) observes `AppPreferences` (`themeId` resolved to hex colors via
   `themeById()`, crossfade enabled/duration/curve, gapless, ReplayGain, download format) and
   pushes a `DataItem` on `/firmium/settings` whenever any change (each preference collected
   independently rather than via a single `combine()` — there are 7 of them and typed `combine()`
   overloads only go up to 5). The watch's `WearSettingsClient` writes everything into
   `WatchPreferences`. No further wiring needed: `WatchPlaybackController` already reactively
   collects the playback-setting flows (from increment 3), `WatchDownloadManager` reads
   `downloadFormat` per-download, and `Theme.kt`'s `FirmiumWearTheme` reactively collects the 8
   synced theme fields (`WatchPreferences.themeColors`), falling back to a hardcoded default until
   the first sync arrives. Shuffle/repeat/volume are deliberately **not** synced — they're live
   per-device playback state with their own watch-side controls (Now Playing screen).

All standalone singletons (`secureStorage`, `authManager`, `api`, `watchPreferences`, `notifier`,
`downloadManager`, `playbackController`) live in `FirmiumWearApplication`, the watch module's
manual-DI container (mirrors the phone's `FirmiumApplication`). `WearAuthClient`/`WearSettingsClient`
(and the older `WearPlaybackClient`) are instantiated in `MainActivity` instead, matching the
lifecycle of the watch UI rather than the whole app.

The wire constants for both modes live in `WearContract.kt`, duplicated in both modules — keep the
two copies in sync. Not yet built: playlist create/edit/delete — see the project roadmap for
what's next.

**How data fetching works**: all networking goes through `ApiClient.kt` (OkHttp), not
`backend/commands/subsonic.rs` from the desktop app. Coroutine-based calls run via `viewModelScope.launch`
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
