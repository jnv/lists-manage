import { describe, it } from 'node:test'
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

function assertOrder(text: string, first: string, second: string) {
  const firstIdx = text.indexOf(first)
  const secondIdx = text.indexOf(second)
  assert.notEqual(firstIdx, -1, `expected "${first}" to be present`)
  assert.notEqual(secondIdx, -1, `expected "${second}" to be present`)
  assert.ok(firstIdx < secondIdx, `expected "${first}" (at ${firstIdx}) before "${second}" (at ${secondIdx})`)
}

describe('CLI: help', () => {
  it('shows main help', async () => {
    const { stdout } = await run(['--help'])
    assert.match(stdout, /lists-manage/)
    assert.match(stdout, /add/)
    assert.match(stdout, /fix/)
    assert.match(stdout, /sort/)
  })

  it('shows sort help', async () => {
    const { stdout } = await run(['sort', '--help'])
    assert.match(stdout, /--file/)
    assert.match(stdout, /--write/)
  })

  it('shows add help', async () => {
    const { stdout } = await run(['add', '--help'])
    assert.match(stdout, /--file/)
    assert.match(stdout, /--write/)
    assert.match(stdout, /--prompt/)
    assert.match(stdout, /--commit/)
  })

  it('shows fix help', async () => {
    const { stdout } = await run(['fix', '--help'])
    assert.match(stdout, /--file/)
    assert.match(stdout, /--write/)
  })

  it('shows version', async () => {
    const { stdout } = await run(['--version'])
    assert.match(stdout.trim(), /\d+\.\d+\.\d+/)
  })
})

describe('CLI: sort', () => {
  it('outputs sorted markdown to stdout', async () => {
    const { stdout } = await run(['sort', '-f', FIXTURE_PATH])

    assertOrder(stdout, 'free-programming-books', 'learnxinyminutes-docs')
    assertOrder(stdout, 'recipes', 'weekly')
    assert.match(stdout, /Prefix here\./)
    assert.match(stdout, /Suffix here\./)
  })

  it('writes sorted file in place with -w', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lists-manage-cli-'))
    const tmpFile = path.join(tmpDir, 'test.md')
    await fs.copyFile(FIXTURE_PATH, tmpFile)

    try {
      await run(['sort', '-w', '-f', tmpFile])

      const written = await fs.readFile(tmpFile, 'utf8')
      assertOrder(written, 'free-programming-books', 'learnxinyminutes-docs')
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
      'https://gitlab.com/inkscape/inkscape',
    ])

    assert.match(stdout, /inkscape/)
    assert.match(stdout, /gitlab\.com\/inkscape\/inkscape/)
    assert.match(stdout, /learnxinyminutes-docs/)
    assert.match(stdout, /free-programming-books/)
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
        'https://gitlab.com/inkscape/inkscape',
      ])

      const written = await fs.readFile(tmpFile, 'utf8')
      assert.match(written, /inkscape/)
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
        'https://gitlab.com/rosarior/django-must-watch',
      ]),
      (err: { code: number; stderr: string }) => {
        assert.match(err.stderr, /already present/)
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
      (err: { code: number }) => {
        assert.notEqual(err.code, 0)
        return true
      }
    )
  })
})
