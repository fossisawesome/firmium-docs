# Building from Source

This page covers building Firmium yourself from the source code, for the desktop app (Linux, Windows, macOS) and the Android app. If you're new to the codebase and want to understand how everything fits together first, see the [Architecture Overview](/architecture-overview).

## Prerequisites

- Rust 1.80 or later (`rustup default stable`)
- Node.js 22 or later (with npm) for the Svelte frontend
- On Linux: the `-dev` packages for WebKitGTK 4.1, ALSA, OpenSSL, libsecret, libxdo and librsvg, plus `pkg-config` (see [Installing → System Dependencies](/installing#system-dependencies-linux) for runtime names and the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your distro)
- On Windows: WebView2 (preinstalled on Windows 10/11)
- On macOS: Xcode Command Line Tools (`xcode-select --install`) — no other system libraries needed

The desktop app is a [Tauri 2](https://tauri.app) application: a Rust backend plus a Svelte 5 UI that only renders state.

## Steps

```bash
# Clone the repository
git clone https://github.com/fossisawesome/firmium.git
cd firmium

# Install frontend dependencies
npm ci

# Run the app (Vite dev server + debug build)
npm run tauri:dev
```

For an optimized release build with installers:

```bash
npm run tauri:build
```

This builds the frontend, compiles `target/release/firmium`, and writes installers (`.deb`/`.rpm` on Linux, NSIS on Windows, `.dmg` on macOS) to `target/release/bundle/`.

## Packaging

### Arch Linux (`PKGBUILD`)

The root [`PKGBUILD`](https://github.com/fossisawesome/firmium/blob/main/PKGBUILD) runs `npm ci && npm run build`, then `cargo build --release -p firmium --features custom-protocol` (the feature embeds `dist/`; without it the binary loads the dev server URL). It installs `target/release/firmium` to `/usr/bin/firmium` with `packaging/firmium.desktop` and the icons from `src-tauri/icons/`. Build with:

```bash
makepkg -si
```

### Fedora / RPM (`firmium.spec`)

The [`firmium.spec`](https://github.com/fossisawesome/firmium/blob/main/firmium.spec) builds the same way. [`packaging/firmium.spec`](https://github.com/fossisawesome/firmium/blob/main/packaging/firmium.spec) is the COPR variant: because COPR builds are offline, the `copr.yml` workflow vendors the crates and ships a prebuilt `dist/` in the vendor tarball.

### Release artifacts

`release.yml` calls the Tauri bundler on each OS: `.deb` and `.rpm` (Ubuntu 22.04), NSIS `.exe` (Windows), and one `.dmg` per architecture (`macos-14`, Apple Silicon and Intel). macOS builds are unsigned (no Apple Developer account yet), so there is no notarization step.

## Building for Android

The Android app is a native Kotlin + Jetpack Compose app in [`android/`](https://github.com/fossisawesome/firmium/tree/main/android), built with Gradle independently of the desktop Tauri project. See [android/CLAUDE.md](https://github.com/fossisawesome/firmium/blob/main/android/CLAUDE.md) for its architecture.

### Additional Prerequisites

- JDK 17 or later
- Android SDK with build tools 35 (install via Android Studio or `sdkmanager`)
- `ANDROID_HOME` environment variable set

### Steps

```bash
cd android

# Development build
./gradlew assembleDebug

# Install debug build on connected device / emulator
./gradlew installDebug

# Release APK (requires signing env vars — see below)
./gradlew assembleRelease
```

The release APK is output to `android/app/build/outputs/apk/release/`.

For an F-Droid style build without Google libraries (Wear OS sync is left out), add `-Pfoss`: `./gradlew assembleRelease -Pfoss`.

To sign the release build, set these environment variables before running `assembleRelease`:

```bash
export ANDROID_SIGNING_KEY_PATH=/path/to/your.keystore
export ANDROID_SIGNING_KEY_ALIAS=your-key-alias
export ANDROID_SIGNING_STORE_PASSWORD=store-password
export ANDROID_SIGNING_KEY_PASSWORD=key-password
```

If these are not set, Gradle will build an unsigned APK.

### Testing on Android Auto (DHU)

Android Auto support (see [Android Architecture → Android Auto](/android-architecture)) is tested with the **Desktop Head Unit (DHU)**: the car interface runs on your computer while a real, USB-connected phone does the work. You do not need a car.

**Install the DHU** (once) via Android Studio (**SDK Manager → SDK Tools → "Android Auto Desktop Head Unit Emulator"**) or the CLI:

```bash
sdkmanager "extras;google;auto"
```

It installs to `$ANDROID_HOME/extras/google/auto/desktop-head-unit`.

> **Linux note:** the DHU binary is linked against LLVM's `libc++` and needs `libc++.so.1` + `libc++abi.so.1`, which are not bundled. On Arch they are not installed by default — add them with `yay -S libc++` (the AUR package). It also needs SDL2 (`sdl2`). Verify with `ldd .../desktop-head-unit | grep "not found"` (should be empty).

**Enable Android Auto developer mode on the phone:** open the Android Auto settings, tap **Version** about ten times to unlock developer mode, then in **Developer settings** enable **Unknown sources** (so your sideloaded debug build is shown) and **Start head unit server**.

**Run it** with the debug build installed (`./gradlew installDebug`):

```bash
adb forward tcp:5277 tcp:5277
$ANDROID_HOME/extras/google/auto/desktop-head-unit
```

A car-display window opens. Choose **Firmium** from the app launcher and browse Home / Albums / Artists / Playlists; tap a track to confirm playback and the now-playing controls.

ALSA warnings, a missing `~/.android/headunit.ini` ("using default values"), and repeated `Audio stream already playing` lines are harmless. `Failed to read from transport - disconnect. Exiting...` just means the session ended (phone locked, window closed, or cable jostled).
