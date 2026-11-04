# Static catalog export

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

## Editing the catalog presentation

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
