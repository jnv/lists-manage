import { parseSections } from '../sections'

test('empty sections', () => {
  const input = [
    '# Ignored section',
    '## Level 1',
    '### Level 2',
    '#### Level 3',
  ]

  const expected = [
    { name: 'Level 1', level: 1, items: [] },
    { name: 'Level 2', level: 2, items: [] },
    { name: 'Level 3', level: 3, items: [] },
  ]

  expect(parseSections(input)).toEqual(expected)
})

test('section items', () => {
  const input = [
    '## Level 1',
    '* [some link](http://example.com) - Whatever I put here',
    '',
    '### Level 2',
    '* [some other link](http://example.org)',
  ]

  const expected = [
    expect.objectContaining({ name: 'Level 1', level: 1 }),
    expect.objectContaining({ name: 'Level 2', level: 2 }),
  ]

  const output = parseSections(input)

  expect(output).toEqual(expected)
  for (const section of output) {
    expect(section.items).toHaveLength(1)
  }
})
