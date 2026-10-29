import { promises as fs } from 'node:fs'
import path from 'node:path'
import { parseFile } from '../parser/file.ts'
import { serializeFile } from '../serializer/index.ts'
import type { ListFile, ListItem } from '../types.ts'
import { sortItems } from './sort.ts'

export async function loadListFile(filename: string): Promise<ListFile> {
  const lines = await fs.readFile(filename, 'utf8')
  return parseFile(lines)
}

export async function writeListFile(
  filename: string,
  listFile: ListFile
): Promise<void> {
  const str = serializeFile(listFile)
  // Follow existing symlinks, so replacing the file does not replace the link.
  let destination: string
  try {
    destination = await fs.realpath(filename)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    destination = path.resolve(filename)
  }
  let mode: number | undefined
  try {
    mode = (await fs.stat(destination)).mode
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  // Keep the temporary file on the same filesystem for atomic rename.
  const temporaryDir = await fs.mkdtemp(
    path.join(path.dirname(destination), '.lists-manage-')
  )
  const temporaryFile = path.join(temporaryDir, 'list.md')
  try {
    await fs.writeFile(temporaryFile, str, { flag: 'wx' })
    if (mode !== undefined) await fs.chmod(temporaryFile, mode)
    await fs.rename(temporaryFile, destination)
  } finally {
    await fs.rm(temporaryDir, { recursive: true, force: true })
  }
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
