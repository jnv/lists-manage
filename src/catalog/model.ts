import type { ListFile } from '../types.ts'

export type TopicRule = { tag: string; keywords: string[] }
export type TopicConfig = { version: 1; rules: TopicRule[] }
export type CatalogEntry = {
  name: string
  url: string
  description: string
  author: string
  note: string
  extras: string[]
  categories: string[]
  section: string
  tags: string[]
}
export type Catalog = { version: 1; entries: CatalogEntry[] }

export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function parseTopicConfig(value: unknown): TopicConfig {
  const fail = (message: string): never => {
    throw new Error(`Invalid topic configuration: ${message}`)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fail('expected an object with version: 1 and rules: []')
  }
  const config = value as Record<string, unknown>
  if (config.version !== 1 || !Array.isArray(config.rules)) {
    return fail('expected version: 1 and rules: []')
  }
  if (Object.keys(config).some((key) => !['version', 'rules'].includes(key))) {
    return fail('unknown top-level field')
  }
  const tags = new Set<string>()
  const rules = config.rules.map((value, index): TopicRule => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return fail(`rule ${index + 1} must be an object`)
    }
    const rule = value as Record<string, unknown>
    if (Object.keys(rule).some((key) => !['tag', 'keywords'].includes(key))) {
      return fail(`rule ${index + 1} has an unknown field`)
    }
    if (
      typeof rule.tag !== 'string' ||
      !rule.tag.trim() ||
      rule.tag !== rule.tag.trim()
    ) {
      return fail(`rule ${index + 1} needs a nonempty, trimmed tag`)
    }
    if (tags.has(normalize(rule.tag))) return fail(`duplicate tag: ${rule.tag}`)
    tags.add(normalize(rule.tag))
    if (
      !Array.isArray(rule.keywords) ||
      rule.keywords.length === 0 ||
      rule.keywords.some(
        (keyword) =>
          typeof keyword !== 'string' ||
          !keyword.trim() ||
          keyword !== keyword.trim()
      )
    ) {
      return fail(`rule ${index + 1} needs nonempty, trimmed literal keywords`)
    }
    return { tag: rule.tag, keywords: rule.keywords as string[] }
  })
  return { version: 1, rules }
}

// Unicode word boundaries, including punctuation-bearing aliases such as C#.
export function keywordMatches(text: string, keyword: string): boolean {
  const haystack = normalize(text)
  const needle = normalize(keyword)
  let from = 0
  while (from <= haystack.length) {
    const start = haystack.indexOf(needle, from)
    if (start < 0) return false
    const end = start + needle.length
    const before = Array.from(haystack.slice(0, start)).at(-1) ?? ''
    const after = Array.from(haystack.slice(end))[0] ?? ''
    if (!/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after))
      return true
    from = start + 1
  }
  return false
}

export function sectionId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-')
}

export function createCatalog(file: ListFile, config: TopicConfig): Catalog {
  const ancestors: { name: string; level: number }[] = []
  const entries: CatalogEntry[] = []
  for (const section of file.sections) {
    while (
      ancestors.length &&
      ancestors[ancestors.length - 1].level >= section.level
    )
      ancestors.pop()
    ancestors.push(section)
    for (const item of section.items) {
      const text = `${item.name} ${item.desc ?? ''}`
      entries.push({
        name: item.name,
        url: item.url,
        description: item.desc ?? '',
        author: item.author ?? '',
        note: item.note ?? '',
        extras: item.extras ?? [],
        categories: ancestors.map(({ name }) => name),
        section: section.name,
        tags: config.rules
          .filter((rule) =>
            rule.keywords.some((keyword) => keywordMatches(text, keyword))
          )
          .map(({ tag }) => tag)
          .sort((a, b) => a.localeCompare(b, 'en')),
      })
    }
  }
  entries.sort(
    (a, b) =>
      a.name.localeCompare(b.name, 'en') || a.url.localeCompare(b.url, 'en')
  )
  return { version: 1, entries }
}
