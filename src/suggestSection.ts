import type { Section, RepoDetail } from './types.ts'
const MATCH_SECTION = Object.freeze([
  [/recipe/i, /Non-technical/i],
  [/food/i, /Non-technical/i],
  [/^awesome.?awesome/i, /Lists of lists/],
  [/^awesome/i, /awesome-\*/],
  [/.*/, /Technical/],
])

type SuggestionInput = Pick<RepoDetail, 'name'>
type NameToIdx = [RegExp, number][]

function buildSectionMatchIndexes(sections: Section[]): NameToIdx {
  const nameToIdx = []
  for (const [nameRegex, sectionRegex] of MATCH_SECTION) {
    const idx = sections.findIndex(({ name }): boolean =>
      sectionRegex.test(name)
    )
    if (idx > -1) {
      nameToIdx.push([nameRegex, idx] as [RegExp, number])
    } else {
      console.warn(`No section matching ${sectionRegex} found`)
    }
  }
  return nameToIdx
}

export function suggestSection(
  sections: Section[]
): (arg0: SuggestionInput) => number {
  const nameToIdx = buildSectionMatchIndexes(sections)
  return function sectionIdxForRepo({ name }: SuggestionInput): number {
    const result = nameToIdx.find(([nameRegex]): boolean =>
      nameRegex.test(name)
    )
    if (result) {
      return result[1]
    }
    return 0
  }
}
