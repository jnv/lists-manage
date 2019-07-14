import { ListFile } from '../../types'
import { addItemToSection } from '..'

describe('.addItemToSection', () => {
  it('adds item to a particular section and sorts it', () => {
    const sectionIdx = 1
    const newItem = { name: 'aksh', url: 'https://github.com/svaksha/aksh' }

    const originalList = [
      { name: 'recipes', url: 'https://github.com/csclug/recipes' },
      { name: 'weekly', url: 'https://github.com/zenany/weekly' },
    ]

    const newList = [
      { name: 'aksh', url: 'https://github.com/svaksha/aksh' },
      { name: 'recipes', url: 'https://github.com/csclug/recipes' },
      { name: 'weekly', url: 'https://github.com/zenany/weekly' },
    ]

    const input: ListFile = {
      prefix: 'prefix',
      suffix: 'suffix',
      sections: [
        { level: 1, name: 'Section one', items: originalList },
        { level: 2, name: 'Section two', items: originalList },
      ],
    }

    const expected: ListFile = {
      prefix: 'prefix',
      suffix: 'suffix',
      sections: [
        { level: 1, name: 'Section one', items: originalList },
        { level: 2, name: 'Section two', items: newList },
      ],
    }

    const result = addItemToSection(input, newItem, sectionIdx)
    expect(result).toEqual(expected)
  })
})
