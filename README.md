<!-- prettier-ignore -->
@jnv/lists-manage
===============

<!-- prettier-ignore-end -->

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/jnv/lists-manage.svg)](https://npmjs.org/package/@jnv/lists-manage)
[![License](https://img.shields.io/npm/l/lists-manage.svg)](https://github.com/jnv/lists-manage/blob/master/package.json)

CLI program to manage [lists] project.

<!-- prettier-ignore -->
<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
  <!-- prettier-ignore-end -->

# Usage

You must have [Node.js](https://nodejs.org/) 10+ and npm installed.

Then inside of cloned repository of [lists] project (where the `README.md` file is located) run:

```sh-session
$ npx @jnv/lists-manage add -w https://github.com/link-to/awesome-list
```

This will automatically install and run this package and prompt you about the list you are about to add.

See [Commands](#commands) below for additional options and features.

# Commands

<!-- prettier-ignore -->
<!-- commands -->
* [`lists-manage add URL`](#lists-manage-add-url)
* [`lists-manage help [COMMAND]`](#lists-manage-help-command)

## `lists-manage add URL`

Add list URL to the Markdown file

```
USAGE
  $ lists-manage add URL

ARGUMENTS
  URL  URL of the list to add (in form of https://github.com/user/repo)

OPTIONS
  -f, --file=file    [default: README.md] Markdown file to work with
  -h, --help         show CLI help
  -p, --[no-]prompt  Enable or disable interactive prompt; enabled by default, disabled when output is being redirected
  -w, --write        Edit [file] in place

EXAMPLE
  $ lists-manage add -w https://github.com/some-user/awesome-list
```

_See code: [src/commands/add.ts](https://github.com/jnv/lists-manage/blob/v0.0.1/src/commands/add.ts)_

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
<!-- prettier-ignore-end -->

## License

MIT

[lists]: https://github.com/jnv/lists
