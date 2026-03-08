import { describe, it, beforeEach, afterEach } from 'node:test'
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

describe('e2e: sort command', () => {
  it('sorts items alphabetically within sections (stdout mode)', async () => {
    const file = await loadListFile(FIXTURE_PATH)
    const sorted = sortFile(file)
    const output = serializeFile(sorted)

    // Learning section: free-programming-books should come before learnxinyminutes-docs
    const freeIdx = output.indexOf('free-programming-books')
    const learnIdx = output.indexOf('learnxinyminutes-docs')
    assert.ok(freeIdx > -1, 'free-programming-books should be in output')
    assert.ok(learnIdx > -1, 'learnxinyminutes-docs should be in output')
    assert.ok(freeIdx < learnIdx, 'free-programming-books should come before learnxinyminutes-docs')

    // Tools section: recipes should come before weekly
    const recipesIdx = output.indexOf('recipes')
    const weeklyIdx = output.indexOf('weekly')
    assert.ok(recipesIdx > -1, 'recipes should be in output')
    assert.ok(weeklyIdx > -1, 'weekly should be in output')
    assert.ok(recipesIdx < weeklyIdx, 'recipes should come before weekly')

    // Prefix and suffix preserved
    assert.ok(output.includes('Prefix here.'), 'prefix should be preserved')
    assert.ok(output.includes('Suffix here.'), 'suffix should be preserved')
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
      // Verify sorting happened in the written file
      const freeIdx = written.indexOf('free-programming-books')
      const learnIdx = written.indexOf('learnxinyminutes-docs')
      assert.ok(freeIdx < learnIdx, 'free-programming-books should come before learnxinyminutes-docs in written file')

      const recipesIdx = written.indexOf('recipes')
      const weeklyIdx = written.indexOf('weekly')
      assert.ok(recipesIdx < weeklyIdx, 'recipes should come before weekly in written file')
    } finally {
      await fs.rm(tmpDir, { recursive: true })
    }
  })
})

describe('e2e: add command (non-interactive)', () => {
  it('adds a non-GitHub repo to the file without prompts', async () => {
    const repoUrl = 'https://gitlab.com/rosarior/django-must-watch'
    const file = await loadListFile(FIXTURE_PATH)

    // Simulate the add command's non-interactive path
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

    // The new item should appear in the output
    assert.ok(output.includes('django-must-watch'), 'new item should be in output')
    assert.ok(output.includes('gitlab.com/rosarior/django-must-watch'), 'new item URL should be in output')
    // Existing items should still be present
    assert.ok(output.includes('learnxinyminutes-docs'), 'existing items should be preserved')
    assert.ok(output.includes('free-programming-books'), 'existing items should be preserved')
    assert.ok(output.includes('weekly'), 'existing items should be preserved')
    assert.ok(output.includes('recipes'), 'existing items should be preserved')
    // Prefix and suffix preserved
    assert.ok(output.includes('Prefix here.'), 'prefix should be preserved')
    assert.ok(output.includes('Suffix here.'), 'suffix should be preserved')
  })

  it('adds item to a specific section and sorts it', async () => {
    const file = await loadListFile(FIXTURE_PATH)

    const listItem = {
      name: 'awesome-test',
      url: 'https://github.com/test/awesome-test',
      desc: 'A test awesome list',
    }

    // Add to Tools section (index 1)
    const updatedFile = addItemToSection(file, listItem, 1)
    const output = serializeFile(updatedFile)

    // The new item should appear in the Tools section, sorted
    const toolsSectionIdx = output.indexOf('## Tools')
    const awesomeTestIdx = output.indexOf('awesome-test')
    assert.ok(awesomeTestIdx > toolsSectionIdx, 'new item should appear after Tools heading')

    // Items in Tools should be sorted: awesome-test, recipes, weekly
    const awesomeIdx = output.indexOf('awesome-test')
    const recipesIdx = output.indexOf('recipes')
    const weeklyIdx = output.indexOf('weekly')
    assert.ok(awesomeIdx < recipesIdx, 'awesome-test should come before recipes')
    assert.ok(recipesIdx < weeklyIdx, 'recipes should come before weekly')

    // Learning section should be unchanged
    const learningSectionIdx = output.indexOf('## Learning')
    assert.ok(learningSectionIdx > -1, 'Learning section should exist')
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
      assert.ok(written.includes('awesome-test'), 'new item should be in written file')
      assert.ok(written.includes('A test awesome list'), 'new item description should be in written file')
    } finally {
      await fs.rm(tmpDir, { recursive: true })
    }
  })
})
