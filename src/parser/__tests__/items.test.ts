import { Item, parseItems } from '../items'

const testCases = [
  {
    name: 'single line item',
    input: [
      '* [flat-file-cms](https://github.com/ahadb/flat-file-cms) – Stictly flat-file cms systems.',
    ],
    expected: [
      {
        name: 'flat-file-cms',
        desc: 'Stictly flat-file cms systems.',
        url: 'https://github.com/ahadb/flat-file-cms',
      },
    ],
  },
  {
    name: 'item with author and note',
    input: [
      '* [recipes](https://github.com/silizuo/recipes) *In Chinese and English* by @silizuo',
    ],
    expected: [
      {
        name: 'recipes',
        url: 'https://github.com/silizuo/recipes',
        note: 'In Chinese and English',
        author: 'silizuo',
      },
    ],
  },
  {
    name: 'item with author and description',
    input: [
      '* [Hackathon-Resources](https://github.com/xasos/Hackathon-Resources) by @xasos – Hackathon Resources for organizers.',
    ],
    expected: [
      {
        name: 'Hackathon-Resources',
        url: 'https://github.com/xasos/Hackathon-Resources',
        desc: 'Hackathon Resources for organizers.',
        author: 'xasos',
      },
    ],
  },
]

for (const testCase of testCases) {
  test(testCase.name, () => {
    expect(parseItems(testCase.input)).toEqual(testCase.expected)
  })
}
