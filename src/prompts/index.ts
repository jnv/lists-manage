import { prompt } from 'enquirer'
import { RepoDetail } from '../types'

export type SectionsChoice = { name: string; value: string }
type AddPromptResults = {
  desc: string
  section: string
  homepage: boolean
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
      initial: String(initialSection),
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
