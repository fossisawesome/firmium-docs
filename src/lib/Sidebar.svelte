<script>
  import { pages } from './pages.js'
  import { currentPath, navigate } from './router.js'

  let { open = false, onclose } = $props()

  let query = $state('')

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pages
    return pages.filter(page =>
      page.label.toLowerCase().includes(q) || page.content.toLowerCase().includes(q)
    )
  })

  function go(path) {
    navigate(path)
    onclose?.()
  }
</script>

<nav class="sidebar" class:open>
  <div class="sidebar-header">
    <span class="sidebar-logo">⬡</span>
    <span class="sidebar-title">Firmium</span>
  </div>
  <div class="sidebar-search">
    <input type="search" placeholder="Search docs..." bind:value={query} aria-label="Search docs" />
  </div>
  <ul class="sidebar-nav">
    {#each filtered as page (page.path)}
      <li>
        <a
          href={page.path}
          class:active={$currentPath === page.path}
          onclick={(e) => { e.preventDefault(); go(page.path) }}
        >
          {page.label}
        </a>
      </li>
    {/each}
    {#if filtered.length === 0}
      <li class="no-results">No matches</li>
    {/if}
  </ul>
  <div class="sidebar-footer">
    <a href="https://github.com/fossisawesome/firmium" target="_blank" rel="noreferrer">GitHub</a>
  </div>
</nav>

{#if open}
  <button class="sidebar-backdrop" aria-label="Close navigation" onclick={onclose}></button>
{/if}
