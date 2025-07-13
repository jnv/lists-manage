import { describe, it } from 'node:test';
import assert from 'node:assert';
import { sortItems, sortFile } from '../sort.ts';
import type { ListFile } from '../../types.ts';

describe('.sortItems', () => {
  it('sorts items by name', () => {
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

    assert.deepEqual(sortItems(input), expected)
  })

  it('sorting is case insensitive', () => {
    const input = [
      {
        name: 'Annual-Reading-List',
        url: 'https://github.com/davidskeck/Annual-Reading-List',
      },
      {
        name: 'aksh',
        url: 'https://github.com/svaksha/aksh',
      },
    ]
    const expected = [
      {
        name: 'aksh',
        url: 'https://github.com/svaksha/aksh',
      },
      {
        name: 'Annual-Reading-List',
        url: 'https://github.com/davidskeck/Annual-Reading-List',
      },
    ]

    assert.deepEqual(sortItems(input), expected)
  })

  it('sorting is stable', () => {
    const expected = [
      {
        name: 'awesome-sharepoint',
        author: 'BSUG',
        url: 'https://github.com/BSUG/awesome-sharepoint',
      },
      {
        name: 'awesome-SharePoint',
        author: 'siaf',
        url: 'https://github.com/siaf/awesome-SharePoint',
      },
    ]
    assert.deepEqual(sortItems(expected), expected)
  })

  it('sorting ignores dashes', () => {
    const input = [
      { name: 'awesome-b', url: 'https://github.com/github/awesome-b' },
      { name: 'awesomea', url: 'https://github.com/github/awesomea' },
    ]
    const expected = [
      { name: 'awesomea', url: 'https://github.com/github/awesomea' },
      { name: 'awesome-b', url: 'https://github.com/github/awesome-b' },
    ]

    assert.deepEqual(sortItems(input), expected)
  })

  describe('for duplicate names', () => {
    it('adds author and sorts by it', () => {
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
      assert.deepEqual(sortItems(input), expected)
    })

    it('compares names case-insensitively', () => {
      const input = [
        {
          name: 'awesome-SharePoint',
          url: 'https://github.com/siaf/awesome-SharePoint',
        },
        {
          name: 'awesome-sharepoint',
          url: 'https://github.com/BSUG/awesome-sharepoint',
        },
      ]
      const expected = [
        {
          name: 'awesome-sharepoint',
          author: 'BSUG',
          url: 'https://github.com/BSUG/awesome-sharepoint',
        },
        {
          name: 'awesome-SharePoint',
          author: 'siaf',
          url: 'https://github.com/siaf/awesome-SharePoint',
        },
      ]
      assert.deepEqual(sortItems(input), expected)
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

    assert.deepEqual(sortFile(input), expected)
  })
})
