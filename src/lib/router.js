import { writable } from 'svelte/store'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

function normalize(pathname) {
  let path = pathname
  if (base && path.startsWith(base)) path = path.slice(base.length)
  if (!path) path = '/'
  return path
}

export const currentPath = writable(normalize(window.location.pathname))

window.addEventListener('popstate', () => {
  currentPath.set(normalize(window.location.pathname))
})

export function navigate(path) {
  const url = base + path
  window.history.pushState({}, '', url)
  currentPath.set(normalize(path))
  window.scrollTo(0, 0)
}
