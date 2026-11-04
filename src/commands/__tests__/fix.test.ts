import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, type TestContext } from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { loadListFile } from '../../listFile/index.ts'
import { fixCommand } from '../fix.ts'

const repo = (name: string) => `https://github.com/example/${name}`

async function fixture(t: TestContext, sections: string[][]) {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'lists-manage-fix-')
  )
  t.after(() => fs.rm(directory, { recursive: true, force: true }))
  const previousRetries = process.env.LISTS_MANAGE_FIX_RETRIES
  process.env.LISTS_MANAGE_FIX_RETRIES = '0'
  t.after(() => {
    if (previousRetries === undefined) {
      delete process.env.LISTS_MANAGE_FIX_RETRIES
    } else {
      process.env.LISTS_MANAGE_FIX_RETRIES = previousRetries
    }
  })
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
      return url === repo('a')
        ? new Response(null, {
            status: 302,
            headers: { location: repo('missing') },
          })
        : response(url, url === repo('missing') ? 404 : 200)
    })

    await fixCommand().parse(['--file', filename, '--write'])

    assert.deepEqual(checked, ['a', 'b', 'missing'].map(repo))
    assert.deepEqual(await urls(filename), [[repo('b')]])
  })

  it('updates successful redirects and preserves descriptions', async (t) => {
    const filename = await fixture(t, [['a', 'b']])
    t.mock.method(globalThis, 'fetch', async (url: string) =>
      url === repo('a')
        ? new Response(null, {
            status: 301,
            headers: { location: repo('renamed') },
          })
        : response(url)
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

    await assert.rejects(
      fixCommand().parse(['--file', filename, '--write']),
      /1 repository check/
    )

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

  it('serializes snapshot checkpoint writes while checks continue', async (t) => {
    const names = Array.from({ length: 11 }, (_, index) => `repo-${index}`)
    const filename = await fixture(t, [names])
    const started = Promise.withResolvers<void>()
    const releaseWrite = Promise.withResolvers<void>()
    const releaseLastCheck = Promise.withResolvers<void>()
    const snapshots: string[] = []
    let checked = 0
    let writing = false
    t.mock.method(globalThis, 'fetch', async (url: string) => {
      checked++
      if (url === repo('repo-10')) {
        await releaseLastCheck.promise
      }
      return response(url, 404)
    })
    const writeFile = fs.writeFile
    t.mock.method(
      fs,
      'writeFile',
      async (...args: Parameters<typeof fs.writeFile>) => {
        assert.equal(writing, false)
        writing = true
        snapshots.push(String(args[1]))
        if (snapshots.length === 1) {
          started.resolve()
          await releaseWrite.promise
        }
        await writeFile(...args)
        writing = false
      }
    )
    const running = fixCommand().parse(['--file', filename, '--write'])
    try {
      await started.promise
      releaseLastCheck.resolve()
      await setImmediate()
      assert.equal(checked, 11)
      assert.equal(snapshots.length, 1)
      assert.match(snapshots[0], /repo-10/)
    } finally {
      releaseLastCheck.resolve()
      releaseWrite.resolve()
      await running
    }
    assert.equal(snapshots.length, 2)
    assert.doesNotMatch(snapshots[1], /repo-10/)
    assert.deepEqual(await urls(filename), [[]])
    assert.deepEqual(await fs.readdir(path.dirname(filename)), ['README.md'])
  })

  it('stops dispatch after checkpoint failure, propagates it, and leaves the file intact', async (t) => {
    const names = Array.from({ length: 60 }, (_, index) => `repo-${index}`)
    const filename = await fixture(t, [names])
    const original = await fs.readFile(filename, 'utf8')
    const cleaned = Promise.withResolvers<void>()
    const release = Promise.withResolvers<void>()
    let checked = 0
    t.mock.method(globalThis, 'fetch', async (url: string) => {
      if (++checked > 10) {
        await release.promise
      }
      return response(url, 404)
    })
    t.mock.method(fs, 'writeFile', async () => {
      throw new Error('Disk full')
    })
    const remove = fs.rm
    t.mock.method(fs, 'rm', async (...args: Parameters<typeof fs.rm>) => {
      await remove(...args)
      if (path.basename(String(args[0])).startsWith('.lists-manage-')) {
        cleaned.resolve()
      }
    })
    const running = assert.rejects(
      fixCommand().parse(['--file', filename, '--write']),
      /Disk full/
    )
    await cleaned.promise
    // Allow the write rejection to reach the scheduler after atomic cleanup.
    await setImmediate()
    const dispatched = checked
    release.resolve()
    await running
    assert.equal(checked, dispatched)
    assert.ok(checked < names.length)
    assert.equal(await fs.readFile(filename, 'utf8'), original)
    assert.deepEqual(await fs.readdir(path.dirname(filename)), ['README.md'])
  })

  it('retains unresolved destinations and failed repairs, summarizes on stderr, and still outputs successful repairs', async (t) => {
    const filename = await fixture(t, [['a', 'b', 'c', 'd']])
    const warnings: string[] = []
    const output: string[] = []
    t.mock.method(console, 'warn', (message: string) => warnings.push(message))
    t.mock.method(console, 'log', (message: string) => output.push(message))
    t.mock.method(globalThis, 'fetch', async (url: string) => {
      if (url === repo('a')) {
        return new Response(null, {
          status: 301,
          headers: { location: 'https://gitlab.com/example/error' },
        })
      }
      if (url === repo('b')) {
        return new Response(null, {
          status: 301,
          headers: { location: 'https://github.com/' },
        })
      }
      return response(
        url,
        url === repo('c') ? 404 : url.endsWith('/error') ? 403 : 200
      )
    })
    await assert.rejects(
      fixCommand().parse(['--file', filename]),
      /2 repository check/
    )
    assert.equal(output.length, 1)
    assert.match(output[0], /\[a\]/)
    assert.match(output[0], /\[b\]/)
    assert.doesNotMatch(output[0], /\[c\]/)
    assert.match(warnings.join('\n'), /Unresolved repository checks \(2\)/)
    assert.doesNotMatch(output[0], /Unresolved|Failed to check/)
  })
})
