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
* [Publishing](#publishing)
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

_See code: [src/commands/add.ts](https://github.com/jnv/lists-manage/blob/v0.5.3/src/commands/add.ts)_

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

_See code: [src/commands/fix.ts](https://github.com/jnv/lists-manage/blob/v0.5.3/src/commands/fix.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

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

_See code: [src/commands/sort.ts](https://github.com/jnv/lists-manage/blob/v0.5.3/src/commands/sort.ts)_
<!-- commandsstop -->
<!-- prettier-ignore-end -->

## Publishing

Stable npm releases are published by [the publish workflow](.github/workflows/publish.yml)
when a `vX.Y.Z` tag is pushed. The tagged commit must be on `main`, and the tag,
`package.json`, and `package-lock.json` versions must match. Prerelease tags are
rejected. The workflow runs checks and tests, packs the package, installs and
smoke-tests the tarball in a temporary project, then publishes that same tarball
with provenance. It does not create a GitHub release or an SBOM.

Cliffy and its transitive dependencies are bundled in the tarball because they
come from JSR. Consumers do not need this repository's `.npmrc` or a custom
registry configuration to install the CLI.

### One-time setup

1. Create a GitHub environment named `npm` under this repository's
   **Settings → Environments**. Restrict deployment to selected tags matching
   `v*`. Protect `main` and restrict who can create, update, or delete release
   tags using repository rulesets.
2. In the npm settings for `@jnv/lists-manage`, add a GitHub Actions
   [trusted publisher](https://docs.npmjs.com/trusted-publishers/) with:
   - Owner: `jnv`
   - Repository: `lists-manage`
   - Workflow filename: `publish.yml`
   - Environment: `npm`
   - Allowed action: enable direct publishing with `npm publish`.
3. Complete the first publish within two days of adding the trusted publisher;
   otherwise, recreate the expired configuration. After verifying trusted
   publishing works, select **Require two-factor authentication and disallow
   tokens** in npm's publishing-access settings, and revoke unused publishing
   tokens. No npm token or GitHub personal access token is needed by this workflow.

### Publish a version

Update both package manifests, for example with `npm version patch --no-git-tag-version`,
and merge the change into `main` after CI passes. To publish the version currently
in `package.json` from an up-to-date checkout of `main`:

```sh
git tag -a "v$(node --print "require('./package.json').version")" -m 'Release'
git push origin "v$(node --print "require('./package.json').version")"
```

Monitor **Actions → Publish to npm**. If a run fails before publishing, rerun the
failed workflow after resolving the cause. npm versions cannot be overwritten;
if the version is already published, prepare a new version rather than moving
the tag or trying to replace the package.

## License

MIT

[lists]: https://github.com/jnv/lists
