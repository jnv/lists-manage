import { readFile, writeFile } from 'node:fs/promises'
import type { Command } from '@cliffy/command'

// Document redirected output consistently, including TTY-dependent defaults.
Object.defineProperty(process.stdout, 'isTTY', { value: false })
const { cli } = await import('../src/index.ts')

function commandHelp(
  command: Pick<Command, 'getHelp' | 'getPath' | 'getCommands'>
): string {
  const help = command
    .getHelp({ colors: false, long: true, width: 120 })
    .split('\n')
    // Avoid documentation churn on every package version bump.
    .filter((line) => !line.startsWith('Version:'))
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
  const heading = `### \`${command.getPath()}\``
  const children = command.getCommands().map(commandHelp)
  return [heading, `\`\`\`text\n${help}\n\`\`\``, ...children].join('\n\n')
}

const readmeUrl = new URL('../README.md', import.meta.url)
const readme = await readFile(readmeUrl, 'utf8')
const start = '<!-- commands:start -->'
const end = '<!-- commands:end -->'
const startIndex = readme.indexOf(start)
const endIndex = readme.indexOf(end)
if (startIndex === -1 || endIndex < startIndex) {
  throw new Error(
    'README.md must contain commands:start and commands:end markers'
  )
}

await writeFile(
  readmeUrl,
  `${readme.slice(0, startIndex + start.length)}\n\n${commandHelp(cli)}\n\n${readme.slice(endIndex)}`
)
