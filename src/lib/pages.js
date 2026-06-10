import indexMd from '../content/index.md?raw'
import installingMd from '../content/installing.md?raw'
import buildingMd from '../content/building-from-source.md?raw'
import usageMd from '../content/usage.md?raw'
import themesMd from '../content/custom-themes.md?raw'
import settingsMd from '../content/settings.md?raw'
import troubleshootingMd from '../content/troubleshooting.md?raw'

export const pages = [
  { path: '/', label: 'Introduction', content: indexMd },
  { path: '/installing', label: 'Installing', content: installingMd },
  { path: '/building-from-source', label: 'Building from Source', content: buildingMd },
  { path: '/usage', label: 'Usage', content: usageMd },
  { path: '/custom-themes', label: 'Custom Themes', content: themesMd },
  { path: '/settings', label: 'Settings', content: settingsMd },
  { path: '/troubleshooting', label: 'Troubleshooting', content: troubleshootingMd },
]

export function findPage(path) {
  return pages.find(p => p.path === path) ?? pages[0]
}
