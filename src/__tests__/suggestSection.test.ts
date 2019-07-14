import { suggestSection } from '../suggestSection'
import { Section } from '../types'

const sections: Section[] = [
  // 0
  { name: 'Non-technical', level: 1, items: [] },
  // 1
  { name: 'Technical', level: 1, items: [] },
  // 2
  { name: 'awesome-*', level: 2, items: [] },
  // 3
  { name: 'Lists of lists', level: 1, items: [] },
  { name: 'Lists of lists of lists', level: 2, items: [] },
  { name: 'Lists of lists of lists of lists', level: 3, items: [] },
  {
    name: 'Lists of lists of lists of lists of lists',
    level: 4,
    items: [],
  },
  {
    name: 'Lists of lists of lists of lists of lists of lists',
    level: 5,
    items: [],
  },
]

describe('.suggestSection', () => {
  const sectionForRepo = suggestSection(sections)
  it('suggests index for awesome-* lists', () => {
    const repo = {
      name: 'awesome-comparisons',
    }
    expect(sectionForRepo(repo)).toBe(2)
  })

  it('suggests index for recipes', () => {
    const repo = {
      name: 'my-taco-recipes',
    }
    expect(sectionForRepo(repo)).toBe(0)
  })

  it('falls back to technical', () => {
    const repo = {
      name: 'asdasdasd',
    }
    expect(sectionForRepo(repo)).toBe(1)
  })
})
