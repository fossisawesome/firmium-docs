# Troubleshooting

## Android

**App installed but won't open**
Ensure your device runs Android 8.0 (API 26) or later. If you sideloaded the APK, confirm you have allowed installs from unknown sources.

**Playback notification doesn't appear**
Grant Firmium the **Notifications** permission in your device's app settings. On Android 13+, this permission must be granted explicitly.

**Credentials lost after reinstall**
Credential storage is tied to the app's Android Keystore entry. A full uninstall clears the keys — you'll need to log in again after reinstalling.

**No audio through Bluetooth / certain output devices**
ExoPlayer routes audio through the Android audio system. If a specific output device isn't working, check that it is selected as the active output in your system's audio settings.

## Session expired

**"Session expired — please reconnect"**
If your server's session token becomes invalid (for example, the server restarted or your account's password changed), Firmium detects this and prompts you to reconnect. Re-enter your credentials on the login screen to continue.

## Linux

**App launches but credentials aren't saved / login fails every restart**
Your system's Secret Service daemon isn't running or isn't unlocked. On GNOME, ensure GNOME Keyring is started. On KDE, ensure KWallet is enabled and unlocked. You can test with:

```bash
secret-tool store --label='test' key value
```

If that fails, your keyring isn't running.

**No audio output**
Check that ALSA or PipeWire/PulseAudio is set up correctly. Run `aplay -l` to list audio devices.

**Blank window or app won't start (Wayland)**
Try forcing XWayland: `WAYLAND_DISPLAY= ./firmium` or set `GDK_BACKEND=x11` before launching.

**Server connection refused**
Make sure your server URL includes the port (e.g. `http://192.168.1.10:4533`) and that Firmium can reach it on your network. Check your server's logs if the URL looks correct.
