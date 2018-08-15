import { Command, flags } from '@oclif/command'

export class AddList extends Command {
  public static description = 'Add list to the Markdown file'

  public static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    file: flags.string({
      char: 'f',
      description: 'Markdown file to work with',
      default: 'README.md',
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
    const { args, flags } = this.parse(AddList)
    this.log(args, flags)
  }
}
