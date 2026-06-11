<script>
  import Sidebar from './lib/Sidebar.svelte'
  import Markdown from './lib/Markdown.svelte'
  import TableOfContents from './lib/TableOfContents.svelte'
  import PageNav from './lib/PageNav.svelte'
  import { currentPath } from './lib/router.js'
  import { findPage } from './lib/pages.js'

  let mobileNavOpen = $state(false)

  const page = $derived(findPage($currentPath))
</script>

<a href="#main-content" class="skip-link">Skip to content</a>

<div class="layout">
  <header class="topbar">
    <button class="menu-btn" aria-label="Toggle navigation" onclick={() => mobileNavOpen = !mobileNavOpen}>
      ☰
    </button>
    <span class="topbar-title">Firmium Docs</span>
  </header>

  <Sidebar open={mobileNavOpen} onclose={() => mobileNavOpen = false} />

  <main class="content" id="main-content" tabindex="-1">
    <Markdown content={page.content} />
    <PageNav path={page.path} />
  </main>

  <TableOfContents content={page.content} />
</div>
