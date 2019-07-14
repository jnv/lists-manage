import { Command, flags } from '@oclif/command'
import { loadListFile, addItemToSection, writeListFile } from '../listFile'
import { checkRepo } from '../repo'
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

  public async run(): Promise<void> {
    const { flags } = this.parse(FixList)

    if (!flags.file) {
      this.error('Missing file', { exit: 1 })
      return
    }

    const file = await loadListFile(flags.file)
    for (const { items } of file.sections) {
      for (const item of items) {
        const checkResult = await checkRepo(item.url)
        if (!checkResult.exists) {
          this.warn(`Repo not found: ${item.url}`)
        }
        if (checkResult.redirect) {
          this.warn(`Repo redirected: ${item.url} -> ${checkResult.url}`)
        }
      }
    }
  }
}
