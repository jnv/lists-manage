import { Command } from '@cliffy/command'
import { gitDir } from '../git.ts'
import { urlExistsInFile } from '../listFile/duplicate.ts'
import {
  addItemToSection,
  loadListFile,
  writeListFile,
} from '../listFile/index.ts'
import { normalizeDesc } from '../normalize.ts'
import { addPrompt, repoPrompt } from '../prompts/index.ts'
import { fetchRepoDetails } from '../repo/index.ts'
import { serializeFile } from '../serializer/index.ts'
import { suggestSection } from '../suggestSection.ts'
import type { ListItem } from '../types.ts'

export function addCommand() {
  return new Command()
    .description('Add list URL to the Markdown file')
    .option('-f, --file <file:string>', 'markdown file to work with', {
      default: 'README.md',
    })
    .option(
      '-s, --section <name:string>',
      'exact section name; use "lists-manage sections" to list valid names'
    )
    .option(
      '-w, --write, --no-write',
      'modify file in place; enabled by default, prints file contents to stdout when disabled',
      { default: true }
    )
    .option(
      '-p, --prompt, --no-prompt',
      'disable interactive prompt; enabled by default, disabled when output is being redirected',
      { default: !!process.stdout.isTTY }
    )
    .option('-c, --commit, --no-commit', 'commit changes to git', {
      default: false,
      depends: ['write'],
    })
    .arguments('[url:string]')
    .example('add interactive', 'lists-manage add')
    .example(
      'add url',
      'lists-manage add https://github.com/some-user/awesome-list'
    )
    .example(
      'add no-write',
      'lists-manage add --no-write https://github.com/some-user/awesome-list'
    )
    .action(async (options, url?) => {
      const file = options.file as unknown as string
      const write = options.write as unknown as boolean
      const promptEnabled = options.prompt as unknown as boolean
      const commit = options.commit as unknown as boolean

      if (!file) {
        console.error('Missing file')
        process.exit(1)
      }

      let repoUrl = url
      if (!repoUrl && !promptEnabled) {
        console.error('Repository URL not specified and prompting is disabled')
        process.exit(1)
      }
      if (!repoUrl) {
        repoUrl = await repoPrompt()
      }

      const listFile = await loadListFile(file)

      const sections = listFile.sections.map(({ name }, value) => ({
        name,
        value,
      }))
      if (!sections.length) {
        console.error(
          `No sections found in file ${file}. Do you have a correct file?`
        )
        process.exit(1)
      }

      let selectedSection: number | undefined
      if (options.section !== undefined) {
        const matches = sections.filter(({ name }) => name === options.section)
        if (matches.length !== 1) {
          console.error(
            `${matches.length ? 'Ambiguous' : 'Unknown'} section ${JSON.stringify(options.section)}. Run lists-manage sections --file ${JSON.stringify(file)} to list valid names.`
          )
          process.exit(1)
        }
        selectedSection = matches[0].value
      }

      const repoDetails = await fetchRepoDetails(repoUrl)
      if (urlExistsInFile(listFile, repoDetails.url)) {
        console.error('URL is already present in file, exiting.')
        process.exit(1)
      }

      repoDetails.desc = normalizeDesc(repoDetails.desc)
      const initialSection =
        selectedSection ?? suggestSection(listFile.sections)(repoDetails)
      const response = promptEnabled
        ? await addPrompt(repoDetails, sections, initialSection)
        : {
            section: initialSection,
            desc: repoDetails.desc,
            homepage: !!repoDetails.homepage,
          }

      const listItem: ListItem = {
        name: repoDetails.name,
        url: repoDetails.url,
        desc: response.desc.trim(),
      }
      if (response.homepage) {
        listItem.extras = [repoDetails.homepage]
      }
      const updatedFile = addItemToSection(listFile, listItem, response.section)
      if (write) {
        console.log(`Writing to file ${file}`)
        await writeListFile(file, updatedFile)
      } else {
        console.log(serializeFile(updatedFile))
      }

      if (commit) {
        console.log(`Commiting change`)
        const message = `Add ${repoDetails.name}`
        await gitDir(process.cwd()).commit(file, message)
      }
    })
}
