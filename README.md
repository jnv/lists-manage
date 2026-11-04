@jnv/lists-manage
===============


[![Version](https://img.shields.io/npm/v/@jnv/lists-manage)](https://npmjs.org/package/@jnv/lists-manage)
[![License](https://img.shields.io/github/license/jnv/lists-manage)](LICENSE)

CLI program to manage [lists] project.

# Usage

You must have [Node.js](https://nodejs.org/) and npm installed.

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

<!-- commands:start -->

### `lists-manage`

```text
Usage:   lists-manage

Description:

  Manage Markdown-based curated lists

Options:

  -h, --help     - Show this help.
  -V, --version  - Show the version number for this program.

Commands:

  add       [url]  - Add list URL to the Markdown file
  sections         - List section names in document order, one per line
  fix              - Fix removed and redirected links
  sort             - Just sort the items in file
  export           - Generate an offline JSON catalog and progressively enhanced static page
```

### `lists-manage add`

```text
Usage:   lists-manage add [url]

Description:

  Add list URL to the Markdown file

Options:

  -h, --help                         - Show this help.
  -f, --file                 <file>  - markdown file to work with                                (Default: "README.md")
  --note                     <note>  - optional note, e.g. "In Chinese"
  -s, --section              <name>  - exact section name; use "lists-manage sections" to list
                                       valid names
  -w, --write, --no-write            - modify file in place; enabled by default, prints file     (Default: true)
                                       contents to stdout when disabled
  -p, --prompt, --no-prompt          - disable interactive prompt; enabled by default, disabled  (Default: false)
                                       when output is being redirected
  -c, --commit, --no-commit          - commit changes to git                                     (Default: false,
                                                                                                 Depends: --write)

Examples:

  add interactive lists-manage add
  add url         lists-manage add https://github.com/some-user/awesome-list
  add no-write    lists-manage add --no-write https://github.com/some-user/awesome-list
```

### `lists-manage sections`

```text
Usage:   lists-manage sections

Description:

  List section names in document order, one per line

Options:

  -h, --help          - Show this help.
  -f, --file  <file>  - Markdown file to work with  (Default: "README.md")

Examples:

  list sections             lists-manage sections
  list custom file sections lists-manage sections -f MY_LISTS_FILE.md
```

### `lists-manage fix`

```text
Usage:   lists-manage fix

Description:

  Fix removed and redirected links

Options:

  -h, --help            - Show this help.
  -f, --file   <file>   - Markdown file to work with  (Default: "README.md")
  -w, --write  [write]  - Edit [file] in place        (Default: false)

Examples:

  fix in place    lists-manage fix -w
  fix custom file lists-manage fix -f MY_LISTS_FILE.md
```

### `lists-manage sort`

```text
Usage:   lists-manage sort

Description:

  Just sort the items in file

Options:

  -h, --help            - Show this help.
  -f, --file   <file>   - Markdown file to work with  (Default: "README.md")
  -w, --write  [write]  - Edit [file] in place        (Default: false)

Examples:

  sort in place    lists-manage sort -w
  sort custom file lists-manage sort -f MY_LISTS_FILE.md
```

### `lists-manage export`

```text
Usage:   lists-manage export --config <config>

Description:

  Generate an offline JSON catalog and progressively enhanced static page

Options:

  -h, --help              - Show this help.
  -f, --file    <file>    - Source Markdown file                           (Default: "README.md")
  -c, --config  <config>  - Static topic keyword configuration             (required)
  -o, --output  <output>  - Directory for generated site files             (Default: "dist")
  --json-only             - Write only catalog.json; skip page generation
```

<!-- commands:end -->

## License

MIT

[lists]: https://github.com/jnv/lists
