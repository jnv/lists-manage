import { ListItem } from '../types'

type ItemOptionalProps = Partial<{
  desc: string
  note: string
  author: string
}>

const PATTERN_ITEM_LINE = /^\* \[(.*)\]\((\S*)\)(.*)$/
const PATTERN_ITEM_REST = /(\*?([^*]+)\*)?\s*(by @?(\S+))?(\s*[-–—]\s*(.*))?$/i
const PATTERN_SUBITEM = /^\s+[\-\*]\s*(.*)$/

function parseLineRest(rest: string): ItemOptionalProps {
  const matches = PATTERN_ITEM_REST.exec(rest.trim())
  if (matches) {
    const [, ignNote, note, ignBy, author, ignDesc, desc] = matches
    return {
      desc,
      note,
      author,
    }
  } else {
    return {}
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
    throw new Error('Invalid argument')
  }
}

export function parseItems(lines: string[]): ListItem[] {
  return lines.reduce((items: ListItem[], line) => {
    const lineMatch = PATTERN_ITEM_LINE.exec(line)
    if (lineMatch) {
      return items.concat(parseLine(lineMatch))
    }

    const subitemMatch = PATTERN_SUBITEM.exec(line)
    if (subitemMatch) {
      const lastItem = items[items.length - 1]
      const { extras = [] } = lastItem
      extras.push(subitemMatch[1])
      lastItem.extras = extras
    }

    return items
  }, [])
}
