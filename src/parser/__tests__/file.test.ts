import test from 'node:test';
import assert, { partialDeepStrictEqual } from 'node:assert/strict';
import { parseFile } from '../file.ts';

test('file with prefix, suffix', () => {
  const input = `
Prefix here.

<!-- lists-start -->

## Some section

* [learnxinyminutes-docs](https://github.com/adambard/learnxinyminutes-docs) – Code documentation written as code!
  * https://learnxinyminutes.com/
<!-- lists-end -->

Suffix here.
`
  const result = parseFile(input)
  const expected = {
    prefix: '\nPrefix here.\n\n<!-- lists-start -->',
    sections: [
      {
        level: 1,
        name: 'Some section',
        items: [
          {
            desc: 'Code documentation written as code!',
            extras: [
              'https://learnxinyminutes.com/'
            ],
            name: 'learnxinyminutes-docs',
            url: 'https://github.com/adambard/learnxinyminutes-docs'
          }
        ]
      }
    ],
    suffix: '<!-- lists-end -->\n\nSuffix here.\n',
  }
  assert.partialDeepStrictEqual(result, expected)
})

test('ignores consecutive start / end markers', () => {
  const input = `Prefix.
blah blah <!-- lists-start -->
blah
<!-- lists-start -->
<!-- lists-start -->

## Some section

<!-- lists-end -->
Suffix
<!-- lists-end -->
blah.
`
  const result = parseFile(input)
  const expected = {
    prefix: 'Prefix.\nblah blah <!-- lists-start -->',
    suffix: '<!-- lists-end -->\nSuffix\n<!-- lists-end -->\nblah.\n',
    sections: [{ level: 1, name: 'Some section', items: [] }],
  }
  assert.deepStrictEqual(result, expected)
})
