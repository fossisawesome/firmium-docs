# Installing

Firmium is available for **Linux desktop** and **Android**.

> **Compatibility (Linux):** Tested on Hyprland (Wayland). Other desktop environments should work but are not officially tested. X11 is untested.

## Android

Get it via [Obtainium](https://github.com/ImranR98/Obtainium) for automatic update checks, or download the latest `.apk` from the [releases page](https://github.com/fossisawesome/firmium/releases/latest) and install it manually:

```bash
# Via ADB (sideloading):
adb install firmium_*.apk
```

Or transfer the APK to your device and open it with a file manager. You may need to enable **Install from unknown sources** in your device settings.

> **Note:** Firmium for Android requires Android 8.0 (API 26) or later.

## System Dependencies (Linux)

Before running Firmium, install the required system libraries for your distribution.

**Debian / Ubuntu**

```bash
sudo apt update && sudo apt install -y libwebkit2gtk-4.1-0 libasound2 libssl3 libsecret-1-0 libxdo3 libxcb1
```

**Fedora**

```bash
sudo dnf install -y webkit2gtk4.1 alsa-lib openssl-libs libsecret libxdo libxcb
```

**Arch Linux**

```bash
sudo pacman -S --needed webkit2gtk-4.1 alsa-lib openssl libsecret xdotool libxcb
```

Firmium also requires:

- A **Secret Service provider** (GNOME Keyring or KWallet) for credential storage — included in most desktop environments. Without it, passwords won't be saved and you'll need to log in every launch.
- **PipeWire or PulseAudio** — on modern distros ALSA routes through one of these. Run `aplay -l` to verify audio devices are visible.

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
sudo dpkg -i ./firmium_*.deb
```

## Next Steps

Once installed, see [Usage](/usage) for how to log in and start listening, [Settings](/settings) to configure the app, or [Troubleshooting](/troubleshooting) if you run into issues.
