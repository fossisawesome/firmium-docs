# Command Line Control

The desktop app (Linux, Windows) can be controlled from a terminal while it's already running — useful for keyboard shortcuts, scripts, or window manager bindings.

```bash
firmium play-pause
firmium next
firmium prev
firmium volume 50        # 0-100
firmium seek 30           # seconds
firmium queue-index 2     # play track at this queue position
firmium shuffle-toggle
firmium repeat-cycle       # off -> repeat all -> repeat one -> off
firmium status             # JSON snapshot: track, position, playing, volume, shuffle, repeat
```

Each command connects to the running instance, sends the request, prints the reply, and exits — it does not open a second window. If Firmium isn't running, the command prints an error and exits non-zero.

## System media controls

Firmium also registers with your operating system's media controls, so media keys, headset buttons and the system now-playing widget work without any setup. On Linux this is an MPRIS player named `firmium` (usable with `playerctl`), on Windows it appears in the system media overlay, and on macOS in Now Playing. Play, pause, next, previous and seeking are supported. Cover art is not shown there yet.

## Example: bind a media key

```bash
# e.g. in a window manager config
bindsym XF86AudioPlay exec firmium play-pause
bindsym XF86AudioNext exec firmium next
bindsym XF86AudioPrev exec firmium prev
```

## Example: read now-playing for a status bar

```bash
firmium status | jq -r '.track.title, .track.artist'
```

See [Backend Internals](/desktop-backend-internals) for how the control socket works internally.
