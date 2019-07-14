const REMOVE_PATTERNS = [
  /^.*(list|curation|collection)\s+of\s+(awesome)?\s*/i,
  /^(amazingly)?\s*awesome\s+/i,
  /\s*inspired\s+by.*$/i,
]

function removePatterns(str: string): string {
  return REMOVE_PATTERNS.reduce((str, regex): string => {
    return str.replace(regex, '')
  }, str)
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function normalizeDesc(desc: string): string {
  const afterRemoval = removePatterns(desc)

  return capitalize(afterRemoval)
}
