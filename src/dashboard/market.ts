import { argentinaClock } from '@/pendientes/time'

const CLOSE = 17 * 60
const OPEN_WINTER = 10 * 60 + 30
// From November to March the market opens at 11:00.
const OPEN_SUMMER = 11 * 60
const SUMMER_MONTHS = new Set([11, 12, 1, 2, 3])

/** A3 grain market hours, Monday to Friday in Argentina time. Holidays aren't handled. */
export const isMarketOpen = (now: Date): boolean => {
  const { weekday, month, minutes } = argentinaClock(now)
  if (weekday < 1 || weekday > 5) return false
  const open = SUMMER_MONTHS.has(month) ? OPEN_SUMMER : OPEN_WINTER
  return minutes >= open && minutes < CLOSE
}

export const STALE_AFTER_MS = 2 * 60 * 1000

export type FeedState =
  | { kind: 'cerrado'; lastSuccessAt?: string | null }
  | { kind: 'sin-actualizar'; lastSuccessAt?: string | null }
  | { kind: 'al-dia'; lastSuccessAt: string }

export const feedState = (
  lastSuccessAt: string | null | undefined,
  now: Date,
  { ignoreMarketHours = false }: { ignoreMarketHours?: boolean } = {},
): FeedState => {
  if (!ignoreMarketHours && !isMarketOpen(now)) return { kind: 'cerrado', lastSuccessAt }
  if (!lastSuccessAt || now.getTime() - new Date(lastSuccessAt).getTime() > STALE_AFTER_MS) {
    return { kind: 'sin-actualizar', lastSuccessAt }
  }
  return { kind: 'al-dia', lastSuccessAt }
}
