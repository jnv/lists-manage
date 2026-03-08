import { Command } from '@cliffy/command'
import { addCommand } from './commands/add.ts'
import { fixCommand } from './commands/fix.ts'
import { sortCommand } from './commands/sort.ts'

export const cli = new Command()
  .name('lists-manage')
  .version('0.5.3')
  .description('Manage Markdown-based curated lists')
  .command('add', addCommand())
  .command('fix', fixCommand())
  .command('sort', sortCommand())
