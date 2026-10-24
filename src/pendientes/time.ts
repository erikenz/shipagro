// Argentina calendar and clock helpers. "Today", "overdue" and market hours are judged in
// Argentina time regardless of where the server runs.

export const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires'

const DAY_MS = 24 * 60 * 60 * 1000

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ARGENTINA_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** The Argentina calendar day of an instant, as `YYYY-MM-DD` (sorts and compares as a string). */
export const argentinaDay = (date: Date | string): string => dayFormatter.format(new Date(date))

/**
 * The instant to store for an Argentina calendar day `days` after `from`'s. Noon UTC is
 * 09:00 in Argentina, so the Plazo shows the same day in any nearby timezone.
 */
export const argentinaDayPlus = (from: Date, days: number): string => {
  const [year, month, day] = argentinaDay(from).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days, 12)).toISOString()
}

export const daysAgo = (now: Date, days: number): Date => new Date(now.getTime() - days * DAY_MS)

const clockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: ARGENTINA_TZ,
  weekday: 'short',
  month: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Weekday (0 = Sunday), month (1–12) and minutes since midnight, in Argentina time. */
export const argentinaClock = (date: Date): { weekday: number; month: number; minutes: number } => {
  const parts = Object.fromEntries(
    clockFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  ) as Record<Intl.DateTimeFormatPartTypes, string>
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday)
  return {
    weekday,
    month: Number(parts.month),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

const shortDate = new Intl.DateTimeFormat('es-AR', { timeZone: ARGENTINA_TZ, day: '2-digit', month: '2-digit' })
const shortTime = new Intl.DateTimeFormat('es-AR', {
  timeZone: ARGENTINA_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** `dd/mm` in Argentina time. */
export const formatDay = (date: Date | string): string => shortDate.format(new Date(date))

/** `HH:MM` in Argentina time. */
export const formatTime = (date: Date | string): string => shortTime.format(new Date(date))
