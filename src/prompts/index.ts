import { Input, Select, Confirm } from '@cliffy/prompt'
import type { RepoDetail } from '../types.ts'

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
  const url = await Input.prompt('Enter repository URL:')
  return url
}

export async function addPrompt(
  repoDetail: RepoDetail,
  sections: SectionsChoice[],
  initialSection: number
): Promise<AddPromptResults> {
  const section = await Select.prompt({
    message: 'Select a list section:',
    options: sections.map((s) => ({ name: s.name, value: s.value })),
    default: sections[initialSection]?.value,
  })
  const desc = await Input.prompt({
    message: "Enter list description (optional):",
    default: repoDetail.desc,
  })
  let homepage = false
  if (repoDetail.homepage) {
    homepage = await Confirm.prompt(
      `Include list's homepage (${repoDetail.homepage})?`
    )
  }
  return { desc, section, homepage }
}
