import { urlExistsInFile } from '../duplicate'
import { ListFile } from '../../types'

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
  test('URL is not in file', () => {
    expect(urlExistsInFile(file, 'https://github.com/some/different-url')).toBe(
      true
    )
  })

  test('URL is in file', () => {
    expect(urlExistsInFile(file, 'https://github.com/zenany/weekly')).toBe(true)
  })

  it('matches duplicate without case sensitivity', () => {
    expect(
      urlExistsInFile(file, 'https://github.com/lembed/awesome-arduino')
    ).toBe(true)
  })
})
