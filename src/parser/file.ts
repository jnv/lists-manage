import type { ListFile } from '../types.ts'
import { parseSections } from './sections.ts'

const LIST_START = /<!-- lists-start -->/
const LIST_END = /<!-- lists-end -->/

export function parseFile(fileContents: string): ListFile {
  const lines = fileContents.split(/\n/)
  const prefix: string[] = []
  const listPart: string[] = []
  const suffix: string[] = []
  let output = prefix
  for (const line of lines) {
    if (LIST_START.test(line)) {
      output.push(line)
      output = listPart
    } else if (LIST_END.test(line)) {
      output = suffix
      output.push(line)
    } else {
      output.push(line)
    }
  }
  return {
    prefix: prefix.join('\n'),
    sections: parseSections(listPart),
    suffix: suffix.join('\n'),
  }
}
