# Building from Source

This page covers building Firmium yourself from the source code, for both the Linux desktop app and the Android app. If you're new to the codebase and want to understand how everything fits together first, see the [Architecture Overview](/architecture-overview).

## Prerequisites

- Rust 1.70 or later (`rustup default stable`)
- Node.js 18 or later
- System dependencies for your distribution (see [Installing → System Dependencies](/installing#system-dependencies-linux))

## Steps

```bash
# Clone the repository
git clone https://github.com/fossisawesome/firmium.git
cd firmium

# Install Node dependencies
npm install

# Start the development build
npm run dev:app
```

For a release build:

```bash
npm run release
```

This produces `.deb` and `.rpm` packages under `src-tauri/target/release/bundle/`.

## Packaging

### Arch Linux (`PKGBUILD`)

The root [`PKGBUILD`](https://github.com/fossisawesome/firmium/blob/main/PKGBUILD) extracts the binary from the Tauri `.deb` bundle (after `npm run release`), then installs it to `/usr/bin/firmium-desktop` along with the desktop file and icons. Build with:

```bash
makepkg -si
```

### Fedora / RPM (`firmium.spec`)

The [`firmium.spec`](https://github.com/fossisawesome/firmium/blob/main/firmium.spec) (and [`packaging/firmium.spec`](https://github.com/fossisawesome/firmium/blob/main/packaging/firmium.spec)) build via `npm install && npm run release`, then extract the generated `.rpm` from `src-tauri/target/release/bundle/rpm/` using `rpm2cpio`. This is the spec used for the Fedora COPR build.

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
