import { prompt } from 'enquirer'
import { RepoDetail } from '../types'

export type SectionsChoice = { name: string; value: string }

type RepoPromptResults = {
  url: string
}
type AddPromptResults = {
  desc: string
  section: string
  homepage: boolean
}

export async function repoPrompt(): Promise<string> {
  const result: RepoPromptResults = await prompt({
    type: 'input',
    name: 'url',
    message: 'Enter repository URL:',
  })
  return result.url
}
export function addPrompt(
  repoDetail: RepoDetail,
  sections: SectionsChoice[],
  initialSection: number
): Promise<AddPromptResults> {
  return prompt([
    {
      type: 'select',
      name: 'section',
      message: 'Select a list section:',
      choices: sections,
      initial: initialSection,
      result(): string {
        // @ts-ignore
        return this.focused.value
      },
    },
    {
      type: 'input',
      name: 'desc',
      message: 'Enter list description (optional):',
      initial: repoDetail.desc,
    },
    {
      type: 'confirm',
      name: 'homepage',
      message: `Include list's homepage (${repoDetail.homepage})?`,
      skip: !repoDetail.homepage,
    },
  ])
}
