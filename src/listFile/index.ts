import * as fs from 'fs'
import { promisify } from 'util'
import { parseFile } from '../parser'
import { ListFile, ListItem } from '../types'
import { sortItems } from './sort'

const readFile = promisify(fs.readFile)

export async function loadListFile(filename: string): Promise<ListFile> {
  const lines = await readFile(filename, 'utf8')
  return parseFile(lines)
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
