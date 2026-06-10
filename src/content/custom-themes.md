# Custom Themes

Firmium ships with a number of built-in themes (e.g. `firmium`, `gruvbox`, `dracula`, `nord`, `tokyo-night`, the Catppuccin family, and more), defined as `.toml` files in [`themes/`](https://github.com/fossisawesome/firmium/tree/main/themes). You can add your own by dropping a `.toml` file in your user config directory.

## Where to Put Custom Themes

On Linux, Firmium reads user themes from its app config directory (based on the app identifier `com.fossisawesome.firmium`, under the XDG config dir). You'll need to create the `themes` subdirectory first:

```bash
mkdir -p ~/.config/com.fossisawesome.firmium/themes/
```

Then place your custom `.toml` theme files in that directory. Any custom theme with the same filename (id) as a built-in theme will override it.

## File Format

A theme file has a `name`, an optional `color_scheme` (`"dark"` or `"light"`, defaults to `"dark"`), and a `[colors]` table. Here's the built-in `firmium` theme as an example:

```toml
name = "Firmium"
color_scheme = "dark"

[colors]
bg = "#0f0f0f"
surface = "#1a1a1a"
surface2 = "#242424"
border = "rgba(255,255,255,0.08)"
text = "#f0f0f0"
muted = "#888"
accent = "#e8c97e"
accent_dim = "rgba(232,201,126,0.15)"
error = "#e06060"
font = "'Courier New', monospace"
timing = "0.15s"
```

### Color Reference

| Key | Used for |
| --- | --- |
| `bg` | Main app background |
| `surface` | Cards, panels, sidebar |
| `surface2` | Nested/secondary surfaces (e.g. inputs, hover states) |
| `border` | Borders and dividers |
| `text` | Primary text color |
| `muted` | Secondary/muted text |
| `accent` | Highlights, active states, links |
| `accent_dim` | Subtle accent backgrounds (e.g. selected rows) |
| `error` | Error states and destructive actions |
| `font` | Font family (optional, defaults to `'Courier New', monospace`) |
| `timing` | Transition duration for theme-aware animations (optional, defaults to `0.15s`) |

## How Themes Are Applied

- The filename (without `.toml`) becomes the theme's `id`, used in `localStorage` and shown in [Settings → Appearance](/settings#appearance).
- On the frontend, `applyThemeData()` in [`src/App.svelte`](https://github.com/fossisawesome/firmium/blob/main/src/App.svelte) sets each color as a CSS custom property on `:root` (`--bg`, `--surface`, `--accent`, etc.), plus `color-scheme`, `--font`, and `--timing`.
- The `list_themes` Tauri command ([`src-tauri/src/lib.rs`](https://github.com/fossisawesome/firmium/blob/main/src-tauri/src/lib.rs)) merges your user themes directory with the bundled themes and returns the combined list to the frontend.

## Tips

- Start by copying an existing theme from [`themes/`](https://github.com/fossisawesome/firmium/tree/main/themes) that's close to what you want and tweak the colors.
- Restart Firmium (or reopen Settings) after adding a new theme file so it appears in the theme list.
- Use `rgba()` for `border` and `accent_dim` if you want them to blend with different backgrounds.
