import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSections } from '../sections.ts';

test('empty sections', () => {
  const input = [
    '# Ignored section',
    '## Level 1',
    '### Level 2',
    '#### Level 3',
  ];
  const expected = [
    { name: 'Level 1', level: 1, items: [] },
    { name: 'Level 2', level: 2, items: [] },
    { name: 'Level 3', level: 3, items: [] },
  ];
  assert.partialDeepStrictEqual(parseSections(input), expected);
});

test('section items', () => {
  const input = [
    '## Level 1',
    '* [some link](http://example.com) - Whatever I put here',
    '',
    '### Level 2',
    '* [some other link](http://example.org)',
  ];
  const expected = [
    {
      name: 'Level 1', level: 1, items: [
        {
          name: 'some link',
          url: 'http://example.com',
          desc: 'Whatever I put here',
        },
      ]
    },
    {
      name: 'Level 2', level: 2, items: [
        {
          name: 'some other link',
          url: 'http://example.org',
        },
      ]
    },
  ];
  assert.partialDeepStrictEqual(parseSections(input), expected);
});
