export const normalizeName = (name?: string): string => {
  if (!name) return null

  return name.trim()
}
