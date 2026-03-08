import { Command } from '@cliffy/command'
import { loadListFile, writeListFile } from '../listFile/index.ts'
import { serializeFile } from '../serializer/index.ts'
import { sortFile } from '../listFile/sort.ts'

export function sortCommand() {
  return new Command()
    .description('Just sort the items in file')
    .option('-f, --file <file:string>', 'Markdown file to work with', { default: 'README.md' })
    .option('-w, --write [write:boolean]', 'Edit [file] in place', { default: false })
    .example('sort in place', 'lists-manage sort -w')
    .example('sort custom file', 'lists-manage sort -f MY_LISTS_FILE.md')
    .action(async (options) => {
      const file = options.file as unknown as string
      const write = options.write as unknown as boolean

      if (!file) {
        console.error('Missing file')
        process.exit(1)
      }

      const listFile = await loadListFile(file)
      const sortedFile = sortFile(listFile)
      if (write) {
        console.log(`Writing to file ${file}`)
        await writeListFile(file, sortedFile)
      } else {
        console.log(serializeFile(sortedFile))
      }
    })
}
