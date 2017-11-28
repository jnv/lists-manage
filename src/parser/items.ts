interface ItemOptionalProps {
  desc?: string
  note?: string
  author?: string
}

export interface Item extends ItemOptionalProps {
  url: string
  name: string
  extras?: string[]
}

const PATTERN_ITEM_LINE = /^\* \[(.*)\]\((\S*)\)(.*)$/
const PATTERN_ITEM_REST = /(\*?([^*]+)\*)?\s*(by @?(\S+))?(\s*[-–—]\s*(.*))?$/i
const PATTERN_SUBITEM = /^\s+[\-\*](.*)/

function parseLineRest(rest: string): ItemOptionalProps {
  const matches = PATTERN_ITEM_REST.exec(rest.trim())
  if (matches) {
    const [, fullNote, note, fullBy, author, fullDesc, desc] = matches
    return {
      desc,
      note,
      author,
    }
  } else {
    return {}
  }
}

function parseLine(line: string): Item {
  const linkMatch = PATTERN_ITEM_LINE.exec(line)
  if (linkMatch) {
    const [, name, url, rest] = linkMatch
    return {
      url,
      name,
      ...parseLineRest(rest),
    }
  } else {
    throw new Error('Invalid argument')
  }
}

export function parseItems(lines: string[]): Item[] {
  return lines.map(parseLine)
}
