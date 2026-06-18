<script>
  import { marked } from 'marked'
  import DOMPurify from 'dompurify'
  import './markdown-setup.js'
  import { navigate } from './router.js'

  let { content } = $props()

  const html = $derived(DOMPurify.sanitize(marked.parse(content)))

  function onClick(e) {
    const a = e.target.closest('a')
    if (!a) return
    const href = a.getAttribute('href')
    if (!href || href.startsWith('#')) return
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return
    // Internal link — handle with the router instead of a full page load.
    e.preventDefault()
    const [path, hash] = href.split('#')
    navigate(path || '/')
    if (hash) {
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView()
      })
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="markdown" onclick={onClick}>
  {@html html}
</div>
