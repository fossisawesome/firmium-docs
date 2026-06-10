# Settings

The Settings view ([`src/views/Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte)) is organized into five categories: **Appearance**, **Playback**, **Services**, **Account**, and **Debug**.

Most settings persist to `localStorage` via `SafeStorage` (in [`src/lib/utils.js`](https://github.com/fossisawesome/firmium/blob/main/src/lib/utils.js)) under keys prefixed `firmium_*`. A few sensitive values (Last.fm credentials) are stored in the OS keyring via `Keyring` ([`src/lib/api.js`](https://github.com/fossisawesome/firmium/blob/main/src/lib/api.js)).

## Appearance

### Window Decorations

Show or hide the native title bar and window borders.

- **Storage**: `localStorage` key `firmium_decorations` (`"true"`/`"false"`, defaults to shown)
- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) calls `onapplyDecorations()`, which is `applyDecorations()` in [`src/App.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/App.svelte) — it calls Tauri's `getCurrentWindow().setDecorations(show)`.

### Theme

Choose the interface color scheme from the available built-in and custom themes.

- **Storage**: `localStorage` key `firmium_theme` (theme id, defaults to `"firmium"`)
- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) calls `onapplyTheme()`, which is `applyThemeById()` in [`src/App.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/App.svelte). Themes are loaded via the `list_themes` Tauri command ([`src-tauri/src/lib.rs`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/lib.rs)). Colors are applied as CSS custom properties by `applyThemeData()`. See [Custom Themes](/custom-themes) for the file format.

## Playback

### Crossfade

Smoothly blend the end of one track into the start of the next.

- **Storage**: `localStorage` key `firmium_crossfade` (`"true"`/`"false"`, defaults to enabled)
- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) calls `setCrossfadeEnabled()` ([`src/lib/stores.js`](https://github.com/fossisawesome/firmium/blob/main/src/lib/stores.js)), which updates the `crossfadeEnabled` store. Enabling Crossfade disables Gapless Playback (mutually exclusive). Used by [`src/lib/playback.js`](https://github.com/fossisawesome/firmium/blob/main/src/lib/playback.js) to trigger `crossfadeToNext()`.

### Crossfade Duration

Length of the crossfade blend, in seconds (1–12). Only shown when Crossfade is enabled.

- **Storage**: `localStorage` key `firmium_crossfade_duration` (defaults to `5`, clamped to 1–12)
- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) calls `setCrossfadeDuration()` ([`src/lib/stores.js`](https://github.com/fossisawesome/firmium/blob/main/src/lib/stores.js)), updating the `crossfadeDuration` store. Passed to the Tauri `crossfade_to()` command ([`src-tauri/src/lib.rs`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/lib.rs)) as `fade_duration_ms = duration * 1000`.

### Gapless Playback

Pre-buffer the next track so there's no pause between songs.

- **Storage**: `localStorage` key `firmium_gapless` (`"true"`/`"false"`, defaults to enabled)
- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) calls `setGaplessEnabled()` ([`src/lib/stores.js`](https://github.com/fossisawesome/firmium/blob/main/src/lib/stores.js)), updating the `gaplessEnabled` store. Enabling Gapless disables Crossfade (mutually exclusive). [`src/lib/playback.js`](https://github.com/fossisawesome/firmium/blob/main/src/lib/playback.js) checks this store; on track end, if gapless is enabled and crossfade isn't, it calls `preload_stream()` then `play_stream()`.

## Services

### Last.fm Integration

Fetch artist biography and photo directly from Last.fm using your own API key.

- **Storage**: `localStorage` key `firmium_lastfm` (`"true"`/`"false"`, defaults to disabled)
- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte). When enabled, reveals the API Key and Secret fields below.

### Last.fm API Key / Last.fm Secret

Your personal Last.fm API credentials, used for artist biography/photo lookups.

- **Storage**: OS keyring, keys `lastfm_api_key` and `lastfm_secret`
- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) calls `Keyring.save('lastfm_api_key', ...)` / `Keyring.save('lastfm_secret', ...)` (defined in [`src/lib/api.js`](https://github.com/fossisawesome/firmium/blob/main/src/lib/api.js)). Loaded on mount via `Keyring.load(...)`.

### External Lyrics (LRCLIB)

Fetch synced lyrics from [lrclib.net](https://lrclib.net/) when your server has none. Sends the song title and artist name.

- **Storage**: `localStorage` key `firmium_lrclib` (`"true"`/`"false"`, defaults to enabled)
- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte). Checked in [`src/lib/lyrics.js`](https://github.com/fossisawesome/firmium/blob/main/src/lib/lyrics.js) before falling back to the LRCLIB API.

## Account

### Auto-Login

Automatically connect on startup when credentials are saved.

- **Storage**: `localStorage` key `firmium_auto_login` (`"true"`/`"false"`, defaults to enabled)
- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte). Read on mount in [`src/App.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/App.svelte) — if enabled and a password is saved (`firmium_save_pass`), it loads the password from the keyring and calls `doConnect()`.

## Debug

### App Version

Read-only display of the running app version.

- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) calls the `get_app_version()` Tauri command ([`src-tauri/src/lib.rs`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/lib.rs)), which returns `env!("CARGO_PKG_VERSION")`.

### Log File

Read-only display of the path to the app's log file.

- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) calls the `get_log_path()` Tauri command ([`src-tauri/src/lib.rs`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/lib.rs)), which returns `{app_data_dir}/app-logs.txt`.

### Wipe Cache

Clears the in-memory cover art cache (does not affect anything on disk or your server).

- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) calls `clearAll()` from [`src/lib/coverCache.js`](https://github.com/fossisawesome/firmium/blob/main/src/lib/coverCache.js).

### Delete Logs

Removes `app-logs.txt` from disk.

- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) calls the `delete_logs()` Tauri command ([`src-tauri/src/lib.rs`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/lib.rs)).

### Delete User Settings

Resets all preferences to defaults by clearing every `firmium_*` key from `localStorage`:

```
firmium_server, firmium_user, firmium_save_pass, firmium_auto_login,
firmium_lrclib, firmium_theme, firmium_decorations, firmium_crossfade,
firmium_crossfade_duration, firmium_volume, firmium_gapless, firmium_lastfm
```

- **Code**: [`Settings.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/views/Settings.svelte) loops over the `SETTINGS_KEYS` array and calls `SafeStorage.removeItem(k)` for each.
