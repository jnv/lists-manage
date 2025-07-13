import type { ListFile, Section } from '../types.ts'
import { serializeItems } from './items.ts'

function serializeSection(section: Section): string {
  const headingLevel = section.level + 1 // Always H2+
  const heading = '#'.repeat(headingLevel) + ` ${section.name}`

  return `\n${heading}\n\n${serializeItems(section.items)}\n`
}

export function serializeFile(file: ListFile): string {
  let output = ''
  if (file.prefix) {
    output += `${file.prefix}\n`
  }
  output += file.sections.map(serializeSection).join('\n')
  if (file.suffix) {
    output += `\n${file.suffix}`
  }
  return output.replace(/\s+$/, '\n')
}
