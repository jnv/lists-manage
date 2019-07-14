import { promises as fs } from 'fs'
import { parseFile } from '../parser'
import { ListFile, ListItem } from '../types'
import { sortItems } from './sort'
import { serializeFile } from '../serializer'

export async function loadListFile(filename: string): Promise<ListFile> {
  const lines = await fs.readFile(filename, 'utf8')
  return parseFile(lines)
}

export async function writeListFile(
  filename: string,
  listFile: ListFile
): Promise<void> {
  const str = serializeFile(listFile)
  return fs.writeFile(filename, str)
}

export function addItemToSection(
  file: Readonly<ListFile>,
  item: ListItem,
  sectionIdx: number
): ListFile {
  const section = { ...file.sections[sectionIdx] }
  const items = sortItems([...section.items, item])
  const newSection = { ...section, items }
  return {
    ...file,
    sections: Object.assign([], file.sections, { [sectionIdx]: newSection }),
  }
}
