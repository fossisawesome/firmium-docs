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
- [`get_sonic_similar_tracks(id, count)`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/commands/subsonic.rs)
  and `find_sonic_path(start_song_id, end_song_id, count)` implement the `sonicSimilarity`
  extension's `getSonicSimilarTracks`/`findSonicPath` endpoints. Both return
  `Err("sonicSimilarity not supported")` if the extension isn't advertised, so the
  frontend can hide the UI. The raw response's `sonicMatch` array (`{entry, similarity}`)
  is mapped via `map_similar_matches()` in `commands/mappers.rs` into `SimilarMatch { song,
  similarity }`. Only `get_sonic_similar_tracks` has a UI consumer
  (`SimilarTracksPanel.svelte`, opened from `PlayerBar.svelte`); `find_sonic_path` is
  registered but currently unused.

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

## See also

- [Settings & Themes Internals](/settings-themes-internals)
- [Desktop Architecture](/architecture-overview)
