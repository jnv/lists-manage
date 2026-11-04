import { URL } from 'node:url'
import type { ListFile, ListItem, Section } from '../types.ts'

type ReadonlyListItems = readonly ListItem[]

const collator = new Intl.Collator('en', {
  sensitivity: 'base',
  usage: 'sort',
  ignorePunctuation: true,
})

function comparator(a: ListItem, b: ListItem): number {
  const nameCmp = collator.compare(a.name, b.name)
  if (nameCmp !== 0 || !a.author || !b.author) {
    return nameCmp
  }
  return collator.compare(a.author, b.author)
}

function extractAuthor({ url }: ListItem): string {
  const u = new URL(url)
  const [, username] = u.pathname.split('/', 2)
  return username
}
function markDuplicates(items: ReadonlyListItems): ListItem[] {
  const firstFound: Map<string, ListItem> = new Map()
  const results = []
  for (const item of items) {
    const nameKey = item.name.toLowerCase()
    const itemCopy = { ...item }
    results.push(itemCopy)
    const existing = firstFound.get(nameKey)
    if (!existing) {
      firstFound.set(nameKey, itemCopy)
      continue
    }
    if (!existing.author) {
      existing.author = extractAuthor(existing)
    }
    if (!itemCopy.author) {
      itemCopy.author = extractAuthor(itemCopy)
    }
  }
  return results
}

export function sortItems(items: ReadonlyListItems): ListItem[] {
  return markDuplicates(items).sort(comparator)
}

export function sortFile(file: ListFile): ListFile {
  const sections = file.sections.map((section): Section => {
    return {
      ...section,
      items: sortItems(section.items),
    }
  })
  return {
    ...file,
    sections,
  }
}
