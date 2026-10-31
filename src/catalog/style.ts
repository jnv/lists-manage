export const stylesheet = `
:root { color-scheme: light dark; font: 100%/1.55 system-ui, sans-serif; --muted: light-dark(#555, #bbb); --line: light-dark(#d5d5d5, #484848); --surface: light-dark(#f5f5f3, #252525); }
* { box-sizing: border-box; }
body { max-width: 88rem; margin: auto; padding: 2rem clamp(.75rem, 3vw, 3rem); }
a { color: light-dark(#174ea6, #99c3ff); text-underline-offset: .15em; }
a:hover { text-decoration-thickness: .15em; }
h1 { font-size: 2.5rem; line-height: 1.1; margin: .4rem 0; letter-spacing: -.04em; }
header p { color: var(--muted); max-width: 65ch; }
header { margin-bottom: 2rem; }
form { padding: 1rem; background: var(--surface); border: 1px solid var(--line); border-radius: .4rem; margin-bottom: 1rem; }
.controls { display: flex; flex-wrap: wrap; align-items: end; gap: .75rem; }
label { display: block; font-weight: 600; }
.search { flex: 1 1 20rem; }
.category { flex: 0 1 22rem; min-width: 0; }
input, select, button { font: inherit; padding: .55rem .7rem; border: 1px solid var(--line); border-radius: .25rem; background: Canvas; color: CanvasText; }
input, select { width: 100%; min-width: 0; }
button { cursor: pointer; }
:focus-visible { outline: 3px solid light-dark(#174ea6, #99c3ff); outline-offset: 3px; }
.hint, .meta, caption { color: var(--muted); font-size: .875rem; }
.hint { margin: .6rem 0; }
output { display: block; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; }
caption { text-align: left; padding: .5rem 0; }
th, td { padding: .9rem .75rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--line); overflow-wrap: anywhere; }
thead th { font-size: .875rem; }
th:first-child { width: 29%; }
th:last-child { width: 20%; }
tbody th { font-weight: 600; }
.meta { display: block; font-weight: 400; margin-top: .3rem; }
.websites { margin-top: .4rem; font-weight: 400; font-size: .875rem; }
.details { margin: .5rem 0 0; padding-left: 1.2rem; }
.tag { display: inline-block; font-size: .8rem; border: 1px solid var(--line); border-radius: .25rem; padding: .1rem .4rem; margin: 0 .25rem .25rem 0; }
[hidden] { display: none !important; }
footer { margin-top: 2rem; color: var(--muted); font-size: .875rem; }
@media (max-width: 40rem) {
  body { padding-top: 1.25rem; }
  th, td { padding: .65rem .35rem; font-size: .875rem; }
  th:first-child { width: 31%; } th:last-child { width: 21%; }
  .tag { font-size: .75rem; padding: .05rem .2rem; }
  .category { flex-grow: 1; }
}
`
