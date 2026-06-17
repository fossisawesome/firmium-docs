# Android Auto

Firmium supports Android Auto, so you can browse your library and control playback from your
car's display. This is an Android feature; the desktop app is not involved.

## Getting started

1. Install Firmium on your phone and sign in to your server.
2. **Allow Firmium in Android Auto.** Because Firmium is sideloaded (not installed from the
   Google Play Store), Android Auto hides it until you turn it on once: open your phone's
   **Android Auto** settings, scroll to the bottom and tap **Version** about ten times to unlock
   **Developer settings**, then enable **Unknown sources**.
3. Connect your phone to a car that supports Android Auto (by cable or wireless, depending on
   your car).
4. Open the app launcher on the car display and choose **Firmium**.

### Why the extra step?

Installing the APK alone is not enough. Android Auto only shows apps that are installed from the
Google Play Store and approved by Google for use in the car. Firmium is distributed as an APK
(through Obtainium or the releases page), so it does not meet that bar automatically. Turning on
**Unknown sources** in Android Auto's developer settings tells your phone to show it anyway. It is
a one-time setting. If Firmium is ever published to the Play Store and approved for Android Auto,
this step will no longer be needed.

## What the car UI looks like

For safety, Android Auto draws its own standardized car interface for every media app. Firmium
provides the content and structure; the car renders the menus, lists, and now-playing screen.
So the car UI will not look pixel-for-pixel like the phone app, but it gives you the same music.

## Browsing

The car menu mirrors your phone library:

- **Home** shows your recently played and a rotating set of picks, for a quick start.
- **Albums** and **Artists** let you browse your full library and drill into tracks.
- **Playlists** lists your playlists, both the ones synced to your server and any kept on the
  phone.
- **Search** lets you find a song, album, or artist.

Tap any track, album, or playlist to start playing. The now-playing screen shows the cover art,
title, and artist, with play/pause, skip, and seek controls.

## Voice control

You can play without touching the screen. Say something like:

> "Hey Google, play Daft Punk on Firmium."

Firmium searches your library and starts playback.

## Notes

- **Sign in on the phone first.** You cannot log in to your server from the car. If you are not
  signed in, the car shows a prompt to open Firmium on your phone.
- **Cover art** for tracks streamed from your server appears in the car. Art for music stored
  only as local files on the phone may not show on the car display.
- All your usual playback settings (crossfade, gapless, ReplayGain, repeat, shuffle) still apply,
  since the car plays through the same engine as the phone.
