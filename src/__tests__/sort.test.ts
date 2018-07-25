import { sortItems } from '../sort'

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
