<script>
  import { pages } from './pages.js'
  import { navigate } from './router.js'

  let { path } = $props()

  const index = $derived(pages.findIndex(p => p.path === path))
  const prev = $derived(index > 0 ? pages[index - 1] : null)
  const next = $derived(index >= 0 && index < pages.length - 1 ? pages[index + 1] : null)

  function go(p) {
    navigate(p.path)
  }
</script>

{#if prev || next}
  <nav class="page-nav" aria-label="Page navigation">
    {#if prev}
      <a class="page-link prev" href={prev.path} onclick={(e) => { e.preventDefault(); go(prev) }}>
        <span class="dir">← Previous</span>
        <span class="label">{prev.label}</span>
      </a>
    {:else}
      <span></span>
    {/if}
    {#if next}
      <a class="page-link next" href={next.path} onclick={(e) => { e.preventDefault(); go(next) }}>
        <span class="dir">Next →</span>
        <span class="label">{next.label}</span>
      </a>
    {/if}
  </nav>
{/if}

<style>
  .page-nav {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }

  .page-link {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 16px;
    border: 1px solid var(--border);
    border-radius: 6px;
    text-decoration: none;
    max-width: 48%;
    transition: border-color var(--timing), background var(--timing);
  }

  .page-link:hover {
    border-color: var(--accent);
    background: var(--surface2);
    text-decoration: none;
  }

  .page-link.next {
    text-align: right;
    margin-left: auto;
  }

  .dir {
    font-size: 12px;
    color: var(--muted);
  }

  .label {
    color: var(--accent);
    font-weight: bold;
  }
</style>
