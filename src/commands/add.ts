import { Command, flags } from '@oclif/command'
import { loadFile } from '../loadFile'
import { sortFile } from '../sort'
import { serializeFile } from '../serializer'
export class AddList extends Command {
  public static description = 'Add list to the Markdown file'

  static strict = false

  static examples = ['$ lists-manage add']

  public static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    file: flags.string({
      char: 'f',
      description: 'Markdown file to work with',
      default: 'README.md',
    }),
    json: flags.boolean({
      char: 'j',
      description: 'Print output as JSON',
    }),
  }

  static args = [
    {
      name: 'url',
      description:
        'URL of the list to add (in form https://github.com/user/repo)',
    },
  ]

  public async run() {
    const { flags } = this.parse(AddList)
    if (!flags.file) {
      this.error('Missing file', { exit: 1 })
      return
    }
    let file = await loadFile(flags.file)
    file = sortFile(file)
    if (flags.json) {
      this.log(JSON.stringify(file, undefined, 2))
    } else {
      this.log(serializeFile(file))
    }
  }
}
