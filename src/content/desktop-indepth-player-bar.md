# Desktop In-depth: Player Bar

What each control in `App::player_bar` (`src/app.rs`) does. For the data flow behind
playback, see [How it Works](/desktop-indepth-overview).

## Player Bar (`App::player_bar` in `src/app.rs`)

- **Album art / track title** — shows the current track's cover and title (or "No track
  selected"), read from the queue (`self.queue`, `self.queue_idx`).
- **Volume slider** — an `iced::widget::slider` bound to `Message::SetVolume`, which updates
  `self.volume` and calls `commands::queue::set_queue_volume` to change playback volume
  immediately.
- **Seek bar** — an `iced::widget::slider` over `0.0..=duration`, bound to
  `Message::SeekTo`, which calls `commands::queue::seek_queue` to jump to that position in
  the stream. Position/duration come from `BackendEvent::PlaybackPosition` events on the
  `EventBus`, not polling.
- **Previous** (`Message::Prev`) — calls `commands::queue::queue_prev`.
- **Play/Pause** (`Message::TogglePlay`) — toggles playback via the queue commands.
- **Next** (`Message::Next`) — advances to the next queue item.
- **Repeat** (`Message::CycleRepeat`) — cycles Off → Repeat All → Repeat One
  (`commands::queue::set_repeat_mode`); the icon is accented when either mode is active.
- **Lyrics** (`Message::TogglePanel(Panel::Lyrics)`) — opens `App::lyrics_panel`, which calls
  `commands::subsonic::get_song_lyrics` (structured → legacy → LRCLIB cascade) for the current
  track and highlights the active line if the lyrics are time-synced.
- **Queue** (`Message::TogglePanel(Panel::Queue)`) — opens `App::queue_panel`, listing
  upcoming tracks.
- **Visualizer** (`Message::TogglePanel(Panel::Visualizer)`) — opens `App::viz_panel`, an
  `iced::widget::canvas` (`src/viz.rs`) reading the latest FFT snapshot computed in-process;
  no IPC channel involved, since UI and audio engine share the same process. Mode buttons
  switch between Bars / Lines / Scope (`Message::SetVizMode`).

There's no Shuffle toggle in the player bar itself — shuffling a queue is started from an
album's own **Shuffle** button (see [Library Views](/desktop-indepth-library-views)). The
audio-stats and similar-tracks panels (`App::audio_stats_panel`, `App::similar_panel`) also
exist in the code but currently have no button anywhere that opens them.

## See also

- [How it Works](/desktop-indepth-overview)
- [Sidebar & Navigation](/desktop-indepth-sidebar-nav)
- [Settings](/desktop-indepth-settings)
