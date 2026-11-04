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
      if (output !== prefix || LIST_END.test(line)) {
        throw new Error(
          'Expected exactly one lists-start marker before lists-end'
        )
      }
      output.push(line)
      output = listPart
    } else if (LIST_END.test(line)) {
      if (output !== listPart) {
        throw new Error(
          'Expected exactly one lists-end marker after lists-start'
        )
      }
      output = suffix
      output.push(line)
    } else {
      output.push(line)
    }
  }
  if (output !== suffix) {
    throw new Error('Expected one lists-start/lists-end marker pair')
  }
  return {
    prefix: prefix.join('\n'),
    sections: parseSections(listPart),
    suffix: suffix.join('\n'),
  }
}
