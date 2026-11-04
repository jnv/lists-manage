import { Confirm, Input, Select } from '@cliffy/prompt'
import type { RepoDetail } from '../types.ts'

export type SectionsChoice = { name: string; value: number }

type AddPromptResults = {
  desc: string
  note: string
  section: number
  homepage: boolean
}

export async function repoPrompt(): Promise<string> {
  return Input.prompt({ message: 'Enter repository URL:' })
}

export async function addPrompt(
  repoDetail: RepoDetail,
  sections: SectionsChoice[],
  initialSection: number,
  initialNote = ''
): Promise<AddPromptResults> {
  const section = await Select.prompt({
    message: 'Select a list section:',
    options: sections,
    default: initialSection,
    search: true,
  })

  const desc = await Input.prompt({
    message: 'Enter list description (optional):',
    default: repoDetail.desc,
  })

  const note = await Input.prompt({
    message:
      'Enter list note (optional, e.g. "In Chinese"; leave empty to skip):',
    default: initialNote,
  })

  let homepage = false
  if (repoDetail.homepage) {
    homepage = await Confirm.prompt({
      message: `Include list's homepage (${repoDetail.homepage})?`,
      default: false,
    })
  }

  return { section, desc, note, homepage }
}
