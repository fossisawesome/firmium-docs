# Desktop Backend Internals

This page documents the `src-tauri/src/commands/` modules that aren't covered by
[Settings & Themes Internals](/settings-themes-internals): auth token generation, the
on-disk cover art cache, the lyrics lookup cascade, and the Subsonic JSON mappers. All of
these are plain `#[tauri::command]` functions invoked from the frontend via `tauriInvoke()`
(`src/lib/tauri.ts`).

## Auth token generation (`commands/auth.rs`)

OpenSubsonic uses token auth: instead of sending a plaintext password, the client sends a
salt and `md5(password + salt)`. To keep MD5 and the plaintext password out of the JS
layer, this is computed entirely on the Rust side.

[`generate_auth_params(username, password)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/auth.rs) does:

1. Generates a random 8-byte salt (`rand::random::<[u8; 8]>()`), hex-encoded to 16 chars.
2. Computes `token = md5(password + salt)` via the `md5` crate.
3. Returns a JSON object with the params the Subsonic API expects: `u` (username), `t`
   (token), `s` (salt), `v` (`"1.16.1"`), `c` (`"firmium"`), `f` (`"json"`).

The frontend calls this once during login/connection setup and appends the returned
params to every API request. `src-tauri/src/state.rs`'s `set_connection` stores the
resulting params (not the plaintext password) in `AppState`. Unit tests in `auth.rs`
verify the token matches `md5(password + returned_salt)` and that the salt is random
per call.

## Cover art cache (`commands/cover_cache.rs`)

Cover art is cached on disk under `app_cache_dir()/covers/` (e.g.
`~/.cache/com.fossisawesome.firmium/covers/` on Linux), with a fixed 200MB budget
(`MAX_CACHE_BYTES`).

- [`get_cover_art(cover_id, url)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/cover_cache.rs):
  - Sanitizes `cover_id` to a filesystem-safe name (`sanitize_cover_id` - non-alphanumeric
    chars other than `-`, `_`, `.` become `_`).
  - `find_cached()` checks for an existing file with that prefix (any extension) and
    returns its path immediately if found.
  - Otherwise downloads `url` via a shared `reqwest::Client` (lazily created with
    `OnceLock`), picks an extension from the response `Content-Type`
    (`extension_for_content_type` - png/webp/gif/jpg), writes the file, then calls
    `evict_if_needed()`.
  - Returns a filesystem path string. The frontend (`src/lib/coverCache.ts`) converts it
    with Tauri's `convertFileSrc()` for use in an `<img src>`.
- `evict_if_needed(dir)`: sums the size of all files in the cache dir; if over
  `MAX_CACHE_BYTES`, sorts files by `mtime` ascending and deletes the oldest until back
  under budget. This is the only place the cache is pruned - it runs after every new
  download, not on a timer.
- [`clear_cover_cache()`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/cover_cache.rs):
  removes the whole `covers/` directory (used by Settings > Debug > Wipe Cache).

## Lyrics cascade (`commands/lyrics.rs` + `commands/subsonic.rs`)

`get_song_lyrics()` in `subsonic.rs` is the entry point the frontend calls
(`src/lib/lyrics.ts`). It tries, in order:

1. **Structured lyrics** - OpenSubsonic `getLyricsBySongId`, which can return
   time-synced lines directly.
2. **Legacy lyrics** - the older `getLyrics` endpoint (artist/title based, plain text
   only).
