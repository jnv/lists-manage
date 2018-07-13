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
