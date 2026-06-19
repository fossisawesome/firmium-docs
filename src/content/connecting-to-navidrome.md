# Connecting to Navidrome

Firmium works without a server: it shows any music you've added to your local library (see [Library Basics](/library-basics)). Connecting to a music server you (or someone you trust) runs, most commonly [Navidrome](https://www.navidrome.org/), lets Firmium stream your full library from there instead. Any server that supports the OpenSubsonic API will work the same way.

## First launch

The first time you open Firmium, a short welcome tour introduces the app: connecting your own OpenSubsonic or Navidrome server (or playing local files), gapless playback and crossfade, and custom themes. Use Next to move through it, or Skip to jump ahead. The final step opens the connection screen described below.

The tour appears only once. After you have connected a server it will not show again, and Firmium opens straight to your Home screen.

## What you'll need

- The web address of your server, including the port. For example: `http://192.168.1.10:4533` or `https://music.example.com`.
- Your username and password for that server.

If you don't know these details, ask whoever set up your server, or check the server's own settings if you manage it yourself.

> If you connect over plain `http://` to a server that isn't on your local
> network (LAN/localhost), Firmium shows a warning that your credentials
> would be sent unencrypted. Use `https://` for any server reachable over the
> internet.

## Connecting

1. On first launch, finish (or skip) the welcome tour to reach the connection screen. After that, open the account popup any time: on desktop, click the account icon in the sidebar; on Android, tap the account icon at the top right of the screen.
2. Enter your server address, username, and password, then tap or click connect.

Firmium fetches your library in the background and the library views switch from your
local files to your server's library.

## Staying connected

By default, Firmium remembers your connection so you don't have to type it in every time
you open the app. This is controlled by the **Auto-Login** option (see [Settings](/settings)).

Your password is kept safe using your operating system's secure storage (the same system password manager used by your browser and other apps), not stored as plain text. On Linux this is GNOME Keyring or KWallet, and on Android it's the system's encrypted credential storage.

## Multiple servers

Firmium saves every server you connect to. On the connection screen (account popup), saved servers appear above the login form. Tap **Connect** next to a saved server to switch to it instantly, or tap the X to remove it. Each server's password is stored separately in secure storage.

Switching servers clears the current playback queue and reloads your library from the new server.

## Disconnecting

Open the same account popup and choose **Disconnect**. Firmium falls back to your local
library immediately - no restart needed.
