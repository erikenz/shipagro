// Stand-in for reMarkets, so the app runs (and deploys to Vercel) without A3 credentials or a
// long-lived polling process. Prices are a deterministic function of the symbol and the current
// minute: stateless, so every serverless instance agrees on the price at a given moment.

import type { A3Client, A3Instrument, A3Snapshot } from './a3Client'

const BASE_PRICE_BY_GRAIN: Record<string, number> = {
  SOJ: 318,
  MAI: 186,
  TRI: 210,
  GIR: 410,
  SOR: 160,
  CEB: 200,
}

const SYMBOLS = [
  'SOJ.ROS/NOV26',
  'SOJ.ROS/MAY27',
  'MAI.ROS/ABR27',
  'MAI.ROS/JUL27',
  'TRI.ROS/DIC26',
  'TRI.ROS/ENE27',
  'GIR.ROS/MAR27',
  'SOR.ROS/MAY27',
]

// A full swing takes 30 minutes and moves ±3%, enough to walk the seeded Precios gatillo
// (1–3% away) through cerca and alcanzado during a demo.
const PERIOD_MINUTES = 30
const AMPLITUDE = 0.03
const DAILY_LIMIT = 0.1
const MINUTE_MS = 60_000

function basePrice(symbol: string): number {
  return BASE_PRICE_BY_GRAIN[symbol.slice(0, 3)] ?? 200
}

function phaseOf(symbol: string): number {
  let hash = 0
  for (const char of symbol) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return (hash % 360) * (Math.PI / 180)
}

const round = (value: number, step: number) => Math.round(value / step) * step

/** The mock last-trade price for `symbol` during the minute that contains `at`. */
export function mockPrice(symbol: string, at: Date): { price: number; tradedAt: Date } {
  const minute = Math.floor(at.getTime() / MINUTE_MS)
  const angle = (2 * Math.PI * minute) / PERIOD_MINUTES + phaseOf(symbol)
  const price = round(basePrice(symbol) * (1 + AMPLITUDE * Math.sin(angle)), 0.1)
  return { price: Number(price.toFixed(1)), tradedAt: new Date(minute * MINUTE_MS) }
}

export function createMockA3Client(now: () => Date = () => new Date()): A3Client {
  return {
    async listInstruments(): Promise<A3Instrument[]> {
      return SYMBOLS.map((symbol) => {
        const base = basePrice(symbol)
        return {
          symbol,
          segment: 'DDA',
          cficode: 'FXXXSX',
          currency: 'USD',
          lowLimitPrice: Number((base * (1 - DAILY_LIMIT)).toFixed(1)),
          highLimitPrice: Number((base * (1 + DAILY_LIMIT)).toFixed(1)),
        }
      })
    },

    async getSnapshot(symbol): Promise<A3Snapshot> {
      if (!SYMBOLS.includes(symbol)) return { last: null, bid: null, offer: null }
      const { price, tradedAt } = mockPrice(symbol, now())
      return {
        last: { price, size: 50, tradedAt },
        bid: Number((price - 0.5).toFixed(1)),
        offer: Number((price + 0.5).toFixed(1)),
      }
    },
  }
}
