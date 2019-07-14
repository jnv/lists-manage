import { urlExistsInFile } from '../duplicate'
import { ListFile } from '../../types'

describe('.urlExistsInFile', () => {
  const list = [
    { name: 'aksh', url: 'https://github.com/svaksha/aksh' },
    { name: 'recipes', url: 'https://github.com/csclug/recipes' },
    { name: 'weekly', url: 'https://github.com/zenany/weekly' },
  ]

  const file: ListFile = {
    prefix: 'prefix',
    suffix: 'suffix',
    sections: [
      { level: 1, name: 'Section one', items: list },
      { level: 2, name: 'Section two', items: list },
    ],
  }
  test('URL is not in file', () => {
    expect(urlExistsInFile(file, 'https://github.com/some/different-url')).toBe(
      false
    )
  })

  test('URL is in file', () => {
    expect(urlExistsInFile(file, 'https://github.com/zenany/weekly')).toBe(true)
  })
})
