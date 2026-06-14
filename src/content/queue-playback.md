# Queue & Playback

The player bar at the bottom of the screen controls playback: play/pause, skip to the next or previous track, seek within a track, and adjust volume. Volume is remembered separately for each device.

## The queue

When you play an album or playlist, its tracks are added to your queue, and playback moves through them in order. You can see what's playing now and what's coming up next from the player bar.

## Crossfade vs. gapless playback

Firmium offers two ways to transition between tracks. You can pick one in [Settings](/settings), and they can't both be on at once:

- **Crossfade**: the end of one track fades out while the next track fades in, so they blend smoothly. You can set how long the blend lasts, from 1 to 12 seconds.
- **Gapless playback**: the next track is loaded ahead of time so it starts the instant the current one ends, with no fade and no silence in between. This is best for albums recorded as one continuous piece of music.

If neither suits you, you can turn both off and tracks will simply play one after another with the player's normal behavior.

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

- **Orb**: a glowing sphere that pulses with the bass.
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
