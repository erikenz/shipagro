import type { GlobalConfig } from 'payload'

import { authenticated, superAdminOnly } from '@/access'

// Kept current by `pnpm feed`; the dashboard reads it to show when prices last updated.
export const FeedStatus: GlobalConfig = {
  slug: 'feed-status',
  label: 'Estado del feed',
  access: { read: authenticated, update: superAdminOnly },
  fields: [
    {
      name: 'lastSuccessAt',
      type: 'date',
      label: 'Último poll exitoso',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'lastError', type: 'textarea', label: 'Último error' },
  ],
}
