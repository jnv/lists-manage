import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, type TestContext } from 'node:test'
import { serializeFile } from '../../serializer/index.ts'
import type { ListFile } from '../../types.ts'
import { writeListFile } from '../index.ts'

const list: ListFile = {
  prefix: '<!-- lists-start -->',
  sections: [{ name: 'Tools', level: 1, items: [] }],
  suffix: '<!-- lists-end -->',
}

async function fixture(t: TestContext) {
  const directory = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'lists-manage-write-'))
  )
  t.after(() => fs.rm(directory, { recursive: true, force: true }))
  const filename = path.join(directory, 'README.md')
  await fs.writeFile(filename, 'Original content')
  return { directory, filename }
}

describe('writeListFile', () => {
  it('replaces the destination only after the complete temporary file is written', async (t) => {
    const { directory, filename } = await fixture(t)
    const rename = fs.rename
    const replacement = t.mock.method(
      fs,
      'rename',
      async (source: string, target: string) => {
        assert.equal(target, filename)
        assert.equal(path.dirname(path.dirname(source)), directory)
        assert.equal(await fs.readFile(filename, 'utf8'), 'Original content')
        assert.equal(await fs.readFile(source, 'utf8'), serializeFile(list))
        return rename(source, target)
      }
    )

    await writeListFile(filename, list)

    assert.equal(replacement.mock.callCount(), 1)
    assert.equal(await fs.readFile(filename, 'utf8'), serializeFile(list))
    assert.deepEqual(await fs.readdir(directory), ['README.md'])
  })

  it('creates a new destination', async (t) => {
    const { directory } = await fixture(t)
    const filename = path.join(directory, 'new.md')
    await writeListFile(filename, list)
    assert.equal(await fs.readFile(filename, 'utf8'), serializeFile(list))
    assert.deepEqual((await fs.readdir(directory)).sort(), [
      'README.md',
      'new.md',
    ])
  })

  for (const operation of ['writeFile', 'rename'] as const) {
    it(`preserves the original and cleans up after ${operation} fails`, async (t) => {
      const { directory, filename } = await fixture(t)
      t.mock.method(fs, operation, async () => {
        throw new Error(`${operation} failed`)
      })

      await assert.rejects(
        writeListFile(filename, list),
        new RegExp(`${operation} failed`)
      )

      assert.equal(await fs.readFile(filename, 'utf8'), 'Original content')
      assert.deepEqual(await fs.readdir(directory), ['README.md'])
    })
  }

  it('preserves existing file permissions', {
    skip: process.platform === 'win32',
  }, async (t) => {
    const { filename } = await fixture(t)
    await fs.chmod(filename, 0o640)
    await writeListFile(filename, list)
    assert.equal((await fs.stat(filename)).mode & 0o777, 0o640)
  })

  it('updates symlink targets without replacing the link', {
    skip: process.platform === 'win32',
  }, async (t) => {
    const { directory, filename } = await fixture(t)
    const link = path.join(directory, 'link.md')
    await fs.symlink('README.md', link)

    await writeListFile(link, list)

    assert.equal(await fs.readlink(link), 'README.md')
    assert.equal(await fs.readFile(filename, 'utf8'), serializeFile(list))
    assert.deepEqual((await fs.readdir(directory)).sort(), [
      'README.md',
      'link.md',
    ])
  })
})
