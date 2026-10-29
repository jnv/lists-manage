import { Command } from '@cliffy/command'
import debug from 'debug'
import { loadListFile, writeListFile } from '../listFile/index.ts'
import { sortFile } from '../listFile/sort.ts'
import { updateItem } from '../listItem.ts'
import { checkRepo } from '../repo/index.ts'
import { serializeFile } from '../serializer/index.ts'
import type { ListFile } from '../types.ts'

const d = debug('cli')

function flushFile(
  listFile: ListFile,
  filename: string,
  write: boolean
): Promise<void> | void {
  const sortedFile = sortFile(listFile)
  if (write) {
    console.log(`Writing to file ${filename}`)
    return writeListFile(filename, sortedFile)
  } else {
    console.log(serializeFile(sortedFile))
  }
}

export function fixCommand() {
  return new Command()
    .description('Fix removed and redirected links')
    .option('-f, --file <file:string>', 'Markdown file to work with', {
      default: 'README.md',
    })
    .option('-w, --write [write:boolean]', 'Edit [file] in place', {
      default: false,
    })
    .example('fix in place', 'lists-manage fix -w')
    .example('fix custom file', 'lists-manage fix -f MY_LISTS_FILE.md')
    .action(async (options) => {
      const file = options.file as unknown as string
      const write = options.write as unknown as boolean

      if (!file) {
        console.error('Missing file')
        process.exit(1)
      }

      const listFile = await loadListFile(file)
      let i = 0
      for (const { items } of listFile.sections) {
        for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
          const item = items[itemIdx]
          try {
            d('Checking %s', item.url)
            const checkResult = await checkRepo(item.url)
            if (!checkResult.exists) {
              console.warn(`Repo not found: ${item.url}`)
              // The next item moves into this slot and still needs checking.
              items.splice(itemIdx--, 1)
            } else if (checkResult.redirect) {
              console.warn(`Repo redirected: ${item.url} -> ${checkResult.url}`)
              const newItem = updateItem(item, { url: checkResult.url })
              items.splice(itemIdx, 1, newItem)
            }
          } catch (e) {
            console.warn(`Failed to check ${item.url}`)
            console.warn(e)
          }
          i++
          if (write && i % 10 === 0) {
            d('Flushing')
            await flushFile(listFile, file, write)
          }
        }
      }
      await flushFile(listFile, file, write)
    })
}
