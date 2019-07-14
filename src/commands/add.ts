import { Command, flags } from '@oclif/command'
import { prompt } from 'enquirer'
import { loadListFile } from '../listFile'
import { sortFile } from '../listFile/sort'
import { serializeFile } from '../serializer'
import { fetchRepoDetails } from '../repo'
import { suggestSection } from '../suggestSection'

export class AddList extends Command {
  public static description = 'Add list to the Markdown file'

  static strict = false

  static examples = ['$ lists-manage add']

  public static flags = {
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
      required: true,
      description:
        'URL of the list to add (in form https://github.com/user/repo)',
    },
  ]

  public async run(): Promise<void> {
    const { args, flags } = this.parse(AddList)
    if (!flags.file) {
      this.error('Missing file', { exit: 1 })
      return
    }
    const repoDetails = await fetchRepoDetails(args.url)
    const file = await loadListFile(flags.file)

    const sections = file.sections.map(({ name }, value): {
      name: string
      value: number
    } => ({ name, value }))
    if (!sections.length) {
      this.error(
        `No sections found in file ${flags.file}. do you have a correct file?`,
        { exit: 1 }
      )
      return
    }

    const initialSection = suggestSection(file.sections)(repoDetails)

    const response = await prompt([
      {
        type: 'select',
        name: 'section',
        message: 'Select a list section:',
        choices: sections,
        initial: initialSection,
      },
      {
        type: 'input',
        name: 'desc',
        message: 'Enter list description (optional):',
        initial: repoDetails.desc,
      },
      {
        type: 'confirm',
        name: 'homepage',
        message: `Include list's homepage (${repoDetails.homepage})?`,
        skip: !repoDetails.homepage,
      },
    ])
    this.log(response)
    // file = sortFile(file)
    // this.log(serializeFile(file))
  }
}
