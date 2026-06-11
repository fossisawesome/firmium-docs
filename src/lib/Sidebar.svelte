<script>
  import { categories, pages } from './pages.js'
  import { currentPath, navigate } from './router.js'

  let { open = false, onclose } = $props()

  let query = $state('')

  const filteredCategories = $derived.by(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categories
    return categories
      .map(cat => ({
        ...cat,
        pages: cat.pages.filter(page =>
          page.label.toLowerCase().includes(q) || page.content.toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.pages.length > 0)
  })

  const hasResults = $derived(filteredCategories.some(cat => cat.pages.length > 0))

  let collapsed = $state(new Set())

  function toggle(name) {
    const next = new Set(collapsed)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    collapsed = next
  }

  function isCollapsed(cat) {
    if (query.trim()) return false
    return cat.name !== null && collapsed.has(cat.name)
  }

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
  <div class="sidebar-nav">
    {#each filteredCategories as cat (cat.name ?? '__root')}
      {#if cat.name}
        <button
          type="button"
          class="sidebar-category"
          aria-expanded={!isCollapsed(cat)}
          onclick={() => toggle(cat.name)}
        >
          <span>{cat.name}</span>
          <span class="chevron" class:collapsed={isCollapsed(cat)}>▾</span>
        </button>
      {/if}
      {#if !isCollapsed(cat)}
        <ul class:nested={cat.name}>
          {#each cat.pages as page (page.path)}
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
        </ul>
      {/if}
    {/each}
    {#if !hasResults}
      <p class="no-results">No matches</p>
    {/if}
  </div>
  <div class="sidebar-footer">
    <a href="https://github.com/fossisawesome/firmium" target="_blank" rel="noreferrer">GitHub</a>
  </div>
</nav>

{#if open}
  <button class="sidebar-backdrop" aria-label="Close navigation" onclick={onclose}></button>
{/if}
