import test from 'node:test';
import assert, { partialDeepStrictEqual } from 'node:assert/strict';
import { parseItems } from '../items.ts';

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
        note: undefined,
        author: undefined,
      },
    ],
  },
  {
    name: 'item with author and note',
    input: [
      '* [recipes](https://github.com/silizuo/recipes) *In Chinese and English* by @silizuo',
      '- [Front-end-Web-Development-Interview-Question](https://github.com/paddingme/Front-end-Web-Development-Interview-Question) _In Chinese_',
    ],
    expected: [
      {
        name: 'recipes',
        url: 'https://github.com/silizuo/recipes',
        note: 'In Chinese and English',
        author: 'silizuo',
      },
      {
        name: 'Front-end-Web-Development-Interview-Question',
        url: 'https://github.com/paddingme/Front-end-Web-Development-Interview-Question',
        note: 'In Chinese',
        author: undefined,
      },
    ],
  },
  {
    name: 'item with author and description',
    input: [
      '* [python-github-projects](https://github.com/checkcheckzz/python-github-projects) – Collect and classify python projects on Github.',
      '  * http://itgeekworkhard.com/python-github-projects/',
      '  - another line',
    ],
    expected: [
      {
        name: 'python-github-projects',
        url: 'https://github.com/checkcheckzz/python-github-projects',
        desc: 'Collect and classify python projects on Github.',
        extras: [
          'http://itgeekworkhard.com/python-github-projects/',
          'another line',
        ],
        note: undefined,
        author: undefined,
      },
    ],
  },
  {
    name: 'link in description',
    input: [
      "- [isaacs/reading-list](https://github.com/isaacs/reading-list) – [isaac](https://github.com/isaacs)'s reading list.",
    ],
    expected: [
      {
        name: 'isaacs/reading-list',
        url: 'https://github.com/isaacs/reading-list',
        desc: "[isaac](https://github.com/isaacs)'s reading list.",
        note: undefined,
        author: undefined,
      },
    ],
  },
];

testCases.forEach(({ name, input, expected }) => {
  test(name, () => {
    partialDeepStrictEqual(parseItems(input), expected);
  });
});

test('multiple items with extras', () => {
  const input = [
    '* [learnxinyminutes-docs](https://github.com/adambard/learnxinyminutes-docs) – Code documentation written as code!',
    '  * https://learnxinyminutes.com/',
    '- [no-free-basics](https://github.com/net-neutrality/no-free-basics) – Those who have spoken up against Facebook\'s “Free Basics”',
    '  - https://net-neutrality.github.io/no-free-basics/',
    '* [recipes](https://github.com/csclug/recipes) by @csclug – Delicious open source',
  ];
  const expected = [
    {
      name: 'learnxinyminutes-docs',
      url: 'https://github.com/adambard/learnxinyminutes-docs',
      desc: 'Code documentation written as code!',
      extras: ['https://learnxinyminutes.com/'],
      note: undefined,
      author: undefined,
    },
    {
      name: 'no-free-basics',
      url: 'https://github.com/net-neutrality/no-free-basics',
      desc: "Those who have spoken up against Facebook's “Free Basics”",
      extras: ['https://net-neutrality.github.io/no-free-basics/'],
      note: undefined,
      author: undefined,
    },
    {
      name: 'recipes',
      url: 'https://github.com/csclug/recipes',
      desc: 'Delicious open source',
      author: 'csclug',
      note: undefined,
    },
  ];
  assert.deepStrictEqual(parseItems(input), expected);
});
