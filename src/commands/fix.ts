import { Command } from '@cliffy/command'
import debug from 'debug'
import { loadListFile, writeListFile } from '../listFile/index.ts'
import { sortFile } from '../listFile/sort.ts'
import { updateItem } from '../listItem.ts'
import { checkRepo } from '../repo/index.ts'
import { RequestScheduler } from '../repo/scheduler.ts'
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
    console.warn(`Writing to file ${filename}`)
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
      const scheduler = new RequestScheduler()
      const work = listFile.sections.flatMap((section) =>
        section.items.map((item) => ({ section, item }))
      )
      let completed = 0
      let saveFailure: unknown
      let saves = Promise.resolve()
      const unresolved: string[] = []
      function save() {
        const snapshot = structuredClone(listFile)
        saves = saves.then(async () => {
          if (saveFailure) {
            return
          }
          try {
            await flushFile(snapshot, file, true)
          } catch (error) {
            saveFailure = error
            scheduler.stop(error)
          }
        })
      }
      await Promise.all(
        work.map(async ({ section, item }) => {
          try {
            d('Checking %s', item.url)
            const result = await checkRepo(item.url, scheduler)
            if (saveFailure) {
              return
            }
            // Identity stays stable even when adjacent checks finish out of order.
            const index = section.items.indexOf(item)
            if (!result.exists) {
              console.warn(`Repo not found: ${item.url}`)
              section.items.splice(index, 1)
            } else if (result.redirect) {
              const replacement = updateItem(item, { url: result.url })
              section.items.splice(index, 1, replacement)
              console.warn(`Repo redirected: ${item.url} -> ${result.url}`)
            }
          } catch (error) {
            if (saveFailure) {
              return
            }
            const reason =
              error instanceof Error ? error.message : String(error)
            unresolved.push(`${item.url}: ${reason}`)
            console.warn(`Failed to check ${item.url}: ${reason}`)
          }
          completed++
          if (write && completed % 10 === 0) {
            save()
          }
        })
      )
      if (write && !saveFailure) {
        save()
      }
      await saves
      if (saveFailure) {
        throw saveFailure
      }
      if (!write) {
        await flushFile(listFile, file, false)
      }
      if (unresolved.length) {
        console.warn(
          `Unresolved repository checks (${unresolved.length}):\n${unresolved.join('\n')}`
        )
        throw new Error(`${unresolved.length} repository check(s) unresolved`)
      }
    })
}
