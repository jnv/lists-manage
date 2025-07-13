import type { ListItem } from './types.ts'
import { getRepoInfo } from './repo/index.ts'
export function updateItem(
  original: ListItem,
  updatedProps: Partial<ListItem>
): ListItem {
  const newItem = {
    ...original,
    ...updatedProps,
  }
  if (updatedProps.url) {
    const repoInfo = getRepoInfo(updatedProps.url)
    newItem.name = repoInfo.name
    newItem.author = ''
  }
  return newItem
}
