import test from 'node:test';
import assert from 'node:assert';
import { suggestSection } from '../suggestSection.ts';
import type { Section } from '../types.ts';

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

test('.suggestSection', () => {
  const sectionForRepo = suggestSection(sections)
  test('suggests index for awesome-* lists', () => {
    const repo = {
      name: 'awesome-comparisons',
    }
    assert.strictEqual(sectionForRepo(repo), 2)
  })

  test('suggests index for recipes', () => {
    const repo = {
      name: 'my-taco-recipes',
    }
    assert.strictEqual(sectionForRepo(repo), 0)
  })

  test('falls back to technical', () => {
    const repo = {
      name: 'asdasdasd',
    }
    assert.strictEqual(sectionForRepo(repo), 1)
  })
})
