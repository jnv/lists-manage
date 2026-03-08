import { Command } from '@cliffy/command'
import debug from 'debug'
import { loadListFile, writeListFile } from '../listFile/index.ts'
import { serializeFile } from '../serializer/index.ts'
import { sortFile } from '../listFile/sort.ts'
import { checkRepo } from '../repo/index.ts'
import { updateItem } from '../listItem.ts'
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
    .option('-f, --file <file:string>', 'Markdown file to work with', { default: 'README.md' })
    .option('-w, --write [write:boolean]', 'Edit [file] in place', { default: false })
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
        for (const [itemIdx, item] of items.entries()) {
          try {
            d('Checking %s', item.url)
            const checkResult = await checkRepo(item.url)
            if (!checkResult.exists) {
              console.warn(`Repo not found: ${item.url}`)
              items.splice(itemIdx, 1) // TODO mutation
            }
            if (checkResult.redirect) {
              console.warn(`Repo redirected: ${item.url} -> ${checkResult.url}`)
              // TODO mutation
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
            flushFile(listFile, file, write)
          }
        }
      }
      await flushFile(listFile, file, write)
    })
}
