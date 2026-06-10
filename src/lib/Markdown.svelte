<script>
  import { marked } from 'marked'
  import './markdown-setup.js'
  import { navigate } from './router.js'

  let { content } = $props()

  const html = $derived(marked.parse(content))

  let container = $state()

  function onClick(e) {
    const a = e.target.closest('a')
    if (!a) return
    const href = a.getAttribute('href')
    if (!href || /^([a-z]+:)?\/\//i.test(href) || href.startsWith('mailto:')) return
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
<div class="markdown" bind:this={container} onclick={onClick}>
  {@html html}
</div>
