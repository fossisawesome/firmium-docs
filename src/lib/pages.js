import overviewMd from '../content/overview.md?raw'
import installingMd from '../content/installing.md?raw'
import connectingMd from '../content/connecting-to-navidrome.md?raw'
import libraryBasicsMd from '../content/library-basics.md?raw'
import queuePlaybackMd from '../content/queue-playback.md?raw'
import playlistsMd from '../content/playlists.md?raw'
import lyricsArtistBiosMd from '../content/lyrics-artist-bios.md?raw'
import themesMd from '../content/custom-themes.md?raw'
import settingsMd from '../content/settings.md?raw'
import troubleshootingMd from '../content/troubleshooting.md?raw'
import architectureMd from '../content/architecture-overview.md?raw'
import buildingMd from '../content/building-from-source.md?raw'
import settingsThemesInternalsMd from '../content/settings-themes-internals.md?raw'

export const categories = [
  {
    name: null,
    pages: [
      { path: '/overview', label: 'Overview', content: overviewMd },
    ],
  },
  {
    name: 'Getting Started',
    pages: [
      { path: '/installing', label: 'Installation', content: installingMd },
      { path: '/connecting-to-navidrome', label: 'Connecting to Navidrome', content: connectingMd },
    ],
  },
  {
    name: 'Library',
    pages: [
      { path: '/library-basics', label: 'Library Basics', content: libraryBasicsMd },
      { path: '/queue-playback', label: 'Queue & Playback', content: queuePlaybackMd },
      { path: '/playlists', label: 'Playlists', content: playlistsMd },
      { path: '/lyrics-artist-bios', label: 'Lyrics & Artist Bios', content: lyricsArtistBiosMd },
    ],
  },
  {
    name: 'Guides',
    pages: [
      { path: '/custom-themes', label: 'Customizing Themes', content: themesMd },
      { path: '/settings', label: 'Settings', content: settingsMd },
    ],
  },
  {
    name: 'Reference',
    pages: [
      { path: '/troubleshooting', label: 'Troubleshooting', content: troubleshootingMd },
    ],
  },
  {
    name: 'Developer',
    pages: [
      { path: '/architecture-overview', label: 'Architecture Overview', content: architectureMd },
      { path: '/building-from-source', label: 'Building from Source', content: buildingMd },
      { path: '/settings-themes-internals', label: 'Settings & Themes Internals', content: settingsThemesInternalsMd },
    ],
  },
]

export const pages = categories.flatMap(c => c.pages)

export function findPage(path) {
  return pages.find(p => p.path === path) ?? pages[0]
}
