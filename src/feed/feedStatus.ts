import type { Payload } from 'payload'

const MIN_WRITE_INTERVAL_MS = 10_000

/** Collects poll outcomes and writes the `feed-status` global at most every 10 s. */
export function createFeedStatusReporter(payload: Payload) {
  let lastSuccessAt: Date | null = null
  let lastError: string | null = null
  let dirty = false
  let lastWriteAt = 0

  async function write() {
    dirty = false
    lastWriteAt = Date.now()
    await payload.updateGlobal({
      slug: 'feed-status',
      data: {
        ...(lastSuccessAt ? { lastSuccessAt: lastSuccessAt.toISOString() } : {}),
        ...(lastError !== null ? { lastError } : {}),
      },
      overrideAccess: true,
    })
  }

  return {
    success() {
      lastSuccessAt = new Date()
      dirty = true
    },
    failure(message: string) {
      lastError = `${new Date().toISOString()} ${message}`
      dirty = true
    },
    /** Writes pending changes if 10 s have passed since the last write, or always when `force`. */
    async flush(force = false) {
      if (!dirty) return
      if (!force && Date.now() - lastWriteAt < MIN_WRITE_INTERVAL_MS) return
      try {
        await write()
      } catch (err) {
        dirty = true
        payload.logger.error({ err }, 'feed: could not update feed-status')
      }
    },
  }
}
