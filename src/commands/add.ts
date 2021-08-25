import { Command, flags } from '@oclif/command'
import { loadListFile, addItemToSection, writeListFile } from '../listFile'
import { serializeFile } from '../serializer'
import { fetchRepoDetails } from '../repo'
import { suggestSection } from '../suggestSection'
import { ListItem } from '../types'
import { repoPrompt, addPrompt } from '../prompts'
import { urlExistsInFile } from '../listFile/duplicate'
import { normalizeDesc } from '../normalize'
import { gitDir } from '../git'

export class AddList extends Command {
  public static description = 'Add list URL to the Markdown file'

  static strict = false

  static examples = [
    '$ lists-manage add',
    '$ lists-manage add https://github.com/some-user/awesome-list',
    '$ lists-manage add --no-write https://github.com/some-user/awesome-list',
  ]

  public static flags = {
    help: flags.help({ char: 'h' }),
    file: flags.string({
      char: 'f',
      description: 'markdown file to work with',
      default: 'README.md',
    }),
    write: flags.boolean({
      char: 'w',
      description:
        'modify file in place; enabled by default, prints file contents to stdout when disabled',
      default: true,
      allowNo: true,
    }),
    prompt: flags.boolean({
      char: 'p',
      description:
        'disable interactive prompt; enabled by default, disabled when output is being redirected',
      allowNo: true,
      default: process.stdout.isTTY,
    }),
    commit: flags.boolean({
      char: 'c',
      description: 'commit changes to git',
      default: false,
      dependsOn: ['write'],
    }),
  }

  static args = [
    {
      name: 'url',
      required: false,
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

    let repoUrl = args.url
    if (!repoUrl && !flags.prompt) {
      this.error('Repository URL not specified and prompting is disabled')
      return
    }
    if (!repoUrl) {
      repoUrl = await repoPrompt()
    }

    const repoDetails = await fetchRepoDetails(repoUrl)
    const file = await loadListFile(flags.file)

    if (urlExistsInFile(file, repoDetails.url)) {
      this.error('URL is already present in file, exiting.', { exit: 1 })
      return
    }

    const sections = file.sections.map(
      (
        { name },
        value
      ): {
        name: string
        value: string
      } => ({ name, value: String(value) })
    )
    if (!sections.length) {
      this.error(
        `No sections found in file ${flags.file}. Do you have a correct file?`,
        { exit: 1 }
      )
      return
    }

    repoDetails.desc = normalizeDesc(repoDetails.desc)
    const initialSection = suggestSection(file.sections)(repoDetails)
    let response
    if (flags.prompt) {
      response = await addPrompt(repoDetails, sections, initialSection)
    } else {
      response = {
        section: initialSection,
        desc: repoDetails.desc,
        homepage: !!repoDetails.homepage,
      }
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
      this.log(`Writing to file ${flags.file}`)
      await writeListFile(flags.file, updatedFile)
    } else {
      this.log(serializeFile(updatedFile))
    }

    if (flags.commit) {
      this.log(`Commiting change`)
      const message = `Add ${repoDetails.name}`
      await gitDir(process.cwd()).commit(flags.file, message)
    }
  }
}
