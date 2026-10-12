# Error Handling Internals

This page documents how the Firmium desktop app turns backend failures into a single, consistent set of user-facing messages, and how those messages reach the screen as toasts or inline errors. For the wider backend tour, see [Desktop Architecture](/architecture-overview).

## Overview

There is one source of error wording per platform. The backend produces typed errors, never raw strings or HTTP jargon, and the conversion from a low-level failure (a `reqwest::Error`, an HTTP status, an I/O error) into a typed, user-facing error happens at the boundary where the failure occurs. The UI only ever decides how to present an error, never what it says.

## `backend/errors.rs`

The typed error is `UserError`:

```rust
pub enum UserError {
    Network,
    Timeout,
    Auth,
    SessionExpired,
    NotFound,
    Server { code: u16 },
    Storage,
    Unknown,
}
```

Each variant is a category, not a message. The wording lives in one place:

- `message(&self) -> String` is the single source of user-facing wording. Every category maps to one plain-language sentence here, so changing how an error reads is a one-line change in one function.
- `classify(s: &str) -> UserError` is a last-resort fallback that maps a legacy string error onto a `UserError` variant. It exists for older code paths that still surface a `String`, so they can be folded into the same presentation layer without being rewritten first. New code should construct a `UserError` directly rather than format a string and lean on `classify()`.

Two `From` impls do the boundary conversion:

- `From<reqwest::Error>` inspects the live error and maps it: timeouts become `Timeout`, connection failures become `Network`, and an error carrying an HTTP status becomes `Auth`, `NotFound`, or `Server { code }` depending on the status.
- `From<std::io::Error>` maps any I/O failure to `Storage` (used for the cover cache, downloads, local library, and config writes).

## Where classification happens

Network classification lives at the one place every read request passes through: `backend/commands/subsonic.rs::subsonic_request`. It now returns `Result<_, UserError>` and classifies the live `reqwest::Error` and HTTP status exactly where they are known, rather than letting a stringly-typed error escape and be guessed at later. All user-facing read commands propagate `UserError` upward from here.

The session-expiry path is special. When `subsonic_request` sees a mid-session HTTP 401, or an OpenSubsonic error code 40 or 41, it does two things:

1. Emits `BackendEvent::SessionExpired` on the event bus (`backend/events.rs`).
2. Returns `UserError::SessionExpired`.

The emitted event is what drives the app back to the login flow. The returned `UserError::SessionExpired` is carried in the failed command's result so the UI can recognize it and decline to toast it (see below).

## The toast surface (`src/lib/stores.ts`)

Failed commands reject with a `CmdError` (`src-tauri/src/commands.rs`): `{ kind, message }`, where `kind` is the `UserError` variant name (`Network`, `Timeout`, `Auth`, `SessionExpired`, ...) and `message` is `UserError::message()`. Plain `String` errors from the backend become `kind: "Unknown"`.

The UI presents them with a small toast stack:

```ts
export interface Toast { id: number; text: string }
export function toast(text: string, ms = 4000): void
export function toastError(e: unknown): void   // ignores SessionExpired
```

`toastError()` is the catch handler for most calls (`Api.x().catch(toastError)`). It skips `kind === 'SessionExpired'` because the `session-expired` event already handles that case. `components/Toasts.svelte` renders the `toasts` store as a fixed stack over the whole UI, so toasts appear above both the login modal and the shell; each toast removes itself after its timeout.

## The SessionExpired versus toast split

Initial-login auth failure and mid-session session expiry are both authentication problems, but they are handled differently on purpose.

- A failed login attempt returns a `UserError` that is shown inline under the login form (`Setup.svelte` writes `errorMessage(e)` into its error line); other failures use the toast path.
- A mid-session 401 (or OpenSubsonic 40/41) emits `BackendEvent::SessionExpired`, and that existing event flow already takes the user to the login screen. The `session-expired` Tauri event makes `stores.ts` log out and open the account modal (it also shows one explanatory toast); `toastError()` suppresses the `SessionExpired` rejection itself so the user doesn't get a second message.

