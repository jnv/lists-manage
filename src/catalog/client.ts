// This function is emitted as a standalone script; keep it self-contained.
export function enhanceCatalog() {
  const form = document.querySelector<HTMLFormElement>('#filters')
  const search = document.querySelector<HTMLInputElement>('#search')
  const category = document.querySelector<HTMLSelectElement>('#category')
  const count = document.querySelector<HTMLOutputElement>('#count')
  const empty = document.querySelector<HTMLElement>('#empty')
  if (!form || !search || !category || !count || !empty) return
  function normalize(text: string) {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  }
  const rows = Array.from(
    document.querySelectorAll<HTMLTableRowElement>('tbody tr')
  ).map((row) => ({
    row,
    text: normalize(row.textContent ?? ''),
    categories: JSON.parse(row.dataset.categories ?? '[]') as string[],
  }))
  function apply() {
    if (!search || !category || !count || !empty) return
    const words = normalize(search.value).split(/\s+/).filter(Boolean)
    let visible = 0
    for (const item of rows) {
      const matches =
        words.every((word) => item.text.includes(word)) &&
        (!category.value || item.categories.includes(category.value))
      item.row.hidden = !matches
      if (matches) visible++
    }
    count.value = `${visible.toLocaleString()} of ${rows.length.toLocaleString()} lists`
    empty.hidden = visible !== 0
  }
  function restore() {
    if (!search || !category) return
    const params = new URL(location.href).searchParams
    search.value = params.get('q') ?? ''
    category.value = params.get('category') ?? ''
    apply()
  }
  function save() {
    if (!search || !category) return
    const url = new URL(location.href)
    if (search.value) url.searchParams.set('q', search.value)
    else url.searchParams.delete('q')
    if (category.value) url.searchParams.set('category', category.value)
    else url.searchParams.delete('category')
    if (url.href !== location.href) history.pushState(null, '', url)
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  function flush() {
    clearTimeout(timer)
    save()
  }
  search.addEventListener('input', () => {
    apply()
    clearTimeout(timer)
    timer = setTimeout(save, 400)
  })
  search.addEventListener('change', flush)
  category.addEventListener('change', () => {
    apply()
    flush()
  })
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    apply()
    flush()
  })
  form.addEventListener('reset', (event) => {
    event.preventDefault()
    search.value = ''
    category.value = ''
    apply()
    flush()
    search.focus()
  })
  window.addEventListener('popstate', () => {
    clearTimeout(timer)
    restore()
  })
  restore()
  form.hidden = false
}
