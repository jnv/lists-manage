import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

const source = `<!-- lists-start -->
## Technical
* [example](https://example.com/list)
<!-- lists-end -->
`
const config = '{"version":1,"rules":[]}'
const bin = path.resolve('bin/run')

for (const input of ['source', 'config']) {
  for (const alias of ['directory', 'file']) {
    for (const jsonOnly of [false, true]) {
      test(`export protects ${input} through a ${alias} symlink (jsonOnly=${jsonOnly})`, {
        skip: process.platform === 'win32',
      }, async (t) => {
        const dir = await mkdtemp(path.join(os.tmpdir(), 'export-input-'))
        t.after(() => rm(dir, { recursive: true, force: true }))
        const inputs = path.join(dir, 'inputs')
        const output = path.join(dir, 'site')
        await mkdir(inputs)
        const sourcePath = path.join(
          inputs,
          input === 'source' ? 'catalog.json' : 'README.md'
        )
        const configPath = path.join(
          inputs,
          input === 'config' ? 'catalog.json' : 'topics.json'
        )
        await writeFile(sourcePath, source)
        await writeFile(configPath, config)
        if (alias === 'directory') {
          await symlink(inputs, output, 'dir')
        } else {
          await mkdir(output)
          await symlink(
            input === 'source' ? sourcePath : configPath,
            path.join(output, 'catalog.json')
          )
        }
        const originalFiles = await readdir(output)

        assert.throws(
          () =>
            execFileSync(
              process.execPath,
              [
                bin,
                'export',
                '--file',
                sourcePath,
                '--config',
                configPath,
                '--output',
                output,
                ...(jsonOnly ? ['--json-only'] : []),
              ],
              { stdio: 'pipe' }
            ),
          /Output would overwrite an input: catalog.json/
        )
        assert.equal(await readFile(sourcePath, 'utf8'), source)
        assert.equal(await readFile(configPath, 'utf8'), config)
        assert.deepEqual(await readdir(output), originalFiles)
      })
    }
  }
}
