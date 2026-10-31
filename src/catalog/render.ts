import { readFileSync } from 'node:fs'
import { marked } from 'marked'
import Mustache from 'mustache'
import sanitizeHtml from 'sanitize-html'
import { enhanceCatalog } from './client.ts'
import { type Catalog, sectionId } from './model.ts'

// Resolve assets relative to this module in both source and installed builds.
const template = readFileSync(
  new URL('./templates/catalog.html.mustache', import.meta.url),
  'utf8'
)
const rowTemplate = readFileSync(
  new URL('./templates/row.html.mustache', import.meta.url),
  'utf8'
)
const searchTemplate = readFileSync(
  new URL('./templates/search.html', import.meta.url),
  'utf8'
)
const stylesheet = readFileSync(
  new URL('./templates/style.css', import.meta.url),
  'utf8'
)

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ] as string
  )
}

function safeUrl(value: string): string | undefined {
  // Relative references are retained, but schemes and protocol-relative URLs are restricted.
  if (/^(?:https?:\/\/|#)/i.test(value)) return value
  return undefined
}

function markdown(value: string): string {
  return sanitizeHtml(marked.parseInline(value, { async: false }), {
    allowedTags: ['a', 'em', 'strong', 'code', 'del', 'br'],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
  })
}

export function renderCatalog(
  catalog: Catalog,
  generatedAt = new Date()
): string {
  const seenSections = new Set<string>()
  const rows = catalog.entries.map((entry) => {
    const section = sectionId(entry.section)
    const id = seenSections.has(section) ? undefined : section
    seenSections.add(section)
    const websites = entry.extras.filter((extra) =>
      /^https?:\/\/\S+$/i.test(extra)
    )
    const details = entry.extras.filter((extra) => !websites.includes(extra))
    return {
      id,
      name: entry.name,
      url: safeUrl(entry.url),
      author: entry.author,
      categories: entry.categories.map((name, index) => ({
        name,
        separator: index < entry.categories.length - 1,
      })),
      noteHtml: markdown(entry.note),
      descriptionHtml: markdown(entry.description),
      hasWebsites: websites.length > 0,
      websites: websites.map((url, index) => ({
        url,
        label: websites.length > 1 ? `Website ${index + 1}` : 'Website',
        separator: index < websites.length - 1,
      })),
      hasDetails: details.length > 0,
      details: details.map((extra) => ({ html: markdown(extra) })),
      tags: entry.tags,
    }
  })
  // Ordinary values are escaped by Mustache. Only sanitized Markdown fields
  // use triple braces in the templates; never pass raw catalog HTML through.
  return Mustache.render(
    template,
    {
      rows,
      generatedAt: generatedAt.toISOString(),
      generatedDate: generatedAt.toISOString().slice(0, 10),
      formattedCount: catalog.entries.length.toLocaleString('en'),
    },
    { row: rowTemplate },
    { escape: (value) => escapeHtml(String(value)) }
  )
}

export function catalogAssets(
  catalog: Catalog,
  generatedAt = new Date()
): Record<string, string> {
  return {
    'index.html': renderCatalog(catalog, generatedAt),
    'catalog.json': `${JSON.stringify(catalog, null, 2)}\n`,
    'style.css': stylesheet,
    'search.js': `(${enhanceCatalog.toString()})(${JSON.stringify(searchTemplate)});\n`,
    '.nojekyll': '',
  }
}
