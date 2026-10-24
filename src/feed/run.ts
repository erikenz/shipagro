// Entry point for `pnpm feed` (docs/architecture.md, "Feed"). Runs until SIGINT or SIGTERM.
import config from '@payload-config'
import { getPayload } from 'payload'

import { runFeed } from './index'

const payload = await getPayload({ config })
const controller = new AbortController()

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    payload.logger.info(`feed: ${signal} received, stopping`)
    controller.abort()
  })
}

let exitCode = 0
try {
  await runFeed(payload, { signal: controller.signal })
} catch (err) {
  payload.logger.error({ err }, 'feed: fatal error')
  exitCode = 1
} finally {
  await payload.db.destroy?.()
}
process.exit(exitCode)
