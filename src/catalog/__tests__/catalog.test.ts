import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { parseFile } from '../../parser/file.ts'
import { createCatalog, keywordMatches, parseTopicConfig } from '../model.ts'
import { catalogAssets } from '../render.ts'

const source = `# Catalog
<!-- lists-start -->
## Technical
* [django](https://example.com/django) – A framework.
### awesome-*
* [awesome-csharp](https://example.com/csharp) _In Czech_ by @alice – **C#** and [tools](https://example.com/tools).
  - https://example.com/home
  - See [another list](https://example.com/another).
## Non-technical
* [café](https://example.com/cafe) – Coffee.
<!-- lists-end -->
`
const config = parseTopicConfig({
  version: 1,
  rules: [
    { tag: 'programming language', keywords: ['csharp', 'c#', 'go'] },
    { tag: 'food', keywords: ['cafe'] },
  ],
})

test('offline catalog preserves metadata, ancestry, and broad literal topic matches', () => {
  const catalog = createCatalog(parseFile(source), config)
  assert.equal(catalog.entries.length, 3)
  const csharp = catalog.entries.find(
    (entry) => entry.name === 'awesome-csharp'
  )
  assert.deepEqual(csharp?.categories, ['Technical', 'awesome-*'])
  assert.deepEqual(csharp?.tags, ['programming language'])
  assert.equal(csharp?.author, 'alice')
  assert.equal(csharp?.note, 'In Czech')
  assert.equal(csharp?.extras.length, 2)
  assert.deepEqual(
    catalog.entries.find((entry) => entry.name === 'django')?.tags,
    []
  )
  assert.deepEqual(
    catalog.entries.find((entry) => entry.name === 'café')?.tags,
    ['food']
  )
  assert.ok(keywordMatches('awesome-C#_resources', 'c#'))
  assert.ok(!keywordMatches('c#sharp', 'c#'))
  assert.ok(!keywordMatches('ongoing', 'go'))
})

test('invalid rules fail with actionable errors; an empty taxonomy is supported', () => {
  for (const value of [
    null,
    {},
    { version: 2, rules: [] },
    { version: 1, rules: [{ tag: 'x', keywords: [] }] },
    { version: 1, rules: [{ tag: 'x', keywords: [''] }] },
    { version: 1, rules: [{ tag: 'x', keywords: ['x'], regex: true }] },
    {
      version: 1,
      rules: [
        { tag: 'café', keywords: ['x'] },
        { tag: 'CAFE', keywords: ['y'] },
      ],
    },
  ])
    assert.throws(() => parseTopicConfig(value), /Invalid topic configuration/)
  assert.deepEqual(parseTopicConfig({ version: 1, rules: [] }), {
    version: 1,
    rules: [],
  })
})

test('static HTML retains semantic table, formatted descriptions and supplementary links without unsafe HTML', () => {
  const catalog = createCatalog(parseFile(source), config)
  catalog.entries[0].description +=
    ' <script>alert(1)</script> [bad](javascript:alert(1)) <img src=x onerror=alert(1)>'
  catalog.entries[0].url = 'javascript:alert(1)'
  const assets = catalogAssets(catalog, '<Lists>')
  const html = assets['index.html']
  assert.match(html, /<title>&lt;Lists&gt;<\/title>/)
  assert.match(html, /<table>/)
  assert.equal((html.match(/<th scope="row">/g) ?? []).length, 3)
  assert.match(html, /<strong>C#<\/strong>/)
  assert.match(html, /href="https:\/\/example.com\/home">Website<\/a>/)
  assert.match(html, /href="https:\/\/example.com\/another"/)
  assert.match(html, /<datalist id="topics">/)
  assert.doesNotMatch(html, /javascript:|onerror=|<script>alert/)
  assert.doesNotThrow(() => new Function(assets['search.js']))
  assert.deepEqual(JSON.parse(assets['catalog.json']), catalog)
})

test('compiled CLI exports deployable files and rejects bad configuration before writing', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'catalog-test-'))
  const bin = path.resolve('bin/run')
  try {
    await writeFile(path.join(dir, 'README.md'), source)
    await writeFile(path.join(dir, 'topics.json'), JSON.stringify(config))
    execFileSync(
      bin,
      ['export', '--config', 'topics.json', '--output', 'site'],
      { cwd: dir }
    )
    const catalog = JSON.parse(
      await readFile(path.join(dir, 'site/catalog.json'), 'utf8')
    )
    assert.equal(catalog.entries.length, 3)
    assert.match(
      await readFile(path.join(dir, 'site/index.html'), 'utf8'),
      /awesome-csharp/
    )
    await readFile(path.join(dir, 'site/style.css'))
    await readFile(path.join(dir, 'site/search.js'))
    await readFile(path.join(dir, 'site/.nojekyll'))
    await writeFile(path.join(dir, 'topics.json'), '{"version":2}')
    assert.throws(
      () =>
        execFileSync(
          bin,
          ['export', '--config', 'topics.json', '--output', 'bad'],
          { cwd: dir, stdio: 'pipe' }
        ),
      /Invalid topic configuration/
    )
    await assert.rejects(readFile(path.join(dir, 'bad/index.html')), {
      code: 'ENOENT',
    })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
