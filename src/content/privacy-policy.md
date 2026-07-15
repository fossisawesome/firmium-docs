# Privacy Policy

_Last updated: 2026-07-14_

Firmium is a local-first music and podcast player. This applies to the desktop app, Android app, Wear OS companion, and Termium.

Firmium is developed by an individual maintainer, not a registered company. This policy has no designated governing-law jurisdiction — if you need one for compliance purposes, get in touch to discuss.

## Summary

- No analytics, telemetry, ads, or crash reporting.
- No account or sign-up required.
- Your library, history, and settings stay on your device (or your media server) unless a feature below sends a request elsewhere.
- Nothing is collected centrally, so there's nothing to sell or share.

## What's stored locally

- Library metadata (from your local files or media server)
- Playback queue, history, and listening stats (powers Recap)
- Playlists
- Settings and themes
- Cached cover art and lyrics
- Downloaded podcast episodes and tracks

This never leaves your device on its own — Firmium has no backend servers collecting it.

## Network requests

Firmium works offline by default. It only reaches the network when you use a feature that needs it:

| Feature | Service | What's sent |
|---|---|---|
| Connecting to a media server | Your Navidrome/Subsonic server | Your credentials and library requests |
| Lyrics | [lrclib.net](https://lrclib.net) | Track title/artist/duration |
| Similar tracks & artist bios | [ws.audioscrobbler.com](https://ws.audioscrobbler.com) (Last.fm) | Track/artist metadata |
| Scrobbling (opt-in, off by default) | [api.listenbrainz.org](https://api.listenbrainz.org) | Your ListenBrainz token and play history |
| Podcasts | The feed's own RSS host | Feed fetch requests |
| Update checks | [github.com](https://github.com) | Anonymous request for latest release info |

Requests only include the metadata each lookup needs (e.g. track/artist name) — not your whole library. Credentials you enter (media server login, ListenBrainz token) live on your device and go only to that service.

## Data retention

Locally stored data (library metadata, history, cache, downloads) stays on your device until you delete it — uninstall, clear app data, or use in-app clear/reset options. Firmium sets no automatic expiry. Data sent to a third-party service (your media server, ListenBrainz, Last.fm) is retained per that service's own policy, not Firmium's.

## Your rights (GDPR / CCPA / similar)

Firmium holds no personal data on any server, so there's nothing for the developer to export, correct, or delete on your behalf — everything above lives on your device, under your control (delete via app settings, clear app data, or uninstall).

If you're in the EU/UK, California, or another jurisdiction with statutory data-subject rights (access, correction, deletion, portability, opt-out of sale — noting Firmium sells nothing), those rights apply against the third-party services you choose to connect (your media server operator, ListenBrainz, Last.fm, a podcast host), not against Firmium. Contact those services directly for requests about data you sent them.

If Firmium's local-only design seems inaccurate for some feature, or you want to raise a rights request anyway, use the contact below — handled best-effort.

## Android permissions

- `INTERNET` — for the requests above
- `READ_MEDIA_AUDIO` / `READ_EXTERNAL_STORAGE` — to read your local music
- `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` — background playback
- `POST_NOTIFICATIONS` — playback notification

None collect or transmit data beyond what's listed above.

## Third-party services

Connecting Firmium to your own Subsonic/Navidrome server, ListenBrainz, Last.fm, or a podcast host means that service's own privacy policy applies to data sent to it. Firmium doesn't control third-party data handling.

## Children's privacy

Firmium isn't directed at children and doesn't knowingly collect personal information from anyone, including children under 13 (COPPA) or 16 (GDPR) — the app collects no data by default and needs no account or profile to use. If a parent or guardian believes a child provided personal information through a connected third-party service (e.g. entered credentials into a media server), raise that with the operator of that service.

## App store data safety disclosures

For Google Play's Data Safety form and Apple's App Privacy (nutrition label): Firmium collects no data, shares none with the developer or any analytics/advertising SDK, and links none to user identity on any Firmium-operated system. Data entered for third-party integrations (server credentials, ListenBrainz token) is stored locally and sent only to the service it configures, per the table above. Kept in sync with this policy on each store submission.

## Changes

Material changes to Firmium's data practices get reflected here and in the repo's `PRIVACY.md` with an updated date at the top. Continued use after a change means acceptance of the revised policy. Check back if you have ongoing concerns.

## Contact

Privacy questions or rights requests: Discord `me.kt`, or open an issue on the [GitHub repository](https://github.com). Best-effort response — individual maintainer, no dedicated legal/support team.
