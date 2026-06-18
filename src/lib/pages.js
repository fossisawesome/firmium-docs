import overviewMd from '../content/overview.md?raw'
import installingMd from '../content/installing.md?raw'
import connectingMd from '../content/connecting-to-navidrome.md?raw'
import libraryBasicsMd from '../content/library-basics.md?raw'
import queuePlaybackMd from '../content/queue-playback.md?raw'
import playlistsMd from '../content/playlists.md?raw'
import lyricsArtistBiosMd from '../content/lyrics-artist-bios.md?raw'
import themesMd from '../content/custom-themes.md?raw'
import androidAutoMd from '../content/android-auto.md?raw'
import wearosMd from '../content/wearos.md?raw'
import settingsMd from '../content/settings.md?raw'
import troubleshootingMd from '../content/troubleshooting.md?raw'
import developerOverviewMd from '../content/developer-overview.md?raw'
import architectureMd from '../content/architecture-overview.md?raw'
import buildingMd from '../content/building-from-source.md?raw'
import settingsThemesInternalsMd from '../content/settings-themes-internals.md?raw'
import desktopBackendInternalsMd from '../content/desktop-backend-internals.md?raw'
import desktopIndepthOverviewMd from '../content/desktop-indepth-overview.md?raw'
import desktopIndepthPlayerBarMd from '../content/desktop-indepth-player-bar.md?raw'
import desktopIndepthSidebarNavMd from '../content/desktop-indepth-sidebar-nav.md?raw'
import desktopIndepthLibraryViewsMd from '../content/desktop-indepth-library-views.md?raw'
import desktopIndepthPlaylistsMd from '../content/desktop-indepth-playlists.md?raw'
import desktopIndepthSettingsMd from '../content/desktop-indepth-settings.md?raw'
import androidArchitectureMd from '../content/android-architecture.md?raw'
import androidInternalsMd from '../content/android-internals.md?raw'
import androidIndepthOverviewMd from '../content/android-indepth-overview.md?raw'
import androidIndepthPlayerMd from '../content/android-indepth-player.md?raw'
import androidIndepthLibraryNavMd from '../content/android-indepth-library-nav.md?raw'
import androidIndepthQueueLyricsMd from '../content/android-indepth-queue-lyrics.md?raw'
import androidIndepthPlaylistsMd from '../content/android-indepth-playlists.md?raw'
import androidIndepthSettingsMd from '../content/android-indepth-settings.md?raw'

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
      { path: '/android-auto', label: 'Android Auto', content: androidAutoMd },
      { path: '/wearos', label: 'Wear OS', content: wearosMd },
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
      { path: '/developer-overview', label: 'Developer Overview', content: developerOverviewMd },
    ],
    subcategories: [
      {
        name: 'Desktop',
        pages: [
          { path: '/architecture-overview', label: 'Desktop Architecture', content: architectureMd },
          { path: '/building-from-source', label: 'Building from Source', content: buildingMd },
          { path: '/settings-themes-internals', label: 'Settings & Themes Internals', content: settingsThemesInternalsMd },
          { path: '/desktop-backend-internals', label: 'Backend Internals', content: desktopBackendInternalsMd },
        ],
        subcategories: [
          {
            name: 'In-depth',
            pages: [
              { path: '/desktop-indepth-overview', label: 'How it Works', content: desktopIndepthOverviewMd },
              { path: '/desktop-indepth-player-bar', label: 'Player Bar', content: desktopIndepthPlayerBarMd },
              { path: '/desktop-indepth-sidebar-nav', label: 'Sidebar & Navigation', content: desktopIndepthSidebarNavMd },
              { path: '/desktop-indepth-library-views', label: 'Library Views', content: desktopIndepthLibraryViewsMd },
              { path: '/desktop-indepth-playlists', label: 'Playlists', content: desktopIndepthPlaylistsMd },
              { path: '/desktop-indepth-settings', label: 'Settings', content: desktopIndepthSettingsMd },
            ],
          },
        ],
      },
      {
        name: 'Android',
        pages: [
          { path: '/android-architecture', label: 'Android Architecture', content: androidArchitectureMd },
          { path: '/android-internals', label: 'Android Internals', content: androidInternalsMd },
          { path: '/building-from-source', label: 'Building from Source', content: buildingMd },
        ],
        subcategories: [
          {
            name: 'In-depth',
            pages: [
              { path: '/android-indepth-overview', label: 'How it Works', content: androidIndepthOverviewMd },
              { path: '/android-indepth-player', label: 'Player Bar & Full Screen Player', content: androidIndepthPlayerMd },
              { path: '/android-indepth-library-nav', label: 'Library & Navigation', content: androidIndepthLibraryNavMd },
              { path: '/android-indepth-queue-lyrics', label: 'Queue & Lyrics', content: androidIndepthQueueLyricsMd },
              { path: '/android-indepth-playlists', label: 'Playlists', content: androidIndepthPlaylistsMd },
              { path: '/android-indepth-settings', label: 'Settings', content: androidIndepthSettingsMd },
            ],
          },
        ],
      },
    ],
  },
]

function collectPages(group) {
  const own = group.pages ?? []
  const nested = (group.subcategories ?? []).flatMap(collectPages)
  return [...own, ...nested]
}

const allPagesWithDuplicates = categories.flatMap(collectPages)

export const pages = allPagesWithDuplicates.filter(
  (page, i) => allPagesWithDuplicates.findIndex(p => p.path === page.path) === i
)

export function findPage(path) {
  return pages.find(p => p.path === path) ?? pages[0]
}
