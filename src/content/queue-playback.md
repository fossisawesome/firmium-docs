# Queue & Playback

The player bar at the bottom of the screen controls playback: play/pause, skip to the next or previous track, seek within a track, and adjust volume. Volume is remembered separately for each device.

## The queue

When you play an album or playlist, its tracks are added to your queue, and playback moves through them in order. You can see what's playing now and what's coming up next from the player bar.

## Shuffle and repeat

The shuffle button toggles random play order. The repeat button cycles through three states each time you tap it: first **repeat all** (the queue loops forever), then **repeat once** (the current track plays again one more time, then repeat turns off), then **off**. On Android these controls also appear in the playback notification.

## Now-playing screen (Android)

Open the full-screen player by tapping the player bar. From there you can:

- **Tap the cover art** to show the lyrics in place of the artwork; tap the **X** to return to the art.
- **Long-press the cover art** to pop up the 1-5 star rating for the track.
- **Tap the three-dot button** next to the progress bar to open a menu of actions: volume, add to playlist, visualizer, track info, view artist, add to queue, equalizer, and download.

## Crossfade vs. gapless playback

Firmium offers two ways to transition between tracks. You can pick one in [Settings](/settings), and they can't both be on at once:

- **Crossfade**: the end of one track fades out while the next track fades in, so they blend smoothly. You can set how long the blend lasts, from 1 to 12 seconds, and choose the curve — **Linear** for an even volume fade, or **Logarithmic** for an equal-power fade that keeps the overlap sounding consistent.
- **Gapless playback**: the next track is loaded ahead of time so it starts the instant the current one ends, with no fade and no silence in between. This is best for albums recorded as one continuous piece of music.

If neither suits you, you can turn both off and tracks will simply play one after another with the player's normal behavior.

## Scrobbling

While a track plays, Firmium reports "Now Playing" and scrobble events to your server, so listening history shows up in Navidrome (and any Last.fm or ListenBrainz integration your server is configured to forward to). This happens automatically and needs no setup beyond a normal server connection.

## ReplayGain

If your server provides ReplayGain metadata for a track, Firmium applies it automatically during playback to even out volume differences between tracks and albums. There's no setting to turn this on or off — it's applied whenever the metadata is available.

## Track format info

The player bar shows the format of the currently playing track, such as `FLAC · 96 kHz · 24-bit · 1411 kbps`, when this information is available from your server.

## Similar Tracks

Firmium can always show a list of similar tracks for whatever is currently playing, each with a similarity percentage. Tapping a track plays the similar-tracks list starting from that song.

If your server supports the OpenSubsonic `sonicSimilarity` extension (for example, Navidrome with a sonic-similarity plugin configured), these are true audio-similarity matches. Otherwise, Firmium falls back to suggesting tracks that share a genre with the current track, plus tracks from artists similar to the current artist (using your server's Last.fm-backed artist info).

- **Desktop**: click the similar-tracks button in the player bar to open the panel.
- **Android**: open the full-screen player and tap the similar-tracks button among the secondary controls.

This feature only appears if your server advertises the extension; otherwise the button is hidden.

## Visualizer (desktop)

Click the waveform button in the player bar to open the visualizer panel. It reacts to whatever is currently playing, with two modes:

- **Orb**: an NCS-style animated orb with pulsing rings, orbiting wisps, and a particle field. The colors are extracted from the current track's cover art. The orb reacts to bass in real time.
- **Bars**: a classic frequency bar display.

Switch between modes using the buttons at the top of the panel; your choice is remembered. The visualizer only analyzes audio while the panel is open, so it has no effect on playback or CPU usage when closed.

## Continue playback on another device

If your server supports the OpenSubsonic Play Queue API, Firmium periodically saves your current queue, track, and playback position to the server. This happens when a track starts, when you pause, and roughly every 30 seconds while playing. Local-only tracks (downloaded files not on your server) aren't included in this sync.

When you open Firmium on another device (or reconnect), it checks for a saved queue from elsewhere. If one is found, a banner appears asking "Resume queue from another device?" Choosing **Resume** loads the saved queue and seeks to the saved position. Choosing **Dismiss** ignores it.

## Native-rate audio (desktop, Linux/Windows)

On desktop, Firmium always reopens the audio output device to match each track's native sample rate, avoiding the resampling that audio servers like PipeWire otherwise apply. A few things to know:

- If a crossfade is in progress when a track with a different sample rate starts, the rate change is deferred until the crossfade finishes, so the transition stays smooth. The output device switches to the new rate for the track after that.
- If your audio device doesn't support a track's exact sample rate, Firmium plays the track at the device's rate instead, resampling internally so playback continues without interruption.
- Switching sample rates can cause a brief click or pop on some audio setups.
