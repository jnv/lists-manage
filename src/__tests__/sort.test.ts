import { sortItems, sortFile } from '../sort'
import { ListFile } from '../types'

describe('.sortItems', () => {
  test('sorts items by name', () => {
    const input = Object.freeze([
      { name: 'recipes', url: 'https://github.com/csclug/recipes' },
      { name: 'weekly', url: 'https://github.com/zenany/weekly' },
      { name: 'aksh', url: 'https://github.com/svaksha/aksh' },
    ])

    const expected = [
      { name: 'aksh', url: 'https://github.com/svaksha/aksh' },
      { name: 'recipes', url: 'https://github.com/csclug/recipes' },
      { name: 'weekly', url: 'https://github.com/zenany/weekly' },
    ]

    expect(sortItems(input)).toEqual(expected)
  })

  describe('for duplicate names', () => {
    test('adds author and sorts by it', () => {
      const input = Object.freeze([
        { name: 'recipes', url: 'https://github.com/csclug/recipes' },
        { name: 'recipes', url: 'https://github.com/bzimmerman/recipes' },
        { name: 'aksh', url: 'https://github.com/svaksha/aksh' },
      ])
      const expected = [
        { name: 'aksh', url: 'https://github.com/svaksha/aksh' },
        {
          name: 'recipes',
          author: 'bzimmerman',
          url: 'https://github.com/bzimmerman/recipes',
        },
        {
          name: 'recipes',
          author: 'csclug',
          url: 'https://github.com/csclug/recipes',
        },
      ]
      expect(sortItems(input)).toEqual(expected)
    })
  })
})

describe('.sortFile', () => {
  it('sorts all sections in file', () => {
    const list = [
      { name: 'recipes', url: 'https://github.com/csclug/recipes' },
      { name: 'weekly', url: 'https://github.com/zenany/weekly' },
      { name: 'aksh', url: 'https://github.com/svaksha/aksh' },
    ]

    const sortedList = [
      { name: 'aksh', url: 'https://github.com/svaksha/aksh' },
      { name: 'recipes', url: 'https://github.com/csclug/recipes' },
      { name: 'weekly', url: 'https://github.com/zenany/weekly' },
    ]

    const input: ListFile = {
      prefix: 'prefix',
      suffix: 'suffix',
      sections: [
        { level: 1, name: 'Section one', items: list },
        { level: 2, name: 'Section two', items: list },
      ],
    }

    const expected: ListFile = {
      prefix: 'prefix',
      suffix: 'suffix',
      sections: [
        { level: 1, name: 'Section one', items: sortedList },
        { level: 2, name: 'Section two', items: sortedList },
      ],
    }

    expect(sortFile(input)).toEqual(expected)
  })
})
