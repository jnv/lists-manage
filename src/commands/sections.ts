import { Command } from '@cliffy/command'
import { loadListFile } from '../listFile/index.ts'

export function sectionsCommand() {
  return new Command()
    .description('List section names in document order, one per line')
    .option('-f, --file <file:string>', 'Markdown file to work with', {
      default: 'README.md',
    })
    .example('list sections', 'lists-manage sections')
    .example(
      'list custom file sections',
      'lists-manage sections -f MY_LISTS_FILE.md'
    )
    .action(async (options) => {
      const file = options.file as unknown as string
      const { sections } = await loadListFile(file)
      if (!sections.length) {
        console.error(
          `No sections found in file ${file}. Do you have a correct file?`
        )
        process.exit(1)
      }
      for (const { name } of sections) {
        console.log(name)
      }
    })
}
