import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { loadListFile, addItemToSection, writeListFile } from '../listFile/index.ts'
import { serializeFile } from '../serializer/index.ts'
import { sortFile } from '../listFile/sort.ts'
import { fetchRepoDetails } from '../repo/index.ts'
import { normalizeDesc } from '../normalize.ts'
import { suggestSection } from '../suggestSection.ts'

const FIXTURE_PATH = new URL('./fixture.md', import.meta.url).pathname

function assertOrder(text: string, first: string, second: string) {
  const firstIdx = text.indexOf(first)
  const secondIdx = text.indexOf(second)
  assert.notEqual(firstIdx, -1, `expected "${first}" to be present`)
  assert.notEqual(secondIdx, -1, `expected "${second}" to be present`)
  assert.ok(firstIdx < secondIdx, `expected "${first}" (at ${firstIdx}) before "${second}" (at ${secondIdx})`)
}

describe('e2e: sort command', () => {
  it('sorts items alphabetically within sections (stdout mode)', async () => {
    const file = await loadListFile(FIXTURE_PATH)
    const sorted = sortFile(file)
    const output = serializeFile(sorted)

    assertOrder(output, 'free-programming-books', 'learnxinyminutes-docs')
    assertOrder(output, 'django-must-watch', 'recipes')
    assertOrder(output, 'recipes', 'weekly')
    assert.match(output, /Prefix here\./)
    assert.match(output, /Suffix here\./)
  })

  it('writes sorted file in place (write mode)', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lists-manage-test-'))
    const tmpFile = path.join(tmpDir, 'test.md')
    await fs.copyFile(FIXTURE_PATH, tmpFile)

    try {
      const file = await loadListFile(tmpFile)
      const sorted = sortFile(file)
      await writeListFile(tmpFile, sorted)

      const written = await fs.readFile(tmpFile, 'utf8')
      assertOrder(written, 'free-programming-books', 'learnxinyminutes-docs')
      assertOrder(written, 'recipes', 'weekly')
    } finally {
      await fs.rm(tmpDir, { recursive: true })
    }
  })
})

describe('e2e: add command (non-interactive)', () => {
  it('adds a non-GitHub repo to the file without prompts', async () => {
    const repoUrl = 'https://gitlab.com/inkscape/inkscape'
    const file = await loadListFile(FIXTURE_PATH)

    const repoDetails = await fetchRepoDetails(repoUrl)
    repoDetails.desc = normalizeDesc(repoDetails.desc)
    const initialSection = suggestSection(file.sections)(repoDetails)

    const listItem = {
      name: repoDetails.name,
      url: repoDetails.url,
      desc: (repoDetails.desc || '').trim(),
    }

    const updatedFile = addItemToSection(file, listItem, initialSection)
    const output = serializeFile(updatedFile)

    assert.match(output, /inkscape/)
    assert.match(output, /gitlab\.com\/inkscape\/inkscape/)
    assert.match(output, /learnxinyminutes-docs/)
    assert.match(output, /free-programming-books/)
    assert.match(output, /weekly/)
    assert.match(output, /recipes/)
    assert.match(output, /Prefix here\./)
    assert.match(output, /Suffix here\./)
  })

  it('adds item to a specific section and sorts it', async () => {
    const file = await loadListFile(FIXTURE_PATH)

    const listItem = {
      name: 'awesome-test',
      url: 'https://github.com/test/awesome-test',
      desc: 'A test awesome list',
    }

    const updatedFile = addItemToSection(file, listItem, 1)
    const output = serializeFile(updatedFile)

    assertOrder(output, '## Tools', 'awesome-test')
    assertOrder(output, 'awesome-test', 'recipes')
    assertOrder(output, 'recipes', 'weekly')
    assert.match(output, /## Learning/)
  })

  it('writes added item to file in place', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lists-manage-test-'))
    const tmpFile = path.join(tmpDir, 'test.md')
    await fs.copyFile(FIXTURE_PATH, tmpFile)

    try {
      const file = await loadListFile(tmpFile)
      const listItem = {
        name: 'awesome-test',
        url: 'https://github.com/test/awesome-test',
        desc: 'A test awesome list',
      }
      const updatedFile = addItemToSection(file, listItem, 1)
      await writeListFile(tmpFile, updatedFile)

      const written = await fs.readFile(tmpFile, 'utf8')
      assert.match(written, /awesome-test/)
      assert.match(written, /A test awesome list/)
    } finally {
      await fs.rm(tmpDir, { recursive: true })
    }
  })
})
