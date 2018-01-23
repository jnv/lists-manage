import { IListItem, parseItems } from './items'

export interface ISection {
  name: string
  level: number
  items: IListItem[]
}

interface IProtoSection {
  name: string
  level: number
  lines: string[]
}

// This assumes that parsing starts with the first h2
const PATTERN_SEC_HEADER = /^#(#+)\s*(.*)$/

function lastItem<T>(array: T[]): T {
  return array[array.length - 1]
}

function parseHeader(headerMatch: RegExpMatchArray): IProtoSection {
  const [, hashes, name] = headerMatch
  return {
    name,
    level: hashes.length,
    lines: [],
  }
}

function parseSection(protoSection: IProtoSection): ISection {
  return {
    name: protoSection.name,
    level: protoSection.level,
    items: parseItems(protoSection.lines),
  }
}

export function parseSections(lines: string[]): ISection[] {
  let currentSection: IProtoSection | undefined
  const sections: ISection[] = []

  function finishSection(section: IProtoSection | undefined) {
    if (section) {
      sections.push(parseSection(section))
    }
  }

  for (const line of lines) {
    const lineMatch = PATTERN_SEC_HEADER.exec(line)
    if (lineMatch) {
      finishSection(currentSection)
      currentSection = parseHeader(lineMatch)
      continue
    }

    if (currentSection) {
      currentSection.lines.push(line)
    }
  }
  finishSection(currentSection)

  return sections
}
