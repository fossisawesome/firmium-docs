<script>
  import { extractHeadings } from './markdown-setup.js'

  let { content } = $props()

  const headings = $derived(extractHeadings(content))

  function onClick(e, id) {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
</script>

{#if headings.length > 0}
  <nav class="toc" aria-label="Table of contents">
    <span class="toc-title">On this page</span>
    <ul>
      {#each headings as heading (heading.id)}
        <li class="depth-{heading.depth}">
          <a href="#{heading.id}" onclick={(e) => onClick(e, heading.id)}>{heading.text}</a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .toc {
    position: sticky;
    top: 40px;
    align-self: flex-start;
    width: 200px;
    flex-shrink: 0;
    padding: 4px 0 0 24px;
    font-size: 13px;
  }

  .toc-title {
    display: block;
    font-weight: bold;
    color: var(--accent);
    margin-bottom: 8px;
  }

  .toc ul {
    list-style: none;
    margin: 0;
    padding: 0;
    border-left: 1px solid var(--border);
  }

  .toc li {
    margin: 0;
  }

  .toc li.depth-3 {
    padding-left: 12px;
  }

  .toc a {
    display: block;
    padding: 4px 0 4px 12px;
    color: var(--muted);
    text-decoration: none;
    border-left: 2px solid transparent;
    margin-left: -1px;
    transition: color var(--timing), border-color var(--timing);
  }

  .toc a:hover {
    color: var(--text);
  }

  @media (max-width: 1100px) {
    .toc {
      display: none;
    }
  }
</style>
