import assert from 'node:assert/strict'
import { execFile as execFileCb } from 'node:child_process'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { promisify, stripVTControlCharacters } from 'node:util'
import { parseFile } from '../parser/file.ts'

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
  assert.ok(
    firstIdx < secondIdx,
    `expected "${first}" (at ${firstIdx}) before "${second}" (at ${secondIdx})`
  )
}

describe('CLI: help', () => {
  it('shows main help', async () => {
    const { stdout } = await run(['--help'])
    assert.match(stdout, /lists-manage/)
    assert.match(stdout, /add/)
    assert.match(stdout, /fix/)
    assert.match(stdout, /sort/)
    assert.match(stdout, /sections/)
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
    assert.match(stdout, /--section/)
    assert.match(stdout, /--note/)
  })

  it('shows fix help', async () => {
    const { stdout } = await run(['fix', '--help'])
    assert.match(stdout, /--file/)
    assert.match(stdout, /--write/)
  })

  it('shows version', async () => {
    const { stdout } = await run(['--version'])
    const { version } = JSON.parse(
      await fs.readFile(new URL('../../package.json', import.meta.url), 'utf8')
    )
    assert.equal(
      stripVTControlCharacters(stdout).trim(),
      `lists-manage ${version}`
    )
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
  it('rejects --commit with --no-write without committing existing edits', async (t) => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'lists-manage-commit-')
    )
    t.after(() => fs.rm(directory, { recursive: true, force: true }))
    const git = (...args: string[]) =>
      execFile('git', args, { cwd: directory, timeout: 15_000 })
    const filename = path.join(directory, 'README.md')
    await fs.copyFile(FIXTURE_PATH, filename)
    await git('init')
    await git('config', 'user.name', 'CLI test')
    await git('config', 'user.email', 'cli-test@example.invalid')
    await git('add', 'README.md')
    await git('commit', '-m', 'Initial list')
    const { stdout: originalHead } = await git('rev-parse', 'HEAD')
    const contents = `${await fs.readFile(filename, 'utf8')}Unrelated edit\n`
    await fs.writeFile(filename, contents)
    const { stdout: originalDiff } = await git('diff')

    for (const args of [
      ['--no-prompt', 'https://gitlab.com/inkscape/inkscape'],
      ['--prompt'],
    ]) {
      await assert.rejects(
        () =>
          execFile('node', [BIN, 'add', '--no-write', '--commit', ...args], {
            cwd: directory,
            timeout: 15_000,
          }),
        (error: { code: number; stdout: string; stderr: string }) => {
          assert.equal(error.code, 1)
          assert.equal(error.stdout, '')
          assert.match(error.stderr, /--commit requires writing/)
          return true
        }
      )
      assert.equal(await fs.readFile(filename, 'utf8'), contents)
      assert.equal((await git('rev-parse', 'HEAD')).stdout, originalHead)
      assert.equal((await git('diff')).stdout, originalDiff)
      assert.equal((await git('diff', '--cached')).stdout, '')
    }
  })

  it('adds to the named section instead of the suggested section', async () => {
    const { stdout, stderr } = await run([
      'add',
      '--no-prompt',
      '--no-write',
      '-f',
      FIXTURE_PATH,
      '--section',
      'Tools',
      'https://gitlab.com/inkscape/inkscape',
    ])
    const { sections } = parseFile(stdout)
    assert.equal(
      sections[0].items.some(({ name }) => name === 'inkscape'),
      false
    )
    assert.equal(
      sections[1].items.some(({ name }) => name === 'inkscape'),
      true
    )
    assert.equal(stderr, '')
  })

  it('rejects unknown and ambiguous names without changing the file', async (t) => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'lists-manage-section-')
    )
    t.after(() => fs.rm(directory, { recursive: true, force: true }))
    const filename = path.join(directory, 'README.md')
    const contents =
      '<!-- lists-start -->\n## Tools\n## Tools\n<!-- lists-end -->\n'
    await fs.writeFile(filename, contents)
    for (const [name, error] of [
      ['Missing', 'Unknown'],
      ['tools', 'Unknown'],
      ['Tools', 'Ambiguous'],
    ]) {
      await assert.rejects(
        () =>
          run([
            'add',
            '--no-prompt',
            '-f',
            filename,
            '--section',
            name,
            'invalid-url',
          ]),
        (err: { stderr: string }) => {
          assert.match(err.stderr, new RegExp(`${error} section`))
          assert.match(err.stderr, /lists-manage sections/)
          return true
        }
      )
      assert.equal(await fs.readFile(filename, 'utf8'), contents)
    }
  })

  it('adds a trimmed language note in italics', async () => {
    const { stdout } = await run([
      'add',
      '--no-prompt',
      '--no-write',
      '--note',
      '  In Chinese and English  ',
      '-f',
      FIXTURE_PATH,
      'https://gitlab.com/inkscape/inkscape',
    ])

    assert.match(
      stdout,
      /\* \[inkscape\]\(https:\/\/gitlab\.com\/inkscape\/inkscape\) _In Chinese and English_\n/
    )
  })

  it('adds a non-GitHub repo and outputs to stdout', async () => {
    const { stdout } = await run([
      'add',
      '--no-prompt',
      '--no-write',
      '-f',
      FIXTURE_PATH,
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
        '-f',
        tmpFile,
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
      () =>
        run([
          'add',
          '--no-prompt',
          '--no-write',
          '-f',
          FIXTURE_PATH,
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
      () => run(['add', '--no-prompt', '--no-write', '-f', FIXTURE_PATH]),
      (err: { code: number }) => {
        assert.notEqual(err.code, 0)
        return true
      }
    )
  })
})

describe('CLI: sections', () => {
  it('prints only section names in document order', async () => {
    const { stdout, stderr } = await run(['sections', '-f', FIXTURE_PATH])
    assert.equal(stdout, 'Learning\nTools\n')
    assert.equal(stderr, '')
  })

  it('defaults to README.md and lists nested headings with spaces', async (t) => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'lists-manage-section-')
    )
    t.after(() => fs.rm(directory, { recursive: true, force: true }))
    await fs.writeFile(
      path.join(directory, 'README.md'),
      '## Outside\n<!-- lists-start -->\n## Parent section\n### Child section\n<!-- lists-end -->\n## Outside again\n'
    )
    const { stdout } = await execFile('node', [BIN, 'sections'], {
      cwd: directory,
      timeout: 15_000,
    })
    assert.equal(stdout, 'Parent section\nChild section\n')
    const result = await execFile(
      'node',
      [
        BIN,
        'add',
        '--no-prompt',
        '--section',
        'Child section',
        'https://gitlab.com/inkscape/inkscape',
      ],
      { cwd: directory, timeout: 15_000 }
    )
    assert.match(result.stdout, /Writing to file/)
    const { sections } = parseFile(
      await fs.readFile(path.join(directory, 'README.md'), 'utf8')
    )
    assert.equal(sections[0].items.length, 0)
    assert.equal(sections[1].items[0].name, 'inkscape')
  })

  it('fails when the file has no sections', async (t) => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'lists-manage-section-')
    )
    t.after(() => fs.rm(directory, { recursive: true, force: true }))
    const filename = path.join(directory, 'README.md')
    await fs.writeFile(filename, '# No list sections\n')
    await assert.rejects(
      () => run(['sections', '-f', filename]),
      (err: { stdout: string; stderr: string }) => {
        assert.equal(err.stdout, '')
        assert.match(err.stderr, /No sections found/)
        return true
      }
    )
  })
})
