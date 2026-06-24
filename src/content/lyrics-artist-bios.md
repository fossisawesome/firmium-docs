# Lyrics & Artist Bios

## Lyrics

View the lyrics for the current track from the player. On desktop they open in a panel from the player bar. On Android, tap the cover art on the full-screen player and the lyrics appear in place of the artwork; tap the X to go back to the art. If your server provides synced lyrics, Firmium shows them karaoke-style, highlighting the current line as the song plays. Otherwise, you'll see plain, unsynced lyrics.

If your server doesn't have lyrics for a track, Firmium can look them up from [LRCLIB](https://lrclib.net/), a free lyrics database. This is on by default and can be turned off in [Settings](/settings).

## Artist biographies

Artist pages can show a short biography and photo, sourced from Last.fm. Connect your own Last.fm account in [Settings](/settings) for richer results.

## Implementation

For the lyrics lookup order (server -> legacy -> LRCLIB), LRC parsing, and query
normalization, see [Desktop Backend Internals](/desktop-backend-internals#lyrics-cascade-commandslyricsrs-commandssubsonicrs).
