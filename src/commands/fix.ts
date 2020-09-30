import { Command, flags } from '@oclif/command'
import debug from 'debug'
import { loadListFile, addItemToSection, writeListFile } from '../listFile'
import { serializeFile } from '../serializer'
import { sortFile } from '../listFile/sort'
import { checkRepo } from '../repo'
import { updateItem } from '../listItem'
import { ListFile } from '../types'

const d = debug('cli')

export class FixList extends Command {
  public static description = 'Fix removed and redirected links'

  static strict = true

  static examples = [
    '$ lists-manage fix -w',
    '$ lists-manage fix -f MY_LISTS_FILE.md',
  ]

  public static flags = {
    help: flags.help({ char: 'h' }),
    file: flags.string({
      char: 'f',
      description: 'Markdown file to work with',
      default: 'README.md',
    }),
    write: flags.boolean({
      char: 'w',
      description: 'Edit [file] in place',
      default: false,
    }),
  }

  private async flushFile(
    listFile: ListFile,
    filename: string,
    write: boolean
  ): Promise<void> {
    const sortedFile = sortFile(listFile)
    if (write) {
      this.log(`Writing to file ${filename}`)
      await writeListFile(filename, sortedFile)
    } else {
      this.log(serializeFile(sortedFile))
    }
  }

  public async run(): Promise<void> {
    const { flags } = this.parse(FixList)

    if (!flags.file) {
      this.error('Missing file', { exit: 1 })
      return
    }

    const file = await loadListFile(flags.file)
    let i = 0
    for (const { items } of file.sections) {
      for (const [itemIdx, item] of items.entries()) {
        try {
          d('Checking %s', item.url)
          const checkResult = await checkRepo(item.url)
          if (!checkResult.exists) {
            this.warn(`Repo not found: ${item.url}`)
            items.splice(itemIdx, 1) // TODO mutation
          }
          if (checkResult.redirect) {
            this.warn(`Repo redirected: ${item.url} -> ${checkResult.url}`)
            // TODO mutation
            const newItem = updateItem(item, { url: checkResult.url })
            items.splice(itemIdx, 1, newItem)
          }
        } catch (e) {
          this.warn(`Failed to check ${item.url}`)
          this.warn(e)
        }
        i++
        if (flags.write && i % 10 === 0) {
          d('Flushing')
          this.flushFile(file, flags.file, flags.write)
        }
      }
    }
    this.flushFile(file, flags.file, flags.write)
  }
}
