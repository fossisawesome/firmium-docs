# Desktop In-depth: Sidebar & Navigation

What each control in the sidebar (`App::shell` in `src/app.rs`) does.

## Sidebar & Navigation (`App::shell`)

- **Account icon** — calls `Message::ToggleAccountSwitcher`, opening `account_switcher_overlay`
  as a modal `stack` over the current view (see below). There's no separate server-name label
  in the sidebar itself; the connected server is shown inside that overlay.
- **Navigation buttons** (`nav_button`) — one per `View`: Home, Albums, Artists, Playlists,
  Search, Mix, Settings. Each calls `Message::Navigate(target)`, which updates `self.view` so
  `App::view` swaps the rendered content (`content_view`). The button for the currently active
  view is highlighted (accent color, bold label, `Message` comparison via `self.view == target`).

## Account switcher overlay (`account_switcher_overlay`)

- If connected (`self.authed`), shows the server hostname (stripped of the `http(s)://`
  scheme, read from `AppState.connection`) and a **Disconnect** button (`Message::Logout`):
  clears the connection (`commands::subsonic::set_connection(state, None, None, None)`),
  clears in-memory albums/search results, and reopens the account switcher so you land back on
  the connect form. The app doesn't fall back to a local-library view automatically — see
  [Library Views](/desktop-indepth-library-views) for the (currently nav-unreachable) offline
  browsing code.
- If not connected, shows the connect form: server URL, username, password, a **Save
  Password** checkbox, and **Connect** (`Message::Connect`), which saves credentials to the OS
  keyring (when the checkbox is on) and calls `commands::subsonic::set_connection`.

## See also

- [How it Works](/desktop-indepth-overview)
- [Library Views](/desktop-indepth-library-views)
- [Settings](/desktop-indepth-settings)
