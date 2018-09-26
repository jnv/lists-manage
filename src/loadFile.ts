import * as fs from 'fs'
import { promisify } from 'util'
import { parseFile } from './parser'
import { ListFile } from './types'

const readFile = promisify(fs.readFile)

export async function loadFile(filename: string): Promise<ListFile> {
  const lines = await readFile(filename, 'utf8')
  return parseFile(lines)
}
