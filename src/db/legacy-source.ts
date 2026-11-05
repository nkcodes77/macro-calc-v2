/** Key the first app saved under. Both apps live on nkcodes77.github.io, so they share localStorage. */
export const LEGACY_KEY = 'macrocalc.v1'

/** Returns the first app's saved data if this browser has it and it has any history, else null. */
export function readLegacy(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): unknown {
  try {
    const raw = storage?.getItem(LEGACY_KEY)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}
