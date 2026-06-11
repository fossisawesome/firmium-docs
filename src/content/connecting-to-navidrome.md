# Connecting to Navidrome

Firmium doesn't store any music itself. Instead, it connects to a music server you (or someone you trust) runs, most commonly [Navidrome](https://www.navidrome.org/), and streams your music from there. Any server that supports the OpenSubsonic API will work the same way.

## What you'll need

- The web address of your server, including the port. For example: `http://192.168.1.10:4533` or `https://music.example.com`.
- Your username and password for that server.

If you don't know these details, ask whoever set up your server, or check the server's own settings if you manage it yourself.

> If you connect over plain `http://` to a server that isn't on your local
> network (LAN/localhost), Firmium shows a warning that your credentials
> would be sent unencrypted. Use `https://` for any server reachable over the
> internet.

## Logging in

1. Open Firmium.
2. Enter your server address, username, and password.
3. Tap or click connect.

That's it. Firmium will fetch your library and take you to the Home screen.

## Staying logged in

By default, Firmium remembers your login so you don't have to type it in every time you open the app. This is controlled by the **Auto-Login** option (see [Settings](/settings)).

Your password is kept safe using your operating system's secure storage (the same system password manager used by your browser and other apps), not stored as plain text. On Linux this is GNOME Keyring or KWallet, and on Android it's the system's encrypted credential storage.

If you ever switch servers or accounts, just log out and sign in again with the new details.
