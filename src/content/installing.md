# Installing

Firmium is available for **Linux desktop, macOS** and **Android**.

> **Compatibility (Linux):** Tested on Hyprland (Wayland). Other desktop environments should work but are not officially tested. X11 is untested.

> **macOS builds are unsigned.** There's no Apple Developer account yet, so the app isn't notarized. On first launch, Gatekeeper blocks it — right-click the app in Finder, choose **Open**, then confirm. Only needed once.

## Android

Get it via [Obtainium](https://github.com/ImranR98/Obtainium) for automatic update checks, or download the latest `.apk` from the [releases page](https://github.com/fossisawesome/firmium/releases/latest) and install it manually.

To sideload via ADB:

```bash
# Via ADB (sideloading):
adb install firmium_*.apk
```

Or transfer the APK to your device and open it with a file manager. You may need to enable **Install from unknown sources** in your device settings.

> **Note:** Firmium for Android requires Android 8.0 (API 26) or later.

## macOS

Download the `.dmg` matching your Mac from the [releases page](https://github.com/fossisawesome/firmium/releases/latest) — `Firmium_*_x64.dmg` for Intel Macs, `Firmium_*_aarch64.dmg` for Apple Silicon (M1/M2/M3/M4). Open the `.dmg` and drag **Firmium** into **Applications**.

No extra system libraries are needed — audio (CoreAudio) and credential storage (Keychain) are built into macOS.

## System Dependencies (Linux)

Before running Firmium, install the required system libraries for your distribution.

**Debian / Ubuntu**

```bash
sudo apt update && sudo apt install -y libwebkit2gtk-4.1-0 libasound2 libssl3 libsecret-1-0 libxdo3
```

**Fedora**

```bash
sudo dnf install -y webkit2gtk4.1 alsa-lib openssl-libs libsecret libxdo
```

**Arch Linux**

```bash
sudo pacman -S --needed webkit2gtk-4.1 alsa-lib openssl libsecret xdotool
```

Firmium also requires:

- A **Secret Service provider** (GNOME Keyring or KWallet) for credential storage. This is included in most desktop environments. Without it, passwords won't be saved and you'll need to log in every launch.
- **PipeWire or PulseAudio**. On modern distros, ALSA routes through one of these. Run `aplay -l` to verify audio devices are visible.

## Installing the App (Linux)

Download the latest release from the [releases page](https://github.com/fossisawesome/firmium/releases/latest). (Unless you use Arch)

**Arch Linux**

```bash
yay -S firmium-desktop-bin # or paru -S firmium-desktop-bin
```

**Fedora (COPR)**

```bash
sudo dnf copr enable fossisawesome/Firmium
sudo dnf install firmium
```

**Debian / Ubuntu**

```bash
# Download the .deb from the releases page, then:
sudo apt install ./Firmium_*.deb
```

## Next Steps

Once installed, see [Connecting to Navidrome](/connecting-to-navidrome) for how to log in and start listening, [Settings](/settings) to configure the app, or [Troubleshooting](/troubleshooting) if you run into issues.
