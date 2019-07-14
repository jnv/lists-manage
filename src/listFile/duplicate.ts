import { ListFile } from '../types'

export function urlExistsInFile(
  listFile: ListFile,
  urlToCheck: string
): boolean {
  for (const { items } of listFile.sections) {
    const result = items.find(({ url }): boolean => url === urlToCheck)
    if (result) {
      return true
    }
  }
  return false
}
