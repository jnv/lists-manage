import { serializeItems } from '../items'

const input = [
  {
    name: 'learnxinyminutes-docs',
    url: 'https://github.com/adambard/learnxinyminutes-docs',
    desc: 'Code documentation written as code!',
    extras: ['https://learnxinyminutes.com/'],
  },
  {
    name: 'no-free-basics',
    url: 'https://github.com/net-neutrality/no-free-basics',
    desc: "Those who have spoken up against Facebook's “Free Basics”",
    extras: ['https://net-neutrality.github.io/no-free-basics/'],
  },
  {
    name: 'recipes',
    url: 'https://github.com/csclug/recipes',
    desc: 'Delicious open source',
    author: 'csclug',
  },
  {
    name: 'recipes',
    url: 'https://github.com/silizuo/recipes',
    note: 'In Chinese and English',
    author: 'silizuo',
  },
]

describe('.serializeItems', () => {
  test('generates Markdown from items', () => {
    const actual = serializeItems(input)
    const expected = `
* [learnxinyminutes-docs](https://github.com/adambard/learnxinyminutes-docs) – Code documentation written as code!
  - https://learnxinyminutes.com/
* [no-free-basics](https://github.com/net-neutrality/no-free-basics) – Those who have spoken up against Facebook's “Free Basics”
  - https://net-neutrality.github.io/no-free-basics/
* [recipes](https://github.com/csclug/recipes) by @csclug – Delicious open source
* [recipes](https://github.com/silizuo/recipes) _In Chinese and English_ by @silizuo
    `.trim()
    expect(actual).toBe(expected)
  })
})
