import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Command } from '@cliffy/command'
import { createCatalog, parseTopicConfig } from '../catalog/model.ts'
import { loadListFile } from '../listFile/index.ts'

export function exportCommand() {
  return new Command()
    .description(
      'Generate an offline JSON catalog and progressively enhanced static page'
    )
    .option('-f, --file <file:string>', 'Source Markdown file', {
      default: 'README.md',
    })
    .option(
      '-c, --config <config:string>',
      'Static topic keyword configuration',
      { required: true }
    )
    .option(
      '-o, --output <output:string>',
      'Directory for generated site files',
      { default: 'dist' }
    )
    .option('--json-only', 'Write only catalog.json; skip page generation')
    .action(async (options) => {
      const { file, config, output } = options
      const topics = parseTopicConfig(
        JSON.parse(await readFile(config, 'utf8'))
      )
      const list = await loadListFile(file)
      const catalog = createCatalog(list, topics)
      if (!catalog.entries.length) {
        throw new Error(
          'No catalog entries found; check the lists-start/lists-end markers and section headings'
        )
      }
      const assets = options.jsonOnly
        ? { 'catalog.json': `${JSON.stringify(catalog, null, 2)}\n` }
        : (await import('../catalog/render.ts')).catalogAssets(catalog)
      const inputPaths = await Promise.all(
        [file, config].map((input) => realpath(input))
      )
      const destination = path.resolve(output)
      // Never overwrite an input when the caller selects an existing directory.
      for (const name of Object.keys(assets)) {
        if (inputPaths.includes(path.join(destination, name))) {
          throw new Error(`Output would overwrite an input: ${name}`)
        }
      }
      await mkdir(destination, { recursive: true })
      await Promise.all(
        Object.entries(assets).map(([name, content]) =>
          writeFile(path.join(destination, name), content)
        )
      )
      console.log(`Exported ${catalog.entries.length} lists to ${destination}`)
    })
}
