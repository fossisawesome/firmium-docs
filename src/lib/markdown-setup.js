import { marked } from 'marked'

function slugify(text) {
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

marked.use({ renderer })
