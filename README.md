<!-- prettier-ignore -->
@jnv/lists-manage
===============

<!-- prettier-ignore-end -->

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@jnv/lists-manage)](https://npmjs.org/package/@jnv/lists-manage)
[![License](https://img.shields.io/github/license/jnv/lists-manage)](LICENSE)

CLI program to manage [lists] project.

<!-- prettier-ignore -->

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

<!-- prettier-ignore-end -->

# Usage

You must have [Node.js](https://nodejs.org/) 10+ and npm installed.

Then inside the cloned repository of [lists] project (where the `README.md` file is located) run:

```sh-session
$ npx @jnv/lists-manage add
```

This will run this package and prompt you about the list you are about to add.

Optionally run with `-c` flag to autocommit the addition with proper commit message:

```sh-session
$ npx @jnv/lists-manage add -c
```

See [Commands](#commands) below for additional options and features.

# Commands

<!-- prettier-ignore -->
<!-- commands -->
* [`lists-manage add [URL]`](#lists-manage-add-url)
* [`lists-manage fix`](#lists-manage-fix)
* [`lists-manage help [COMMAND]`](#lists-manage-help-command)
* [`lists-manage sort`](#lists-manage-sort)

## `lists-manage add [URL]`

Add list URL to the Markdown file

```
USAGE
  $ lists-manage add [URL]

ARGUMENTS
  URL  URL of the list to add (in form of https://github.com/user/repo)

OPTIONS
  -c, --commit       commit changes to git
  -f, --file=file    [default: README.md] markdown file to work with
  -h, --help         show CLI help
  -p, --[no-]prompt  disable interactive prompt; enabled by default, disabled when output is being redirected
  -w, --[no-]write   modify file in place; enabled by default, prints file contents to stdout when disabled

EXAMPLES
  $ lists-manage add
  $ lists-manage add https://github.com/some-user/awesome-list
  $ lists-manage add --no-write https://github.com/some-user/awesome-list
```

_See code: [src/commands/add.ts](https://github.com/jnv/lists-manage/blob/v0.4.2/src/commands/add.ts)_

## `lists-manage fix`

Fix removed and redirected links

```
USAGE
  $ lists-manage fix

OPTIONS
  -f, --file=file  [default: README.md] Markdown file to work with
  -h, --help       show CLI help
  -w, --write      Edit [file] in place

EXAMPLES
  $ lists-manage fix -w
  $ lists-manage fix -f MY_LISTS_FILE.md
```

_See code: [src/commands/fix.ts](https://github.com/jnv/lists-manage/blob/v0.4.2/src/commands/fix.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.0/src/commands/help.ts)_

## `lists-manage sort`

Just sort the items in file

```
USAGE
  $ lists-manage sort

OPTIONS
  -f, --file=file  [default: README.md] Markdown file to work with
  -h, --help       show CLI help
  -w, --write      Edit [file] in place

EXAMPLES
  $ lists-manage sort -w
  $ lists-manage sort -f MY_LISTS_FILE.md
```

_See code: [src/commands/sort.ts](https://github.com/jnv/lists-manage/blob/v0.4.2/src/commands/sort.ts)_
<!-- commandsstop -->
<!-- prettier-ignore-end -->

## License

MIT

[lists]: https://github.com/jnv/lists
