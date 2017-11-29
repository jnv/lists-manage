import { IListItem } from './items'

interface IListFile {
  prefix?: string,
  suffix?: string,
  sections: ISection[],
}

export interface ISection {
  name: string
  depth: number
  items: IListItem[]
}

// This assumes that parsing starts with the first h2
const PATTERN_SEC_HEADER = /^#(#+)\s*(.*)$/

export function parseFile(contents: string) {

}
