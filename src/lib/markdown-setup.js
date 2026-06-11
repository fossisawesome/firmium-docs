import { marked } from 'marked'
import hljs from 'highlight.js'

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// Tracks ids seen for the current document so duplicate headings (e.g. two
// "Steps" sections) get suffixed -1, -2, ... instead of colliding.
let headingIds = new Map()

function dedupeId(id) {
  const count = headingIds.get(id) ?? 0
  headingIds.set(id, count + 1)
  return count === 0 ? id : `${id}-${count}`
}

const renderer = new marked.Renderer()

renderer.heading = function ({ tokens, depth }) {
  const text = this.parser.parseInline(tokens)
  const id = dedupeId(slugify(text.replace(/<[^>]+>/g, '')))
  return `<h${depth} id="${id}">${text}</h${depth}>\n`
}

renderer.code = function ({ text, lang }) {
  const language = hljs.getLanguage(lang) ? lang : 'plaintext'
  const out = hljs.highlight(text, { language }).value
  return `<pre><code class="hljs language-${language}">${out}</code></pre>\n`
}

marked.use({
  renderer,
  hooks: {
    preprocess(markdown) {
      headingIds = new Map()
      return markdown
    },
  },
})

const inlineParser = new marked.Parser()

// Extracts the same h2/h3 headings (with the same ids) that renderer.heading
// produces, so the table of contents links resolve to the actual anchors.
export function extractHeadings(content) {
  headingIds = new Map()
  const headings = []
  for (const token of marked.lexer(content)) {
    if (token.type !== 'heading' || token.depth < 2 || token.depth > 3) continue
    const text = inlineParser.parseInline(token.tokens).replace(/<[^>]+>/g, '')
    headings.push({ depth: token.depth, text, id: dedupeId(slugify(text)) })
  }
  return headings
}
