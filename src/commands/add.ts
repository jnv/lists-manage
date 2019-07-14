import { Command, flags } from '@oclif/command'
import { prompt } from 'enquirer'
import { loadListFile, addItemToSection, writeListFile } from '../listFile'
import { serializeFile } from '../serializer'
import { fetchRepoDetails } from '../repo'
import { suggestSection } from '../suggestSection'
import { ListItem } from '../types'
import { addPrompt } from '../prompts'

export class AddList extends Command {
  public static description = 'Add list URL to the Markdown file'

  static strict = false

  static examples = [
    '$ lists-manage add -w https://github.com/some-user/awesome-list',
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
    prompt: flags.boolean({
      char: 'p',
      description:
        'Enable or disable interactive prompt; enabled by default, disabled when output is being redirected',
      allowNo: true,
      default: process.stdout.isTTY,
    }),
  }

  static args = [
    {
      name: 'url',
      required: true,
      description:
        'URL of the list to add (in form of https://github.com/user/repo)',
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
      value: string
    } => ({ name, value: String(value) }))
    if (!sections.length) {
      this.error(
        `No sections found in file ${flags.file}. Do you have a correct file?`,
        { exit: 1 }
      )
      return
    }

    const initialSection = suggestSection(file.sections)(repoDetails)
    let response
    if (flags.prompt) {
      response = await addPrompt(repoDetails, sections, initialSection)
    } else {
      response = {
        section: initialSection,
        desc: repoDetails.desc,
        homepage: !repoDetails.homepage,
      }

      const listItem: ListItem = {
        name: repoDetails.name,
        url: repoDetails.url,
        desc: response.desc.trim(),
      }
      if (response.homepage) {
        listItem.extras = [repoDetails.homepage]
      }
      const updatedFile = addItemToSection(
        file,
        listItem,
        Number(response.section) // marshalling back 'coz Enquirer doesn't like non-strings
      )
      if (flags.write) {
        writeListFile(flags.file, updatedFile)
      } else {
        this.log(serializeFile(updatedFile))
      }
    }
  }
}
