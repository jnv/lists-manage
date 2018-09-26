import { ListFile, Section } from '../types'
import { serializeItems } from './items'

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
  return output.replace(/\s+$/, '')
}
