import { ListFile, ListItem } from '../types'

function comparator(urlToCheck: string): (item: ListItem) => boolean {
  const urlLowercase = urlToCheck.toLowerCase()
  return ({ url }) => urlLowercase === url.toLowerCase()
}

export function urlExistsInFile(
  listFile: ListFile,
  urlToCheck: string
): boolean {
  for (const { items } of listFile.sections) {
    const result = items.find(comparator(urlToCheck))
    if (result) {
      return true
    }
  }
  return false
}
