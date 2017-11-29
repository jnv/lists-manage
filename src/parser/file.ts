import { IListItem } from './items'

export interface ISection {
  name: string
  depth: number
  items: IListItem[]
}

// This assumes that parsing starts with the first h2
const PATTERN_SEC_HEADER = /^#(#+)\s*(.*)$/

export function parseFile() {}
