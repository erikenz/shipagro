// Entry point for `pnpm seed`: wipes ShipAgro data and loads the development dataset.
import config from '@payload-config'
import { getPayload } from 'payload'

import { seed } from './seed'

const payload = await getPayload({ config })
await seed(payload)
process.exit(0)
