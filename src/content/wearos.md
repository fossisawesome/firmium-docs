# Wear OS

Firmium has a companion app for Wear OS watches. It works two ways: as a **remote** for playback
running on your phone, or **standalone**, browsing and playing your library directly on the
watch — no phone needed once it's set up. This is an Android feature; the desktop app is not
involved.

## Getting started

1. Install Firmium on your phone and sign in to your server.
2. Install the Firmium Wear OS app on your watch. Because the two apps share an identity, a paired
   watch can install it from your phone's companion app, or you can sideload the watch APK directly.
3. Open Firmium on the watch. While paired with your phone, it automatically receives your server
   and login details — there's nothing to type in on the watch.
4. From the watch's Home screen, browse your library directly (Artists, Playlists, Search), or tap
   "Remote (phone playback)" to control what's playing on your phone instead.

## Standalone playback

Once your watch has picked up your account (step 3 above), it can play music entirely on its own —
useful for a run or workout where you leave your phone behind, as long as the watch itself has a
network connection (Wi-Fi, or LTE on cellular models).

- **Browse** — Artists, Albums, Playlists, and Search, all from the watch.
- **Play** — tap any track, album, or playlist to start playing it on the watch's own speaker or
  paired Bluetooth audio.
- **Now Playing** — cover art, title, artist, play/pause, next/previous, seek, volume, shuffle,
  and repeat.
- **Crossfade, gapless playback, and ReplayGain** automatically match whatever you've set on the
  phone — there's no separate watch settings screen, changing them on the phone updates the watch
  the next time it's in range.
- **Theme** also follows the phone — pick a theme there and the watch's colors update to match.
- A notification keeps playback controls available even when you're not looking at the app.

Playlists are browse-and-play only on the watch — creating, renaming, or editing playlists still
happens on the phone or desktop.

The watch remembers whichever mode (standalone or remote) you used last, and reopens into it —
no need to re-select every time you open the app.

## Offline downloads

Download an album, playlist, or individual track to the watch so it plays without a network
connection — useful once you're somewhere without Wi-Fi or LTE.

- Tap "Download album" or "Download playlist" on an album/playlist screen to download every
  track in it, or tap the download icon next to any individual track.
- Open "Downloads" from the Home screen to see everything you've downloaded, how much storage
  it's using, and to delete downloads you no longer need.
- Downloaded tracks play automatically from the watch's local copy — no need to do anything
  differently when playing them.

Watch storage is limited, so download selectively rather than your whole library. Downloads use
whatever download format is set on the phone (e.g. original quality, MP3, FLAC) — there's no
separate format picker on the watch.

## Remote-control mode

Tap "Remote (phone playback)" from the Home screen to switch to the original remote-control view:

- **See what's playing** — the watch shows the current track's title, artist, and cover art.
- **Control playback** — play/pause, skip to the next track, and skip to the previous track.
- **Adjust volume** — turn the rotating crown or bezel, or use the on-screen volume buttons.

Commands take effect on the phone immediately, and the watch updates within about a second when the
track or playback state changes on the phone. Remote mode controls whatever is playing on the
phone — it's a separate mode from standalone playback, not related to it.

## Notes

- **Standalone needs your account synced first.** If the watch hasn't received your credentials
  yet (e.g. right after installing, before opening Firmium on the phone), standalone browsing and
  playback won't work — open the phone app once while paired to sync.
- **Remote mode needs something already playing on the phone.** If nothing is playing there, the
  remote view shows "Nothing playing."
- **Keep the watch paired** for remote mode and for credential syncing — the two talk over the
  standard Wear OS connection (Bluetooth, or Wi-Fi when the watch supports it). Standalone
  *playback* itself doesn't need the phone once your account has synced.
- **Undownloaded tracks still need a network connection** — only downloaded tracks play offline;
  anything else streams from your server.
