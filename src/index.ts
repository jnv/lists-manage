import { readFileSync } from 'node:fs'
import { Command } from '@cliffy/command'
import { addCommand } from './commands/add.ts'
import { fixCommand } from './commands/fix.ts'
import { sortCommand } from './commands/sort.ts'

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
)

export const cli = new Command()
  .name('lists-manage')
  .version(version)
  .description('Manage Markdown-based curated lists')
  .command('add', addCommand())
  .command('fix', fixCommand())
  .command('sort', sortCommand())
