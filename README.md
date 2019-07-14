# @jnv/lists-manage

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/jnv/lists-manage.svg)](https://npmjs.org/package/@jnv/lists-manage)
[![License](https://img.shields.io/npm/l/lists-manage.svg)](https://github.com/jnv/lists-manage/blob/master/package.json)

<!-- toc -->
* [@jnv/lists-manage](#jnvlists-manage)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @jnv/lists-manage
$ lists-manage COMMAND
running command...
$ lists-manage (-v|--version|version)
@jnv/lists-manage/0.0.1 darwin-x64 node-v12.6.0
$ lists-manage --help [COMMAND]
USAGE
  $ lists-manage COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`lists-manage add URL`](#lists-manage-add-url)
* [`lists-manage help [COMMAND]`](#lists-manage-help-command)

## `lists-manage add URL`

Add list to the Markdown file

```
USAGE
  $ lists-manage add URL

ARGUMENTS
  URL  URL of the list to add (in form https://github.com/user/repo)

OPTIONS
  -f, --file=file  [default: README.md] Markdown file to work with
  -h, --help       show CLI help

EXAMPLE
  $ lists-manage add
```

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
