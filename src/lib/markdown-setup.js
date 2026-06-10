import { marked } from 'marked'
import hljs from 'highlight.js'

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

const renderer = new marked.Renderer()

renderer.heading = function ({ tokens, depth }) {
  const text = this.parser.parseInline(tokens)
  const id = slugify(text.replace(/<[^>]+>/g, ''))
  return `<h${depth} id="${id}">${text}</h${depth}>\n`
}

renderer.code = function ({ text, lang }) {
  const language = hljs.getLanguage(lang) ? lang : 'plaintext'
  const out = hljs.highlight(text, { language }).value
  return `<pre><code class="hljs language-${language}">${out}</code></pre>\n`
}

marked.use({ renderer })
