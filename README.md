# @jnv/lists-manage

[![Version](https://img.shields.io/npm/v/@jnv/lists-manage)](https://npmjs.org/package/@jnv/lists-manage)
[![License](https://img.shields.io/github/license/jnv/lists-manage)](LICENSE)

CLI for managing Markdown-based curated lists, built with [Cliffy](https://cliffy.io/).
Originally created for [jnv/lists](https://github.com/jnv/lists), it can add
repositories, fix removed or redirected links, sort entries, and export an
offline catalog as a static website or JSON.

- [Usage](#usage)
- [Markdown format](#markdown-format)
- [Commands](#commands)
- [Static catalog export](#static-catalog-export)
- [Development](#development)
- [Publishing](#publishing)
- [License](#license)

## Usage

Use a current Node.js LTS release (24 or newer) and npm. From your cloned list
repository, run:

```sh
npx @jnv/lists-manage add
```

This prompts for a repository URL and lets you choose a section and edit its
description. The entry is written to `README.md` by default. To supply a URL
and commit the addition:

```sh
npx @jnv/lists-manage add https://github.com/some-user/awesome-list --commit
```

For scripts, pass a URL and `--no-prompt`. Use `--no-write` to preview the
updated Markdown on stdout. Interactive prompting is disabled when stdout is
redirected. GitHub metadata requests use `GITHUB_TOKEN` when it is set.

You can also install the CLI globally:

```sh
npm install --global @jnv/lists-manage
lists-manage --help
```

Sort or repair a list in place with:

```sh
lists-manage sort --write
lists-manage fix --write
```

Both commands print the resulting Markdown by default; `--write` saves it.
All commands accept `--file` to select another Markdown file. Use
`lists-manage <command> --help` for command-specific help.

## Markdown format

Commands operate on entries between `<!-- lists-start -->` and
`<!-- lists-end -->` markers. Headings define sections; text outside the
markers is preserved. For example:

```markdown
# My curated lists

<!-- lists-start -->

## Programming

- [awesome-list](https://github.com/some-user/awesome-list) — A curated list

<!-- lists-end -->
```

## Commands

Generated from Cliffy's help output. Defaults below reflect redirected stdout;
`add` enables prompting in an interactive terminal. Package versions are omitted.

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

  add     [url]  - Add list URL to the Markdown file
  fix            - Fix removed and redirected links
  sort           - Just sort the items in file
  export         - Generate an offline JSON catalog and progressively enhanced static page
```

### `lists-manage add`

```text
Usage:   lists-manage add [url]

Description:

  Add list URL to the Markdown file

Options:

  -h, --help                         - Show this help.
  -f, --file                 <file>  - markdown file to work with                                (Default: "README.md")
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

## Static catalog export

Generate a complete, offline website and versioned JSON from a Markdown list:

```sh
lists-manage export --file README.md --config .github/topics.json --output dist
```

The source must use `<!-- lists-start -->` / `<!-- lists-end -->` markers and
section headings, as with the other commands. The page title is hardcoded as `Lists` in the HTML template.
The output directory receives `index.html`, `style.css`, `search.js`,
`catalog.json`, and `.nojekyll`; use a dedicated directory for deployment.
No API calls, credentials, or LLM calls are used during export.

For JSON alone, add `--json-only`:

```sh
lists-manage export --file README.md --config .github/topics.json --json-only --output dist
```

This creates or updates only `dist/catalog.json`, with the same data as the
full-site export. It skips HTML rendering and does not load page templates.
Other files already present in the output directory are left untouched.

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
    { "tag": "programming language", "keywords": ["csharp", "c#", "dotnet"] },
    { "tag": "lists of lists", "categories": ["Lists of lists"] }
  ]
}
```

Rules match literal aliases in names and descriptions, ignoring case and
accents. Unicode letters and numbers delimit keywords, so `go` does not match
`django`; hyphens and underscores count as separators. All matching rules
apply. Category selectors match an exact category name anywhere in the entry's
ancestry, ignoring case and accents, so selecting a parent includes all its
subsections. Category selectors do not match entry names or descriptions.
Each rule needs at least one selector array (`keywords` or `categories`);
every supplied array must contain nonempty, trimmed strings. When both are
present, matching any keyword or category assigns the tag (OR).
An empty `rules` array is supported. Invalid configuration fails the command.
The taxonomy is owned by the calling repository, not by this tool.

The full semantic table works without JavaScript. With JavaScript enabled,
search matches every query word against rendered row text, including topics,
author, and notes, ignoring case and accents. A native datalist suggests topic
names as complete search values. Category filtering includes descendants.
Search and category are stored in URL query parameters (`q` and `category`),
with browser history support. No runtime libraries or network requests are
needed. JSON is an independent export; the page searches its existing rows.

### Editing the catalog presentation

The page lives in `src/catalog/templates/catalog.html.mustache`, with repeated
rows in `row.html.mustache` and styles in `style.css` in the same directory.
These are ordinary HTML templates using Mustache sections for loops and
optional content. TypeScript in `src/catalog/render.ts` prepares their data.
Keep ordinary values in double braces (`{{name}}`) for automatic escaping;
triple braces are reserved for the sanitized Markdown HTML prepared by the
renderer. The browser enhancement remains in `src/catalog/client.ts`. Its controls live
in `src/catalog/templates/search.html`, which is embedded in the generated
JavaScript, not the page HTML. JavaScript builds topic and category options
from the visible table, then inserts the controls. The unenhanced HTML has no
search controls, result messages, or hidden filtering metadata. The script
reference is the only JavaScript hook in the page.

The footer records the UTC generation date in a semantic `time` element.
Generation timestamps are presentation metadata; the JSON catalog is unchanged.

`npm run build` copies the template directory into `lib/catalog/templates`,
which is included in the npm package. Edit the source files rather than the
build output. No template engine or other dependency is shipped to browsers.

The catalog stylesheet vendors [Bolt.css](https://github.com/tbolt/boltcss/blob/main/bolt.css)
with its MIT license notice. Keep the upstream CSS intact and put local rules
under `Catalog layout and overrides` at the bottom of `style.css`. This file
is excluded from automatic formatting and linting to preserve the vendored
source. The stylesheet is copied into the generated site; no CDN is required.

## Development

```sh
npm ci
npm run build
npm run check
npm run typecheck
npm test
```

Run the built CLI with `node bin/run --help`. `npm test` rebuilds the package
before running the tests.

After changing command descriptions, options, or examples, regenerate the
command reference:

```sh
npm run readme
```

The script imports the CLI from source, walks its registered commands with
`getCommands()`, and renders `getHelp()` into fenced text blocks. It only
replaces the section between the `commands:start` and `commands:end` comments;
edit the rest of this README normally. No build is needed. Output uses a fixed
width, no colors, and noninteractive defaults so regeneration is repeatable.
Commit the updated README alongside command changes.

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

[MIT](LICENSE)
