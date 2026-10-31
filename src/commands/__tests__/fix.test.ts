import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, type TestContext } from 'node:test'
import { loadListFile } from '../../listFile/index.ts'
import { fixCommand } from '../fix.ts'

const repo = (name: string) => `https://github.com/example/${name}`

async function fixture(t: TestContext, sections: string[][]) {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'lists-manage-fix-')
  )
  t.after(() => fs.rm(directory, { recursive: true, force: true }))
  t.mock.method(console, 'log', () => {})
  t.mock.method(console, 'warn', () => {})
  const filename = path.join(directory, 'README.md')
  await fs.writeFile(
    filename,
    [
      'Prefix',
      '<!-- lists-start -->',
      ...sections.flatMap((names, index) => [
        `## Section ${index}`,
        ...names.map((name) => `* [${name}](${repo(name)}) – Description`),
      ]),
      '<!-- lists-end -->',
      'Suffix',
    ].join('\n')
  )
  return filename
}

function response(url: string, status = 200) {
  const result = new Response(null, { status })
  Object.defineProperty(result, 'url', { value: url })
  return result
}

async function urls(filename: string) {
  const file = await loadListFile(filename)
  return file.sections.map(({ items }) => items.map(({ url }) => url))
}

describe('fix command', () => {
  it('checks every item when adjacent repositories are removed, across sections', async (t) => {
    const filename = await fixture(t, [
      ['a', 'b', 'c'],
      ['d', 'e'],
    ])
    const checked: string[] = []
    t.mock.method(globalThis, 'fetch', async (url: string) => {
      checked.push(url)
      return response(
        url,
        url === repo('e') ? 200 : url === repo('b') ? 451 : 404
      )
    })

    await fixCommand().parse(['--file', filename, '--write'])

    assert.deepEqual(checked, ['a', 'b', 'c', 'd', 'e'].map(repo))
    assert.deepEqual(await urls(filename), [[], [repo('e')]])
  })

  it('does not replace the following item when a redirect ends in a 404', async (t) => {
    const filename = await fixture(t, [['a', 'b']])
    const checked: string[] = []
    t.mock.method(globalThis, 'fetch', async (url: string) => {
      checked.push(url)
      return url === repo('a') ? response(repo('missing'), 404) : response(url)
    })

    await fixCommand().parse(['--file', filename, '--write'])

    assert.deepEqual(checked, ['a', 'b'].map(repo))
    assert.deepEqual(await urls(filename), [[repo('b')]])
  })

  it('updates successful redirects and preserves descriptions', async (t) => {
    const filename = await fixture(t, [['a', 'b']])
    t.mock.method(globalThis, 'fetch', async (url: string) =>
      response(url === repo('a') ? repo('renamed') : url)
    )

    await fixCommand().parse(['--file', filename, '--write'])

    const file = await loadListFile(filename)
    const item = file.sections[0].items.find(
      ({ url }) => url === repo('renamed')
    )
    assert.equal(item?.name, 'renamed')
    assert.equal(item?.desc, 'Description')
    assert.deepEqual(await urls(filename), [[repo('b'), repo('renamed')]])
  })

  it('retains items on network errors and continues checking', async (t) => {
    const filename = await fixture(t, [['a', 'b']])
    t.mock.method(globalThis, 'fetch', async (url: string) => {
      if (url === repo('a')) {
        throw new Error('Network unavailable')
      }
      return response(url, 404)
    })

    await fixCommand().parse(['--file', filename, '--write'])

    assert.deepEqual(await urls(filename), [[repo('a')]])
  })

  it('outputs repairs without writing in stdout mode', async (t) => {
    const filename = await fixture(t, [['a', 'b']])
    const original = await fs.readFile(filename, 'utf8')
    const output: string[] = []
    t.mock.method(console, 'log', (text: string) => output.push(text))
    t.mock.method(globalThis, 'fetch', async (url: string) =>
      response(url, url === repo('a') ? 404 : 200)
    )

    await fixCommand().parse(['--file', filename])

    assert.equal(await fs.readFile(filename, 'utf8'), original)
    assert.equal(output.length, 1)
    assert.doesNotMatch(output[0], /\[a\]/)
    assert.match(output[0], /\[b\]/)
  })

  it('awaits checkpoint writes before checking further items or writing again', async (t) => {
    const names = Array.from({ length: 11 }, (_, index) => `repo-${index}`)
    const filename = await fixture(t, [names])
    const started = Promise.withResolvers<void>()
    const release = Promise.withResolvers<void>()
    let checked = 0
    let writes = 0
    t.mock.method(globalThis, 'fetch', async (url: string) => {
      checked++
      return response(url)
    })
    const writeFile = fs.writeFile
    t.mock.method(
      fs,
      'writeFile',
      async (...args: Parameters<typeof fs.writeFile>) => {
        writes++
        if (writes === 1) {
          started.resolve()
          await release.promise
        }
        return writeFile(...args)
      }
    )

    const running = fixCommand().parse(['--file', filename, '--write'])
    try {
      await started.promise
      assert.equal(checked, 10)
      assert.equal(writes, 1)
    } finally {
      release.resolve()
      await running
    }
    assert.equal(checked, 11)
    assert.equal(writes, 2)
    assert.deepEqual(await urls(filename), [[...names].sort().map(repo)])
  })

  it('propagates checkpoint write failures and leaves the original intact', async (t) => {
    const names = Array.from({ length: 11 }, (_, index) => `repo-${index}`)
    const filename = await fixture(t, [names])
    const original = await fs.readFile(filename, 'utf8')
    let checked = 0
    t.mock.method(globalThis, 'fetch', async (url: string) => {
      checked++
      return response(url)
    })
    t.mock.method(fs, 'writeFile', async () => {
      throw new Error('Disk full')
    })

    await assert.rejects(
      fixCommand().parse(['--file', filename, '--write']),
      /Disk full/
    )
    assert.equal(checked, 10)
    assert.equal(await fs.readFile(filename, 'utf8'), original)
    assert.deepEqual(await fs.readdir(path.dirname(filename)), ['README.md'])
  })
})
