import { confirm, input, select } from '@inquirer/prompts'
import type { RepoDetail } from '../types.ts'

export type SectionsChoice = { name: string; value: number }

type AddPromptResults = {
  desc: string
  section: number
  homepage: boolean
}

export async function repoPrompt(): Promise<string> {
  return input({ message: 'Enter repository URL:' })
}

export async function addPrompt(
  repoDetail: RepoDetail,
  sections: SectionsChoice[],
  initialSection: number
): Promise<AddPromptResults> {
  const section = await select({
    message: 'Select a list section:',
    choices: sections,
    default: initialSection,
  })

  const desc = await input({
    message: 'Enter list description (optional):',
    default: repoDetail.desc,
  })

  let homepage = false
  if (repoDetail.homepage) {
    homepage = await confirm({
      message: `Include list's homepage (${repoDetail.homepage})?`,
      default: false,
    })
  }

  return { section, desc, homepage }
}
