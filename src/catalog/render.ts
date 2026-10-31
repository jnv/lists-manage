import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { enhanceCatalog } from './client.ts'
import { type Catalog, sectionId } from './model.ts'
import { stylesheet } from './style.ts'

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

function link(url: string, label: string): string {
  const safe = safeUrl(url)
  return safe
    ? `<a href="${escapeHtml(safe)}">${escapeHtml(label)}</a>`
    : escapeHtml(label)
}

function markdown(value: string): string {
  return sanitizeHtml(marked.parseInline(value, { async: false }), {
    allowedTags: ['a', 'em', 'strong', 'code', 'del', 'br'],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
  })
}

export function renderCatalog(catalog: Catalog, title: string): string {
  const categories = [
    ...new Set(catalog.entries.flatMap((entry) => entry.categories)),
  ]
  const tags = [
    ...new Set(catalog.entries.flatMap((entry) => entry.tags)),
  ].sort((a, b) => a.localeCompare(b, 'en'))
  const seenSections = new Set<string>()
  const rows = catalog.entries
    .map((entry) => {
      const section = sectionId(entry.section)
      const id = seenSections.has(section) ? '' : ` id="${escapeHtml(section)}"`
      seenSections.add(section)
      const websites = entry.extras.filter((extra) =>
        /^https?:\/\/\S+$/i.test(extra)
      )
      const details = entry.extras.filter((extra) => !websites.includes(extra))
      return `<tr${id} data-categories="${escapeHtml(JSON.stringify(entry.categories))}">
<th scope="row">${link(entry.url, entry.name)}
${entry.author ? `<span class="meta">by @${escapeHtml(entry.author)}</span>` : ''}
<span class="meta">${escapeHtml(entry.categories.join(' / '))}</span>
${entry.note ? `<span class="meta">${markdown(entry.note)}</span>` : ''}
${websites.length ? `<div class="websites">${websites.map((url, index) => link(url, websites.length > 1 ? `Website ${index + 1}` : 'Website')).join(' · ')}</div>` : ''}</th>
<td>${markdown(entry.description)}${details.length ? `<ul class="details">${details.map((extra) => `<li>${markdown(extra)}</li>`).join('')}</ul>` : ''}</td>
<td>${entry.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(' ')}</td></tr>`
    })
    .join('\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Browse curated lists of useful resources by keyword, category, and topic.">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="style.css">
<script defer src="search.js"></script>
</head>
<body>
<header><h1>${escapeHtml(title)}</h1><p>A collection of curated lists. Find resources by name, description, or topic.</p></header>
<main>
<form id="filters" role="search" hidden>
<div class="controls">
<div class="search"><label for="search">Search lists</label><input id="search" name="q" type="search" list="topics" aria-describedby="search-help" autocomplete="off" placeholder="Search names, descriptions, and topics…"><datalist id="topics">${tags.map((tag) => `<option value="${escapeHtml(tag)}"></option>`).join('')}</datalist></div>
<div class="category"><label for="category">Category</label><select id="category" name="category"><option value="">All categories</option>${categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</select></div>
<button type="reset">Clear</button>
</div>
<p class="hint" id="search-help">Every word narrows your search. Topic suggestions replace the current search.</p>
<output id="count" aria-live="polite" aria-atomic="true">${catalog.entries.length} lists</output>
</form>
<noscript><p>All lists are shown below. Use your browser’s Find command to search.</p></noscript>
<table><caption>${catalog.entries.length.toLocaleString('en')} lists, sorted alphabetically</caption><thead><tr><th scope="col">List</th><th scope="col">Description</th><th scope="col">Topics</th></tr></thead><tbody>
${rows}
</tbody></table>
<p id="empty" hidden>No lists match your search. Try fewer words or another category.</p>
</main>
<footer><a href="catalog.json">Download the JSON catalog</a> · Generated from the maintained Markdown catalog.</footer>
</body>
</html>
`
}

export function catalogAssets(
  catalog: Catalog,
  title: string
): Record<string, string> {
  return {
    'index.html': renderCatalog(catalog, title),
    'catalog.json': `${JSON.stringify(catalog, null, 2)}\n`,
    'style.css': stylesheet,
    'search.js': `(${enhanceCatalog.toString()})();\n`,
    '.nojekyll': '',
  }
}
