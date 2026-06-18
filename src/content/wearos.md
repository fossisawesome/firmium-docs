# Wear OS

Firmium has a companion app for Wear OS watches that remote-controls playback running on your
phone. It is a remote, not a player: audio still plays through your phone (or whatever it is
connected to), and the watch shows what is playing and lets you control it. This is an Android
feature; the desktop app is not involved.

## Getting started

1. Install Firmium on your phone and sign in to your server.
2. Install the Firmium Wear OS app on your watch. Because the two apps share an identity, a paired
   watch can install it from your phone's companion app, or you can sideload the watch APK directly.
3. Open Firmium on the watch. As long as the watch is paired with your phone, it connects
   automatically — there is nothing to log in to on the watch.

## What you can do

- **See what's playing** — the watch shows the current track's title, artist, and cover art.
- **Control playback** — play/pause, skip to the next track, and skip to the previous track.
- **Adjust volume** — turn the rotating crown or bezel, or use the on-screen volume buttons.

Commands take effect on the phone immediately, and the watch updates within about a second when the
track or playback state changes on the phone.

## Notes

- **Start playback on the phone.** The watch controls playback that already exists; if nothing is
  playing, the watch shows "Nothing playing" and a prompt to open Firmium on your phone.
- **Keep the watch paired.** The watch talks to the phone over the standard Wear OS connection, so
  the two need to be paired and in range (Bluetooth, or Wi-Fi when the watch supports it).
- **Standalone listening is not included yet** — the watch cannot play music on its own. It is a
  remote for the phone for now.
