import * as fs from 'fs'
import { promisify } from 'util'
import { parseFile } from './parser'

const readFile = promisify(fs.readFile)

export async function loadFile(filename: string) {
  const lines = await readFile(filename, 'utf8')
  return parseFile(lines)
}
