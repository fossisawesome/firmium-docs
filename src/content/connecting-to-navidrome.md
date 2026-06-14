# Connecting to Navidrome

Firmium works without a server: it opens straight to your Home screen, showing any music you've added to your local library (see [Library Basics](/library-basics)). Connecting to a music server you (or someone you trust) runs, most commonly [Navidrome](https://www.navidrome.org/), lets Firmium stream your full library from there instead. Any server that supports the OpenSubsonic API will work the same way.

## What you'll need

- The web address of your server, including the port. For example: `http://192.168.1.10:4533` or `https://music.example.com`.
- Your username and password for that server.

If you don't know these details, ask whoever set up your server, or check the server's own settings if you manage it yourself.

> If you connect over plain `http://` to a server that isn't on your local
> network (LAN/localhost), Firmium shows a warning that your credentials
> would be sent unencrypted. Use `https://` for any server reachable over the
> internet.

## Connecting

1. Open Firmium - you'll land on the Home screen right away, even without a server.
2. Open the account popup: on desktop, click the account icon in the sidebar; on
   Android, tap the account icon at the top right of the screen.
3. Enter your server address, username, and password, then tap or click connect.

Firmium fetches your library in the background and the library views switch from your
local files to your server's library.

## Staying connected

By default, Firmium remembers your connection so you don't have to type it in every time
you open the app. This is controlled by the **Auto-Login** option (see [Settings](/settings)).

Your password is kept safe using your operating system's secure storage (the same system password manager used by your browser and other apps), not stored as plain text. On Linux this is GNOME Keyring or KWallet, and on Android it's the system's encrypted credential storage.

## Disconnecting

Open the same account popup and choose **Disconnect**. Firmium falls back to your local
library immediately - no restart needed. If you switch to a different server or account,
just disconnect and connect again with the new details.
