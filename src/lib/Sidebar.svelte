<script>
  import { pages } from './pages.js'
  import { currentPath, navigate } from './router.js'

  let { open = false, onclose } = $props()

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
  <ul class="sidebar-nav">
    {#each pages as page (page.path)}
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
  <div class="sidebar-footer">
    <a href="https://github.com/fossisawesome/firmium" target="_blank" rel="noreferrer">GitHub</a>
  </div>
</nav>

{#if open}
  <button class="sidebar-backdrop" aria-label="Close navigation" onclick={onclose}></button>
{/if}
