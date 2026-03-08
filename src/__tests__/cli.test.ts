import { describe, it, before, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const execFile = promisify(execFileCb)

const BIN = path.resolve(import.meta.dirname, '../../bin/run')
const FIXTURE_PATH = path.resolve(import.meta.dirname, './fixture.md')

function run(args: string[]) {
  return execFile('node', [BIN, ...args], { timeout: 15_000 })
}

describe('CLI: help', () => {
  it('shows main help', async () => {
    const { stdout } = await run(['--help'])
    assert.ok(stdout.includes('lists-manage'), 'should show program name')
    assert.ok(stdout.includes('add'), 'should list add command')
    assert.ok(stdout.includes('fix'), 'should list fix command')
    assert.ok(stdout.includes('sort'), 'should list sort command')
  })

  it('shows sort help', async () => {
    const { stdout } = await run(['sort', '--help'])
    assert.ok(stdout.includes('--file'), 'should show --file flag')
    assert.ok(stdout.includes('--write'), 'should show --write flag')
  })

  it('shows add help', async () => {
    const { stdout } = await run(['add', '--help'])
    assert.ok(stdout.includes('--file'), 'should show --file flag')
    assert.ok(stdout.includes('--write'), 'should show --write flag')
    assert.ok(stdout.includes('--prompt'), 'should show --prompt flag')
    assert.ok(stdout.includes('--commit'), 'should show --commit flag')
  })

  it('shows fix help', async () => {
    const { stdout } = await run(['fix', '--help'])
    assert.ok(stdout.includes('--file'), 'should show --file flag')
    assert.ok(stdout.includes('--write'), 'should show --write flag')
  })

  it('shows version', async () => {
    const { stdout } = await run(['--version'])
    assert.match(stdout.trim(), /\d+\.\d+\.\d+/, 'should show version number')
  })
})

describe('CLI: sort', () => {
  it('outputs sorted markdown to stdout', async () => {
    const { stdout } = await run(['sort', '-f', FIXTURE_PATH])

    // Learning section: free-programming-books should come before learnxinyminutes-docs
    const freeIdx = stdout.indexOf('free-programming-books')
    const learnIdx = stdout.indexOf('learnxinyminutes-docs')
    assert.ok(freeIdx > -1 && learnIdx > -1, 'both items should be in output')
    assert.ok(freeIdx < learnIdx, 'free-programming-books should come before learnxinyminutes-docs')

    // Tools section: recipes should come before weekly
    const recipesIdx = stdout.indexOf('recipes')
    const weeklyIdx = stdout.indexOf('weekly')
    assert.ok(recipesIdx > -1 && weeklyIdx > -1, 'both items should be in output')
    assert.ok(recipesIdx < weeklyIdx, 'recipes should come before weekly')

    // Prefix and suffix preserved
    assert.ok(stdout.includes('Prefix here.'), 'prefix should be preserved')
    assert.ok(stdout.includes('Suffix here.'), 'suffix should be preserved')
  })

  it('writes sorted file in place with -w', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lists-manage-cli-'))
    const tmpFile = path.join(tmpDir, 'test.md')
    await fs.copyFile(FIXTURE_PATH, tmpFile)

    try {
      await run(['sort', '-w', '-f', tmpFile])

      const written = await fs.readFile(tmpFile, 'utf8')
      const freeIdx = written.indexOf('free-programming-books')
      const learnIdx = written.indexOf('learnxinyminutes-docs')
      assert.ok(freeIdx < learnIdx, 'items should be sorted in written file')
    } finally {
      await fs.rm(tmpDir, { recursive: true })
    }
  })
})

describe('CLI: add (non-interactive)', () => {
  it('adds a non-GitHub repo and outputs to stdout', async () => {
    const { stdout } = await run([
      'add',
      '--no-prompt',
      '--no-write',
      '-f', FIXTURE_PATH,
      'https://gitlab.com/rosarior/django-must-watch',
    ])

    assert.ok(stdout.includes('django-must-watch'), 'new item should be in output')
    assert.ok(stdout.includes('gitlab.com/rosarior/django-must-watch'), 'new item URL should be in output')
    // Existing items preserved
    assert.ok(stdout.includes('learnxinyminutes-docs'), 'existing items should be preserved')
    assert.ok(stdout.includes('free-programming-books'), 'existing items should be preserved')
  })

  it('writes added item in place', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lists-manage-cli-'))
    const tmpFile = path.join(tmpDir, 'test.md')
    await fs.copyFile(FIXTURE_PATH, tmpFile)

    try {
      await run([
        'add',
        '--no-prompt',
        '-f', tmpFile,
        'https://gitlab.com/rosarior/django-must-watch',
      ])

      const written = await fs.readFile(tmpFile, 'utf8')
      assert.ok(written.includes('django-must-watch'), 'new item should be in written file')
    } finally {
      await fs.rm(tmpDir, { recursive: true })
    }
  })

  it('exits with error when URL already exists', async () => {
    await assert.rejects(
      () => run([
        'add',
        '--no-prompt',
        '--no-write',
        '-f', FIXTURE_PATH,
        'https://github.com/adambard/learnxinyminutes-docs',
      ]),
      (err: { code: number; stderr: string }) => {
        assert.ok(err.stderr.includes('already present') || err.code !== 0, 'should error on duplicate URL')
        return true
      }
    )
  })

  it('exits with error when no URL and no prompt', async () => {
    await assert.rejects(
      () => run([
        'add',
        '--no-prompt',
        '--no-write',
        '-f', FIXTURE_PATH,
      ]),
      (err: { code: number; stderr: string }) => {
        assert.ok(err.code !== 0, 'should exit with non-zero code')
        return true
      }
    )
  })
})
