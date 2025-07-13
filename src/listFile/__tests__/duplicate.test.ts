import { describe, it } from 'node:test'
import assert from 'node:assert'
import { urlExistsInFile } from '../duplicate.ts'
import type { ListFile } from '../../types.ts'

describe('.urlExistsInFile', () => {
  const list = [
    { name: 'aksh', url: 'https://github.com/svaksha/aksh' },
    { name: 'recipes', url: 'https://github.com/csclug/recipes' },
    { name: 'weekly', url: 'https://github.com/zenany/weekly' },
    {
      name: 'Awesome-arduino',
      url: 'https://github.com/LEMBED/Awesome-arduino',
    },
  ]

  const file: ListFile = {
    prefix: 'prefix',
    suffix: 'suffix',
    sections: [
      { level: 1, name: 'Section one', items: list },
      { level: 2, name: 'Section two', items: list },
    ],
  }

  it('returns false when URL is not in file', () => {
    assert.strictEqual(urlExistsInFile(file, 'https://github.com/some/different-url'), false)
  })

  it('returns true when URL is in file', () => {
    assert.strictEqual(urlExistsInFile(file, 'https://github.com/zenany/weekly'), true)
  })

  it('matches duplicate without case sensitivity', () => {
    assert.strictEqual(
      urlExistsInFile(file, 'https://github.com/lembed/awesome-arduino'),
      true
    )
  })
})
