import test from 'node:test';
import assert from 'node:assert';
import { serializeFile } from '../index.ts';

const input = {
  prefix: '\nPrefix here.\n\n<!-- lists-start -->',
  sections: [
    {
      level: 1,
      name: 'Some section',
      items: [
        {
          name: 'learnxinyminutes-docs',
          url: 'https://github.com/adambard/learnxinyminutes-docs',
          desc: 'Code documentation written as code!',
          extras: ['https://learnxinyminutes.com/'],
        },
      ],
    },
    {
      level: 2,
      name: 'Some subsection',
      items: [
        {
          name: 'learnxinyminutes-docs',
          url: 'https://github.com/adambard/learnxinyminutes-docs',
        },
      ],
    },
  ],
  suffix: '<!-- lists-end -->\n\nSuffix here.\n',
}

const expected = `
Prefix here.

<!-- lists-start -->

## Some section

* [learnxinyminutes-docs](https://github.com/adambard/learnxinyminutes-docs) – Code documentation written as code!
  - https://learnxinyminutes.com/


### Some subsection

* [learnxinyminutes-docs](https://github.com/adambard/learnxinyminutes-docs)

<!-- lists-end -->

Suffix here.
`

test('serializeFile converts file to Markdown', () => {
  assert.strictEqual(serializeFile(input), expected)
})
