import { Command, flags } from '@oclif/command'
import { loadListFile, addItemToSection, writeListFile } from '../listFile'
import { serializeFile } from '../serializer'
import { sortFile } from '../listFile/sort'
import { checkRepo } from '../repo'
import { updateItem } from '../listItem'

export class SortFile extends Command {
  public static description = 'Just sort the items in file'

  static strict = true

  static examples = [
    '$ lists-manage sort -w',
    '$ lists-manage sort -f MY_LISTS_FILE.md',
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

  public async run(): Promise<void> {
    const { flags } = this.parse(SortFile)

    if (!flags.file) {
      this.error('Missing file', { exit: 1 })
      return
    }

    const file = await loadListFile(flags.file)
    const sortedFile = sortFile(file)
    if (flags.write) {
      this.log(`Writing to file ${flags.file}`)
      await writeListFile(flags.file, sortedFile)
    } else {
      this.log(serializeFile(sortedFile))
    }
  }
}
