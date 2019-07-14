export { RepoDetail } from './repo/types'

export type ListItem = {
  url: string
  name: string
  extras?: string[]
  desc?: string
  note?: string
  author?: string
}

export type Section = {
  name: string
  level: number
  items: ListItem[]
}

export type ListFile = {
  prefix?: string
  suffix?: string
  sections: Section[]
}
