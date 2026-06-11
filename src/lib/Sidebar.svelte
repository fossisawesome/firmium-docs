<script>
  import { categories, pages } from './pages.js'
  import { currentPath, navigate } from './router.js'

  let { open = false, onclose } = $props()

  let query = $state('')

  function filterGroup(cat, q) {
    const pages = cat.pages.filter(page =>
      page.label.toLowerCase().includes(q) || page.content.toLowerCase().includes(q)
    )
    const subcategories = (cat.subcategories ?? [])
      .map(sub => filterGroup(sub, q))
      .filter(sub => sub.pages.length > 0 || (sub.subcategories?.length ?? 0) > 0)
    return { ...cat, pages, subcategories }
  }

  function groupHasResults(cat) {
    return cat.pages.length > 0 || (cat.subcategories ?? []).some(groupHasResults)
  }

  const filteredCategories = $derived.by(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categories
    return categories
      .map(cat => filterGroup(cat, q))
      .filter(groupHasResults)
  })

  const hasResults = $derived(filteredCategories.some(groupHasResults))

  let collapsed = $state(new Set())

  function toggle(key) {
    const next = new Set(collapsed)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    collapsed = next
  }

  function isCollapsed(cat, key) {
    if (query.trim()) return false
    return cat.name !== null && collapsed.has(key)
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
    {#snippet group(cat, depth, key)}
      {#if cat.name}
        <button
          type="button"
          class="sidebar-category"
          style="padding-left: {12 + depth * 12}px"
          aria-expanded={!isCollapsed(cat, key)}
          onclick={() => toggle(key)}
        >
          <span>{cat.name}</span>
          <span class="chevron" class:collapsed={isCollapsed(cat, key)} aria-hidden="true">▾</span>
        </button>
      {/if}
      {#if !isCollapsed(cat, key)}
        <ul class:nested={cat.name} style={cat.name ? `padding-left: ${12 + depth * 12}px; margin-left: ${12 + depth * 12}px` : ''}>
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
        {#each cat.subcategories ?? [] as sub (sub.name)}
          {@render group(sub, depth + 1, `${key}/${sub.name}`)}
        {/each}
      {/if}
    {/snippet}
    {#each filteredCategories as cat (cat.name ?? '__root')}
      {@render group(cat, 0, cat.name ?? '__root')}
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
