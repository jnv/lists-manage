import { Input } from '@cliffy/prompt/input'
import { Select } from '@cliffy/prompt/select'
import { Confirm } from '@cliffy/prompt/confirm'
import type { RepoDetail } from '../types.ts'

export type SectionsChoice = { name: string; value: number }

type AddPromptResults = {
  desc: string
  section: number
  homepage: boolean
}

export async function repoPrompt(): Promise<string> {
  return Input.prompt({ message: 'Enter repository URL:' })
}

export async function addPrompt(
  repoDetail: RepoDetail,
  sections: SectionsChoice[],
  initialSection: number
): Promise<AddPromptResults> {
  const section = await Select.prompt({
    message: 'Select a list section:',
    options: sections,
    default: initialSection,
  })

  const desc = await Input.prompt({
    message: 'Enter list description (optional):',
    default: repoDetail.desc,
  })

  let homepage = false
  if (repoDetail.homepage) {
    homepage = await Confirm.prompt({
      message: `Include list's homepage (${repoDetail.homepage})?`,
    })
  }

  return { section, desc, homepage }
}
