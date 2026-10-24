// Entry point for `pnpm feed` (docs/architecture.md, "Feed").
// Placeholder: feature "Feed" replaces this with the A3 reMarkets polling loop.
import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
payload.logger.warn('feed: not implemented yet')
process.exit(0)
