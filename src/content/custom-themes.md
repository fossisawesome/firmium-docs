# Customizing Themes

Firmium ships with a number of built-in color themes, including `firmium`, `gruvbox`, `dracula`, `nord`, `tokyo-night`, the Catppuccin family, and more. You can pick one in [Settings](/settings), or create your own.

## Picking a theme

Open **Settings** and choose a theme from the Appearance section. The change applies immediately.

## Creating your own theme

Themes are simple text files in [TOML](https://toml.io/) format. To add your own:

1. Create a `themes` folder in Firmium's config directory:

   ```bash
   mkdir -p ~/.config/com.fossisawesome.firmium/themes/
   ```

2. Create a new `.toml` file in that folder, for example `my-theme.toml`.
3. Fill it in using the format below.
4. Restart Firmium (or reopen Settings) so it shows up in the theme list.

A theme with the same filename as a built-in theme will replace it.

## File format

Here's the built-in `firmium` theme as an example:

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

- `name`: the display name shown in Settings.
- `color_scheme`: either `"dark"` or `"light"`. Defaults to `"dark"`.
- `[colors]`: the colors used throughout the app.

### Color reference

| Key | Used for |
| --- | --- |
| `bg` | Main app background |
| `surface` | Cards, panels, sidebar |
| `surface2` | Nested elements like inputs and hover states |
| `border` | Borders and dividers |
| `text` | Main text color |
| `muted` | Secondary, less important text |
| `accent` | Highlights, active states, links |
| `accent_dim` | Subtle accent backgrounds, like selected rows |
| `error` | Error messages and destructive actions |
| `font` | Font family (optional) |
| `timing` | Speed of theme animations (optional) |

## Tips

- Start by copying one of the [built-in themes](https://github.com/fossisawesome/firmium/tree/main/themes) that's close to what you want, and tweak the colors from there.
- Use `rgba()` values for `border` and `accent_dim` so they blend nicely over different backgrounds.

For details on how Firmium loads and applies theme files internally, see [Settings & Themes Internals](/settings-themes-internals).
