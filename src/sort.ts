import { URL } from 'url'
import { ListItem } from './types'

type ReadonlyListItems = ReadonlyArray<Readonly<ListItem>>

function strcmp(str1: string, str2: string): 0 | 1 | -1 {
  if (str1 === str2) {
    return 0
  }
  return str1 > str2 ? 1 : -1
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
  const firstFound = new Map()
  const results = []
  for (const item of items) {
    const { name } = item
    const itemCopy = { ...item }
    results.push(itemCopy)
    const existing = firstFound.get(name)
    if (!existing) {
      firstFound.set(name, itemCopy)
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
