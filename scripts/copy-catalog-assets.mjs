import { cp } from 'node:fs/promises'

await cp(
  new URL('../src/catalog/templates/', import.meta.url),
  new URL('../lib/catalog/templates/', import.meta.url),
  { recursive: true }
)
