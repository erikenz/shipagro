// Thin client for A3's Trading API (reMarkets in the demo). The only code that knows
// A3 URLs and JSON; see docs/research/a3-mercados-apis.md §1a and §3.4.

export const DEFAULT_A3_BASE_URL = 'https://api.remarkets.primary.com.ar'
const MARKET_ID = 'ROFX'
// The token lasts 24 h; renew it a bit earlier so a request never races its expiry.
const TOKEN_MAX_AGE_MS = 23 * 60 * 60 * 1000

export class A3Error extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'A3Error'
  }
}

class A3UnauthorizedError extends A3Error {}

export type A3Instrument = {
  symbol: string
  segment: string | null
  cficode: string | null
  currency: string | null
  lowLimitPrice: number | null
  highLimitPrice: number | null
}

export type A3Trade = { price: number; size: number | null; tradedAt: Date }

export type A3Snapshot = {
  /** Last trade (`LA`); null when the Instrumento hasn't traded yet. */
  last: A3Trade | null
  bid: number | null
  offer: number | null
}

export type A3Client = {
  listInstruments(signal?: AbortSignal): Promise<A3Instrument[]>
  getSnapshot(symbol: string, signal?: AbortSignal): Promise<A3Snapshot>
}

type A3ClientOptions = { baseUrl: string; username: string; password: string }

export function a3ClientFromEnv(env: NodeJS.ProcessEnv = process.env): A3Client {
  const username = env.A3_USERNAME
  const password = env.A3_PASSWORD
  if (!username || !password) {
    throw new Error('feed: A3_USERNAME and A3_PASSWORD must be set (see .env.example)')
  }
  return createA3Client({ baseUrl: env.A3_BASE_URL || DEFAULT_A3_BASE_URL, username, password })
}

export function createA3Client({ baseUrl, username, password }: A3ClientOptions): A3Client {
  const base = baseUrl.replace(/\/+$/, '')
  let token: string | null = null
  let tokenObtainedAt = 0

  async function fetchToken(signal?: AbortSignal): Promise<string> {
    const res = await fetch(`${base}/auth/getToken`, {
      method: 'POST',
      headers: { 'X-Username': username, 'X-Password': password },
      redirect: 'manual',
      signal,
    })
    const value = res.headers.get('X-Auth-Token')
    if (!res.ok || !value) {
      throw new A3Error(`A3 login failed (HTTP ${res.status})`, res.status)
    }
    token = value
    tokenObtainedAt = Date.now()
    return value
  }

  async function currentToken(signal?: AbortSignal): Promise<string> {
    if (token && Date.now() - tokenObtainedAt < TOKEN_MAX_AGE_MS) return token
    return fetchToken(signal)
  }

  async function requestOnce(path: string, authToken: string, signal?: AbortSignal): Promise<unknown> {
    const res = await fetch(`${base}${path}`, {
      headers: { 'X-Auth-Token': authToken, Accept: 'application/json' },
      // An unauthenticated request gets a 302 to /login.html; don't follow it.
      redirect: 'manual',
      signal,
    })
    if (res.status === 401 || (res.status >= 300 && res.status < 400)) {
      throw new A3UnauthorizedError(`A3 rejected the token (HTTP ${res.status})`, res.status)
    }
    if (!res.ok) throw new A3Error(`A3 ${path} failed (HTTP ${res.status})`, res.status)

    const body = (await res.json()) as { status?: string; description?: string | null; message?: string | null }
    if (body.status !== 'OK') {
      throw new A3Error(`A3 ${path}: ${body.description || body.message || 'status ' + body.status}`)
    }
    return body
  }

  async function get(path: string, signal?: AbortSignal): Promise<unknown> {
    try {
      return await requestOnce(path, await currentToken(signal), signal)
    } catch (err) {
      if (!(err instanceof A3UnauthorizedError)) throw err
      token = null
      return requestOnce(path, await fetchToken(signal), signal)
    }
  }

  return {
    async listInstruments(signal) {
      const body = (await get('/rest/instruments/details', signal)) as { instruments?: RawInstrument[] }
      return (body.instruments ?? []).flatMap((raw) => {
        const symbol = raw.instrumentId?.symbol
        if (!symbol) return []
        return [
          {
            symbol,
            segment: raw.segment?.marketSegmentId ?? null,
            cficode: raw.cficode ?? null,
            currency: raw.currency ?? null,
            lowLimitPrice: toNumber(raw.lowLimitPrice),
            highLimitPrice: toNumber(raw.highLimitPrice),
          },
        ]
      })
    },

    async getSnapshot(symbol, signal) {
      const query = new URLSearchParams({ marketId: MARKET_ID, symbol, entries: 'LA,BI,OF', depth: '1' })
      const body = (await get(`/rest/marketdata/get?${query}`, signal)) as { marketData?: RawMarketData }
      const md = body.marketData ?? {}
      const price = toNumber(md.LA?.price)
      const date = toNumber(md.LA?.date)
      return {
        last:
          price === null || date === null
            ? null
            : { price, size: toNumber(md.LA?.size), tradedAt: new Date(date) },
        bid: toNumber(md.BI?.[0]?.price),
        offer: toNumber(md.OF?.[0]?.price),
      }
    },
  }
}

type RawInstrument = {
  instrumentId?: { symbol?: string | null } | null
  segment?: { marketSegmentId?: string | null } | null
  cficode?: string | null
  currency?: string | null
  lowLimitPrice?: unknown
  highLimitPrice?: unknown
}

type RawEntry = { price?: unknown; size?: unknown; date?: unknown } | null
type RawMarketData = { LA?: RawEntry; BI?: RawEntry[] | null; OF?: RawEntry[] | null }

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