The rule of thumb: if another flow already reacts visibly to the error, the toast is suppressed; otherwise the toast is the user-visible signal.

## Android

The Android app mirrors the desktop design. The key types live under `android/app/src/main/java/…/data/` and the UI surface is in `ui/components/`.

### `data/UserError.kt`

`UserError` is a sealed class with the same categories as the desktop:

```kotlin
sealed class UserError(val message: String) {
    object Network   : UserError("Could not reach the server. Check your connection.")
    object Timeout   : UserError("The request timed out. Try again.")
    object Auth      : UserError("Login failed. Check your credentials.")
    object NotFound  : UserError("That item could not be found.")
    class  Server(val code: Int) : UserError("The server returned an error ($code).")
    object Storage   : UserError("A local storage error occurred.")
    object Unknown   : UserError("Something went wrong.")
}
```

`message` is the single source of user-facing wording for each category, exactly as on desktop.

`Throwable.toUserError()` is an extension function that classifies any thrown exception into the appropriate `UserError` variant. It inspects `HttpStatusException.code` (4xx/5xx) and falls back to `Network`, `Timeout`, or `Unknown` for transport-level failures.

`HttpStatusException(val code: Int) : IOException` is thrown by `ApiClient.fetch()` for every non-2xx response, so the HTTP status is available to `toUserError()` rather than being swallowed.

`SessionExpiredException` (used by `ApiClient` when it receives OpenSubsonic error codes 40 or 41) is intentionally not handled by `toUserError()`. Session expiry is owned entirely by the `ApiClient.sessionExpired` `SharedFlow`, which drives the login dialog. It does not route through `UserError` or `ErrorBus`.

### `data/ErrorBus.kt`

`ErrorBus` holds an app-wide `MutableSharedFlow<UserError>` configured with:

- `replay = 0` (no buffering for late subscribers)
- `extraBufferCapacity = 8`
- `onBufferOverflow = DROP_OLDEST`

It is exposed as `FirmiumApplication.errors` (a property on the application singleton). Call sites report errors with `errors.tryEmit(error)` via a `report()` helper, which is non-suspending and safe to call from any context.

### UI surface: `ui/components/ErrorHost.kt`

A single long-lived collector is set up in `MainActivity` on the `app.errors.events` flow. It feeds a custom `ErrorHost` composable defined in `ui/components/ErrorHost.kt`.

Key characteristics:

- **Not Material3.** The app ships its own Compose component library and does not use Material Snackbar. `ErrorHost` is a custom composable themed via `LocalFirmiumColors`.
- **Position.** Pinned bottom-center, overlaid on the rest of the screen.
- **Auto-dismiss.** Each notification is shown for 5 seconds, then removed automatically.
- **Single-slot coalescing.** Only one notification is shown at a time. If a new error arrives while one is visible, the newest replaces it (newest wins).

### Emit policy

The policy for when to emit versus swallow follows the same rule as desktop: emit only when a user-initiated foreground action fails and there is no other inline surface to show the result.

- **ViewModels with inline error state** (`SearchViewModel`, `AuthViewModel`, `LibraryViewModel`, `DownloadManager`): set a UI-state field with `e.toUserError().message` and let the relevant screen render the message inline. These do not call `ErrorBus.report`.
- **Foreground operations with no inline surface** (`PlayerViewModel.playMoodMix`): call `ErrorBus.report(e.toUserError())` so the error reaches the user even though no composable in the current screen owns an error slot.
- **Best-effort background syncs** (`PlaylistViewModel` server-only sync operations, `RadioSeeder`, `WearStateSync`): log the exception and swallow it. These operations are advisory; a transient failure is not user-actionable.
- **Mid-session expiry**: excluded from all error surfaces. `SessionExpiredException` is handled exclusively by the `ApiClient.sessionExpired` flow and the login dialog.
