import type { ListItem } from '../types.ts'

function serializeItem(item: ListItem): string {
  let output = `* [${item.name}](${item.url})`
  if (item.note) {
    output += ` _${item.note}_`
  }
  if (item.author) {
    output += ` by @${item.author}`
  }
  if (item.desc) {
    output += ` – ${item.desc}`
  }
  if (item.extras) {
    output +=
      '\n' + item.extras.map((extra): string => `  - ${extra}`).join('\n')
  }
  return output
}
export function serializeItems(items: ListItem[]): string {
  return items.map(serializeItem).join('\n')
}
