import { URL } from 'url'
import type { ListItem, ListFile, Section } from '../types.ts'

type ReadonlyListItems = readonly ListItem[]

function stripChars(str: string): string {
  return str.replace(/[^a-z0-9]/i, '')
}
function strcmp(str1: string, str2: string): number {
  return stripChars(str1).localeCompare(stripChars(str2), 'en', {
    sensitivity: 'base',
    usage: 'sort',
  })
}
function comparator(a: ListItem, b: ListItem): number {
  const nameCmp = strcmp(a.name, b.name)
  if (nameCmp !== 0 || !a.author || !b.author) {
    return nameCmp
  }
  return strcmp(a.author, b.author)
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
