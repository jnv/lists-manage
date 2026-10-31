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

Use **Actions → Release → Run workflow**, select `main`, and choose a
`patch`, `minor`, or `major` version bump. For example, from `0.6.1`, these produce
`0.6.2`, `0.7.0`, or `1.0.0` respectively.

The [release workflow](.github/workflows/publish.yml) updates both package
manifests, creates a version commit, and runs linting, typechecking, and tests.
It records the required `build` status on that tested commit, then pushes the
commit to `main` and creates its `vX.Y.Z` tag atomically. A temporary release
branch makes the commit available for status checks and is removed afterward.
If `main` advances incompatibly during preparation, the push fails rather than
overwriting other commits.

A second **Release** run starts automatically on the tag. It validates the
versions, repeats checks and tests, packs the package, and smoke-tests a clean
installation. It then creates a draft GitHub release with generated release
notes and the tested `.tgz`, publishes that same tarball to npm with provenance,
and publishes the GitHub release. GitHub generates the notes from merged pull
requests and contributors since the previous release; you can edit them later.

The publishing phase runs from the release tag so provenance identifies the
version commit. It uses an explicit workflow dispatch because tags created by
`GITHUB_TOKEN` do not trigger push workflows. Both phases stay in `publish.yml`,
so the npm trusted-publisher workflow filename remains the same.

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

### Repository permissions

The preparation job uses `contents: write` for the version commit and tag,
`statuses: write` to record the checks actually run against that commit, and
`actions: write` to start the publishing phase. The publishing job uses
`contents: write` for the GitHub release and `id-token: write` for npm OIDC.
No additional secret is needed. The current `main` protection requires a
`build` status; stricter rules such as mandatory PRs or signed commits would
require adapting the preparation flow.

### Monitor or retry a release

Monitor both runs under **Actions → Release** and wait for publishing to finish
before starting another release. If preparation fails before
pushing to `main`, fix the cause and start again. If the version commit and tag
already exist, retry publishing from that tag rather than requesting another
version bump:

```sh
gh workflow run publish.yml --ref v0.6.2 -f bump=patch
```

The bump input is ignored when running on a tag. A manually pushed `vX.Y.Z`
tag also starts publishing. Tags must point to commits on `main`, and the tag,
`package.json`, and `package-lock.json` versions must match. Only stable
releases are supported.

If npm publishing fails, the GitHub release remains a draft; retry publishing
after resolving the cause. If npm publishing succeeded but publishing the
GitHub release failed, publish the existing draft from the Releases page.
npm versions cannot be overwritten, and published GitHub releases are not
modified by this workflow. Do not move a release tag to replace a package.

## License

MIT

[lists]: https://github.com/jnv/lists

## Static catalog export

Generate a complete, offline website and versioned JSON from a Markdown list:

```sh
lists-manage export --file README.md --config .github/topics.json --output dist
```

The source must use `<!-- lists-start -->` / `<!-- lists-end -->` markers and
section headings, as with the other commands. `--title` defaults to `Lists`.
The output directory receives `index.html`, `style.css`, `search.js`,
`catalog.json`, and `.nojekyll`; use a dedicated directory for deployment.
No API calls, credentials, or LLM calls are used during export.

The JSON envelope is `{ "version": 1, "entries": [...] }`. Entries preserve
name, URL, Markdown description, author, language/note, supplementary Markdown
items, category ancestry, section name, and derived tags. Entries are sorted
alphabetically. Internal section links are retained in the generated table.
HTML renders a safe subset of Markdown, preserving links and emphasis while
removing executable HTML and unsafe URL schemes.

Topic configuration is a JSON object with `version: 1` and `rules`:

```json
{
  "version": 1,
  "rules": [
    { "tag": "programming language", "keywords": ["csharp", "c#", "dotnet"] }
  ]
}
```

Rules match literal aliases in names and descriptions, ignoring case and
accents. Unicode letters and numbers delimit keywords, so `go` does not match
`django`; hyphens and underscores count as separators. All matching rules
apply. Empty rules are supported. Invalid configuration fails the command.
The taxonomy is owned by the calling repository, not by this tool.

The full semantic table works without JavaScript. With JavaScript enabled,
search matches every query word against rendered row text, including topics,
author, and notes, ignoring case and accents. A native datalist suggests topic
names as complete search values. Category filtering includes descendants.
Search and category are stored in URL query parameters (`q` and `category`),
with browser history support. No runtime libraries or network requests are
needed. JSON is an independent export; the page searches its existing rows.
