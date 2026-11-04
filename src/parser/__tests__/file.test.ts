import assert from 'node:assert/strict'
import test from 'node:test'
import { parseFile } from '../file.ts'

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
            extras: ['https://learnxinyminutes.com/'],
            name: 'learnxinyminutes-docs',
            url: 'https://github.com/adambard/learnxinyminutes-docs',
          },
        ],
      },
    ],
    suffix: '<!-- lists-end -->\n\nSuffix here.\n',
  }
  assert.partialDeepStrictEqual(result, expected)
})

test('rejects missing, repeated, or out-of-order list markers', () => {
  for (const input of [
    'No markers',
    '<!-- lists-start -->\n## Technical\nLicense text',
    '<!-- lists-end -->',
    '<!-- lists-end -->\n<!-- lists-start -->',
    '<!-- lists-start -->\n<!-- lists-start -->\n<!-- lists-end -->',
    '<!-- lists-start -->\n<!-- lists-end -->\n<!-- lists-end -->',
    '<!-- lists-start -->\n<!-- lists-end -->\n<!-- lists-start -->',
    '<!-- lists-start --> <!-- lists-end -->',
  ]) {
    assert.throws(() => parseFile(input), /Expected .*lists-/)
  }
})

test('preserves arbitrary content outside the list markers', () => {
  const result = parseFile(`<!-- Maintainer notes -->
License text.
<!-- lists-start -->
## Technical
* [tools](https://example.com/tools)
<!-- lists-end -->
<!-- Footer comment -->
More license text.
`)
  assert.equal(
    result.prefix,
    '<!-- Maintainer notes -->\nLicense text.\n<!-- lists-start -->'
  )
  assert.equal(
    result.suffix,
    '<!-- lists-end -->\n<!-- Footer comment -->\nMore license text.\n'
  )
})
