# Desktop In-depth: Sidebar & Navigation

The sidebar, view routing and the account modal.

## Routing (`src/lib/stores.ts`)

View state is the only navigation state: `activeView` (`{ type, id? }`) plus a small history stack. `navTo(type, id?)` pushes the current view and sets the new one; `navBack()` pops. `App.svelte` renders the matching view inside `{#key}` so each navigation remounts it and refetches. View types: `home`, `favorites`, `albums`, `artists`, `search`, `playlists`, `genres`, `mix`, `podcasts`, `settings`, and the detail types `album`, `artist`, `playlist`, `podcast`, `genre`.

## Sidebar (`components/Sidebar.svelte`)

- **Nav buttons**: Home, Favorites, Albums, Artists, Playlists, Podcasts, Search, Mix, Settings. A detail view highlights its parent (`PARENT` map), e.g. `album` highlights Albums.
- **Server label**: the connected hostname, or "Local Files" when logged out (offline library).
- **Account button**: sets `showAccountModal`.
- **Spotify UI theme**: when `settings.uiThemeId === 'spotify'` the sidebar also lists local playlists under "Your Library" (`loadPlaylists`). Styling comes from `styles/_spotify.scss`, scoped by `html[data-ui-theme='spotify']`.
- **Responsive**: `App.svelte` toggles `sidebar-collapsed` (icons only, under 900px) and `is-mobile-layout` (bottom tab bar, under 640px) on `<html>` via `matchMedia`.

## Account modal (`AccountModal.svelte`, `Setup.svelte`)

- Logged in: shows `user@host`, other saved accounts with a **Switch** button (`Api.switchAccount`), and **Disconnect** (`Api.logout`).
- Logged out: the connect form (`Setup.svelte`) with saved accounts, server URL, username, password and a Save Password checkbox. `Api.connect` validates the credentials; on success `Core::connect` saves the password to the keyring (when asked), remembers the account in `config.toml`, and returns the new `AuthState`.
- `setAuthState()` updates the `auth` store, refreshes `serverExtensions` and bumps `dataVersion` so views refetch.
- Startup: `Api.autoLogin()` reads the last account's password from the keyring and connects. A switch to an account whose password is no longer stored fails with `Auth`, and the form is prefilled instead.

## See also

- [How it Works](/desktop-indepth-overview)
- [Library Views](/desktop-indepth-library-views)
- [Settings](/desktop-indepth-settings)
