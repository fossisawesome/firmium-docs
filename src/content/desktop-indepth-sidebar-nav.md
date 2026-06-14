# Desktop In-depth: Sidebar & Navigation

What each control in `src/components/Sidebar.svelte` does.

## Sidebar & Navigation (`src/components/Sidebar.svelte`)

- **Server label** — shows the connected server's hostname (from the `authServer` store),
  or "Local Files" when `isAuthed` is false.
- **Navigation buttons** (Albums, Artists, Search, Playlists, Settings, etc.) — each calls
  `navToView(view)`, which updates the `activeView` store so `App.svelte` swaps the rendered
  view. The button for the currently active view is highlighted.
- **Account icon** — calls `openAccountModal()`, opening `AccountModal.svelte`
  (`showAccountModal` store) as an overlay over the current view:
  - If connected, shows the server hostname and a **Disconnect** button
    (`handleDisconnect()` in `AccountModal.svelte`): destroys the audio bridge, stops
    position-tracking polling, clears the in-memory cover/list caches, and calls
    `clearAuth()`. The app falls back to the local library view without a restart.
  - If not connected, shows the connect form (`Setup.svelte`: server URL, username,
    password, save-password checkbox), calling `doConnect()` from `App.svelte` on submit.

## See also

- [How it Works](/desktop-indepth-overview)
- [Library Views](/desktop-indepth-library-views)
- [Settings](/desktop-indepth-settings)
