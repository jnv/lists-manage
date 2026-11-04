import type { ListItem } from '../types.ts'

type LineRest = Pick<ListItem, 'desc' | 'note' | 'author'>

const PATTERN_ITEM_LINE = /^[-*]\s+\[([^\]]+)\]\((\S*)\)(.*)$/
const PATTERN_ITEM_REST =
  /^(?:([_*])(.+?)\1)?\s*(by @?(\S+))?(\s*[-–—]\s*(.*))?$/i
const PATTERN_SUBITEM = /^\s+[-*]\s*(.*)$/

function parseLineRest(rest: string): LineRest {
  const matches = PATTERN_ITEM_REST.exec(rest.trim())
  if (matches) {
    const [, , note, , author, , desc] = matches
    return {
      desc,
      note,
      author,
    }
  } else {
    throw new Error(`Unsupported list item metadata: ${rest.trim()}`)
  }
}

function parseLine(linkMatch: RegExpMatchArray): ListItem {
  const [, name, url, rest] = linkMatch
  if (linkMatch) {
    return {
      url,
      name,
      ...parseLineRest(rest),
    }
  } else {
    throw new TypeError('Invalid argument')
  }
}

export function parseItems(lines: string[]): ListItem[] {
  return lines.reduce((items: ListItem[], line): ListItem[] => {
    const lineMatch = PATTERN_ITEM_LINE.exec(line)
    if (lineMatch) {
      return items.concat(parseLine(lineMatch))
    }

    const subitemMatch = PATTERN_SUBITEM.exec(line)
    if (subitemMatch) {
      const lastItem = items[items.length - 1]
      if (!lastItem) {
        throw new Error(
          `Expected a list item before supplementary content: ${line}`
        )
      }
      const { extras = [] } = lastItem
      extras.push(subitemMatch[1])
      lastItem.extras = extras
    } else if (line.trim()) {
      throw new Error(
        `Unsupported list content; move it outside the list markers: ${line}`
      )
    }

    return items
  }, [])
}
