import type { Section } from '../types.ts'
import { parseItems } from './items.ts'

type ProtoSection = Pick<Section, 'name' | 'level'> & {
  lines: string[]
}

// This assumes that parsing starts with the first h2
const PATTERN_SEC_HEADER = /^#(#+)\s*(.*)$/

function parseHeader(headerMatch: RegExpMatchArray): ProtoSection {
  const [, hashes, name] = headerMatch
  return {
    name,
    level: hashes.length,
    lines: [],
  }
}

function parseSection(protoSection: ProtoSection): Section {
  return {
    name: protoSection.name,
    level: protoSection.level,
    items: parseItems(protoSection.lines),
  }
}

export function parseSections(lines: string[]): Section[] {
  let currentSection: ProtoSection | undefined
  const sections: Section[] = []

  function finishSection(section: ProtoSection | undefined): void {
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