3. **LRCLIB fallback** - [`fetch_lrclib_lyrics(artist, title, duration)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/lyrics.rs),
   only reached if the server returned nothing usable.

`fetch_lrclib_lyrics`:
- Normalizes the artist/title via `normalize_lrclib_query()` before querying
  `https://lrclib.net/api/get`: `strip_qualifier_suffix()` removes trailing
  `(Live)`/`[Remix]`/etc. qualifiers from the title, `strip_feat_suffix()` removes
  `" - feat. ..."` suffixes, and `primary_artist()` keeps only the first artist when the
  artist string contains `feat`/`ft`/`featuring`/`/`.
- A 404 from LRCLIB returns `Ok(None)` (no lyrics found, not an error).
- If `instrumental` is true, returns a single line `"♪ Instrumental ♪"` (unsynced).
- Prefers `synced_lyrics` (parsed via `parse_lrc_lines`) over `plain_lyrics`.

`parse_lrc_lines` / `parse_lrc_line` parse standard LRC `[mm:ss.xx]text` lines into
`LyricLine { start: i64 (ms), value: String }`, sorted by `start`. Lines that don't match
the `[mm:ss.xx]` or `[mm:ss.xxx]` format are silently skipped. `LyricsResult { lines,
synced }` is the shape returned to the frontend; `synced: true` only when timestamped
lines were found, which drives whether `LyricsPanel.svelte` shows karaoke-style
highlighting.

## OpenSubsonic extension detection and playback reporting (`commands/subsonic.rs`)

Every Subsonic response includes an `openSubsonicExtensions` array naming the extensions
the server supports. `subsonic_request()` captures this array into
`AppState.connection.open_subsonic_extensions` on every call. The frontend fetches the
current list once after login via
[`get_open_subsonic_extensions()`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/subsonic.rs)
and stores it in `openSubsonicExtensions` (`src/lib/stores.ts`), which drives derived
stores like `hasSonicSimilarity`. `has_extension(state, name)` is the Rust-side helper
used by the commands below to check whether a given extension is advertised.

- [`report_playback(media_id, position_ms, playback_state)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/subsonic.rs)
  implements the `playbackReport` extension's `reportPlayback` endpoint. It's a no-op
  (and never makes a request) unless the server advertises `playbackReport`. Fire-and-forget
  via `tokio::spawn`, same pattern as `scrobble`. Called from `src/lib/playback.ts` (track
  start/finish) and `src/lib/playerControls.ts` (pause/resume) with `state` one of
  `starting`/`playing`/`paused`/`stopped`.
- [`save_play_queue(ids, current, position_ms)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/subsonic.rs)
  and `get_play_queue()` implement the Play Queue API's `savePlayQueue`/`getPlayQueue`
  endpoints, used for cross-device "continue playback". `save_play_queue` is
  fire-and-forget via `tokio::spawn`, same pattern as `scrobble`/`report_playback`; `ids`
  is sent as repeated `id` params, `current` is the playing track's id, and `position_ms`
  is the playback position. `get_play_queue` is async and returns
  `Option<RemotePlayQueue>` (`{ entries: Vec<Song>, current: Option<String>, position_ms:
  Option<i64>, changed_by: Option<String> }`, mapped via `map_songs()`), or `None` if the
  server has no saved queue. Called from `src/lib/playback.ts`
  (`schedulePlayQueueSave()`, debounced, on track start/pause/~30s intervals) and
  `src/App.svelte` (`checkRemotePlayQueue()` after login, surfaced via
  `ResumeQueuePrompt.svelte`).
- [`get_sonic_similar_tracks(id, count)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/subsonic.rs)
  and `find_sonic_path(start_song_id, end_song_id, count)` implement the `sonicSimilarity`
  extension's `getSonicSimilarTracks`/`findSonicPath` endpoints. Both return
  `Err("sonicSimilarity not supported")` if the extension isn't advertised, so the
  frontend can fall back to `get_similar_tracks_fallback`. The raw response's `sonicMatch`
  array (`{entry, similarity}`) is mapped via `map_similar_matches()` in
  `commands/mappers.rs` into `SimilarMatch { song, similarity }`. Only
  `get_sonic_similar_tracks` has a UI consumer (`SimilarTracksPanel.svelte`, opened from
  `PlayerBar.svelte`); `find_sonic_path` is registered but currently unused.
- [`get_similar_tracks_fallback(song_id, artist_id, genre, count)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/subsonic.rs)
  is used by `PlayerBar.svelte` when `hasSonicSimilarity` is false. It combines two
  sources, each tagged with a synthetic `similarity` so the existing UI works unchanged:
  genre matches via `getSongsByGenre` (similarity `0.55`), and similar-artist matches via
  `getArtistInfo2`'s `similarArtist[]` (Last.fm-backed, server-side) followed by
  `getTopSongs` per similar artist (similarity `0.45`). Results are deduplicated by song
  ID (via `Song::id()`, also excluding the current track), shuffled, and truncated to
  `count` (default 10). Returns `Ok(vec![])` if nothing is found rather than an error.
  Requires the new `Song.artistId` field (`mappers.rs`, populated from `artistId` in
  `map_song()`), which is also exposed to the frontend (`Song.artistId?` in
  `tauri-commands.ts`) so `PlayerBar.svelte` can pass the current track's artist ID.

## Subsonic data mappers (`commands/mappers.rs`)

`map_albums()`, `map_artists()`, `map_songs()` convert raw Subsonic JSON
(`Vec<serde_json::Value>`) into typed `Album`/`Artist`/`Song` structs (serialized to JS in
camelCase). Doing this in Rust keeps the JSON-shape-handling and release-type heuristics
out of the frontend.

- `map_album` pulls `name`/`title`, `displayArtist`/`artist`, `coverArt`, etc., and calls
  `infer_release_type()` for the `releaseType` field.
- `infer_release_type(album_json)`:
  1. If the server provides `releaseTypes[]` (OpenSubsonic extension) or a `releaseType`
     string, lowercases and returns that directly.
  2. Otherwise inspects the album title for `" - single"`/`"(single)"` or `" - ep"`/`"(ep)"`
     suffixes.
  3. Otherwise falls back to `songCount`: 1-2 tracks -> `"single"`, 3-6 -> `"ep"`, else
     `"album"`.
- `map_song` includes `format_track_info()`, which builds the "FLAC · 44.1 kHz · 16-bit ·
  1234 kbps"-style string shown in the player bar from `suffix`/`samplingRate`/
  `bitDepth`/`bitRate`.

The Android app has its own, differently-shaped release-type inference
(`ApiClient.kt::inferReleaseType()` + `AlbumListScreen.kt::effectiveType()`) - see
"Known Cross-Platform Divergences" in the root `CLAUDE.md` before changing either.

## Local library (`commands/local_library.rs`)

Scans `~/Music/Firmium` (via `local_library_dir()`, also used by `downloads.rs`) and maps
the audio files it finds into the same `Album`/`Artist`/`Song` shapes as
`commands/mappers.rs`, so the frontend's `LocalApi` (`src/lib/localApi.ts`) can be used
interchangeably with `Api` via `src/lib/dataSource.ts`.

- `walk(dir, &mut Vec<RawTrack>)` recursively collects files matching `AUDIO_EXTENSIONS`
  (`mp3`, `flac`, `ogg`, `opus`, `wav`, `m4a`, `aac`, `alac`, `aiff`). `read_track(path)`
  reads tags via the `lofty` crate, falling back to the filename/parent directory name
  for a missing title/album.
- The scan result is cached in `AppState.local_library` (`RwLock<Option<...>>`).
  `invalidate_local_library(state)` clears the cache, forcing a re-scan on next access -
  called after downloads (`commands/downloads.rs`) and imports complete.
- Local ids are `local:<md5>` (of a relative path for songs, or a lowercased
  artist/album name for artists/albums). `get_local_track_path(id)` and
  `get_local_cover_art(id)` resolve these back to filesystem paths for playback and
  cover art (the latter extracts embedded pictures via `lofty` and caches them).
- `get_local_albums`/`get_local_artists`/`get_local_album_tracks`/
  `get_local_artist_details`/`search_local`/`get_local_recent_albums`/
  `get_local_random_albums`/`get_local_newest_albums`/`get_local_genres_list` mirror the
  equivalent `subsonic.rs` commands' return shapes.
- [`import_local_files(paths)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/local_library.rs)
  is called when files/folders are dropped onto the window (`App.svelte`'s
  `onDragDropEvent` handler, via `src/lib/localApi.ts::importLocalFiles`). For each path,
  directories are walked with `walk()`; each audio file is read with `read_track()` and
  copied (via `std::fs::copy` inside `spawn_blocking`) to
  `<library>/<AlbumArtist>/<Album>/<filename>`, with `unique_dest()` appending ` (1)`,
  ` (2)`, etc. on name collisions. Returns the number of files imported and invalidates
  the scan cache if any were copied.

## Downloads (`commands/downloads.rs`)

[`download_track(song_id, format, album_artist, album, title, track_number, suffix)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/downloads.rs)
and `download_album(album_id, format)` save tracks from the connected server into
`~/Music/Firmium`, using the same folder layout as `import_local_files`:
`<AlbumArtist>/<Album>/<TrackNum> - <Title>.<ext>` (`sanitize_path_component()` strips
filesystem-unsafe characters from each component).

- Builds a `stream` request with the standard auth params plus `format` - the frontend
  passes `"raw"` for "Original" (the source file, unmodified) or `"mp3"`/`"flac"`/`"wav"`/
  `"opus"` for a server-side transcode.
- If the response `Content-Type` is `application/json` (a Subsonic error response rather
  than audio), parses the OpenSubsonic error message and returns it as an `Err` instead
  of writing a file.
- For "Original" downloads, the file extension comes from the track's `suffix` field
  (falling back to `mp3`); otherwise it's the requested format.
- Writes the file via `spawn_blocking` (`std::fs::create_dir_all` + `std::fs::write`),
  then calls `invalidate_local_library(&state)` so the new file appears in the local
  library view.
- `download_album` fetches the album's tracks via `get_album_tracks()` and calls
  `download_track` for each one in sequence.

## Audio visualizer (`visualizer.rs`)

The visualizer taps each decoded chunk inside the decode-feeder
(`audio/session.rs::spawn_decode_feeder`), just before the 25ms fade-in is
applied: `visualizer::process_chunk()` downmixes the interleaved samples to
mono (summing one sample per channel and dividing by the channel count) and
pushes them into a shared ring buffer (`VisualizerState.buffer`, capacity 4096
samples) guarded by a `parking_lot::Mutex`.

`VisualizerState` is created once in `AudioPlayer::new()` and stored as
`AudioPlayer.visualizer: Arc<VisualizerState>`. An `AtomicBool` (`enabled`)
gates both the tap (it skips pushing samples when disabled) and the analysis
task below, so the visualizer has no measurable cost when its panel is closed.

[`spawn_analysis_task(app_handle, state)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/visualizer.rs)
is spawned once via `tauri::async_runtime::spawn` and runs for the app's
lifetime. Every 50ms, while enabled, it:

- Takes the most recent 1024 samples from the ring buffer.
- Applies a Hann window and runs a forward FFT (`rustfft::FftPlanner`).
- Computes `bass` as the average magnitude of the bins below ~250Hz, normalized to 0..1.
- Groups the magnitude spectrum into 24 log-spaced `bars`, normalized to 0..1
  (`compute_bars()`).
- Emits `firmium:audio-analysis` with `{ bass, bars }`.

[`set_visualizer_enabled(enabled)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/playback.rs)
toggles `VisualizerState.enabled` (and clears the ring buffer on disable).
Called from `src/components/VisualizerPanel.svelte` when the panel opens/closes.
The frontend listens for `firmium:audio-analysis` and renders either an "orb"
(a glow/radius driven by `bass`) or a frequency-bar display (`bars[]`) on a
`<canvas>`, per `visualizerMode` in `src/lib/stores.ts`.

## See also

- [Settings & Themes Internals](/settings-themes-internals)
- [Desktop Architecture](/architecture-overview)
