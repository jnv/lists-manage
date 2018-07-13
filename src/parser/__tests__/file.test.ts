import { parseFile } from '../file'

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
            name: 'learnxinyminutes-docs',
            url: 'https://github.com/adambard/learnxinyminutes-docs',
            desc: 'Code documentation written as code!',
            extras: ['https://learnxinyminutes.com/'],
          },
        ],
      },
    ],
    suffix: '<!-- lists-end -->\n\nSuffix here.\n',
  }
  expect(result).toEqual(expected)
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
  expect(result).toEqual(expected)
})
