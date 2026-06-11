# Desktop In-depth: Sidebar & Navigation

What each control in `src/components/Sidebar.svelte` does.

## Sidebar & Navigation (`src/components/Sidebar.svelte`)

- **Server label** — shows the connected server's name/URL, read from the `authServer` store.
- **Navigation buttons** (Albums, Artists, Search, Playlists, Settings, etc.) — each calls
  `navToView(view)`, which updates the `activeView` store so `App.svelte` swaps the rendered
  view. The button for the currently active view is highlighted.
- **Disconnect** — calls `handleLogout()`, which:
  - Destroys the audio bridge (stopping any playing audio).
  - Stops position-tracking polling.
  - Clears the in-memory cover/list caches.
  - Calls `clearAuth()` to remove stored credentials and return to the login screen.

## See also

- [How it Works](/desktop-indepth-overview)
- [Library Views](/desktop-indepth-library-views)
- [Settings](/desktop-indepth-settings)
