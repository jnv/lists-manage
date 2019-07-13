# @jnv/lists-manage

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/jnv/lists-manage.svg)](https://npmjs.org/package/@jnv/lists-manage)
[![License](https://img.shields.io/npm/l/lists-manage.svg)](https://github.com/jnv/lists-manage/blob/master/package.json)

<!-- toc -->

- [Usage](#usage)
- [Commands](#commands)
  <!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g @jnv/lists-manage
$ lists-manage COMMAND
running command...
$ lists-manage (-v|--version|version)
lists-manage/0.0.0 darwin-x64 node-v10.16.0
$ lists-manage --help [COMMAND]
USAGE
  $ lists-manage COMMAND
...
```

<!-- usagestop -->

# Commands

<!-- commands -->

- [`lists-manage hello [FILE]`](#lists-manage-hello-file)
- [`lists-manage help [COMMAND]`](#lists-manage-help-command)

## `lists-manage hello [FILE]`

describe the command here

```
USAGE
  $ lists-manage hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ lists-manage hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/jnv/lists-manage/blob/v0.0.0/src/commands/hello.ts)_

## `lists-manage help [COMMAND]`

display help for lists-manage

```
USAGE
  $ lists-manage help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

<!-- commandsstop -->
