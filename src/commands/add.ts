import { Command } from '@cliffy/command'
import { loadListFile, addItemToSection, writeListFile } from '../listFile/index.ts'
import { serializeFile } from '../serializer/index.ts'
import { fetchRepoDetails } from '../repo/index.ts'
import { suggestSection } from '../suggestSection.ts'
import type { ListItem } from '../types.ts'
import { repoPrompt, addPrompt } from '../prompts/index.ts'
import { urlExistsInFile } from '../listFile/duplicate.ts'
import { normalizeDesc } from '../normalize.ts'
import { gitDir } from '../git.ts'

export function addCommand() {
  return new Command()
    .description('Add list URL to the Markdown file')
    .option('-f, --file <file:string>', 'markdown file to work with', { default: 'README.md' })
    .option('-w, --write, --no-write', 'modify file in place; enabled by default, prints file contents to stdout when disabled', { default: true })
    .option('-p, --prompt, --no-prompt', 'disable interactive prompt; enabled by default, disabled when output is being redirected', { default: !!process.stdout.isTTY })
    .option('-c, --commit, --no-commit', 'commit changes to git', { default: false, depends: ['write'] })
    .arguments('[url:string]')
    .example('add interactive', 'lists-manage add')
    .example('add url', 'lists-manage add https://github.com/some-user/awesome-list')
    .example('add no-write', 'lists-manage add --no-write https://github.com/some-user/awesome-list')
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

      const repoDetails = await fetchRepoDetails(repoUrl)
      const listFile = await loadListFile(file)

      if (urlExistsInFile(listFile, repoDetails.url)) {
        console.error('URL is already present in file, exiting.')
        process.exit(1)
      }

      const sections = listFile.sections.map(
        ({ name }, value) => ({ name, value })
      )
      if (!sections.length) {
        console.error(`No sections found in file ${file}. Do you have a correct file?`)
        process.exit(1)
      }

      repoDetails.desc = normalizeDesc(repoDetails.desc)
      const initialSection = suggestSection(listFile.sections)(repoDetails)
      let response
      if (promptEnabled) {
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
        listFile,
        listItem,
        response.section
      )
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
