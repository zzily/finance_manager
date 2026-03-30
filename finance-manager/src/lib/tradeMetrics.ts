import type { TradeOutcome, TradeRecord } from "../types"

export type TradeMetricSnapshot = {
  count: number
  winRate: number
  profit: number
}

export type TradeMetricGroups = {
  total: TradeMetricSnapshot
  month: TradeMetricSnapshot
  week: TradeMetricSnapshot
}

export type TradeOutcomeFilter = "all" | TradeOutcome

function parseTradeDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function getWindowStart(now: Date, days: number) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1), 0, 0, 0, 0)
}

function isInRollingWindow(tradedAt: string, days: number, now: Date) {
  const tradeDate = parseTradeDate(tradedAt)

  if (!tradeDate) {
    return false
  }

  const start = getWindowStart(now, days).getTime()
  const end = startOfNextDay(now)

  return tradeDate.getTime() >= start && tradeDate.getTime() < end
}

function startOfNextDay(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime()
}

function summarize(records: TradeRecord[]): TradeMetricSnapshot {
  const count = records.length
  const wins = records.filter((record) => record.pnl > 0).length
  const profit = records.reduce((sum, record) => sum + record.pnl, 0)

  return {
    count,
    winRate: count === 0 ? 0 : (wins / count) * 100,
    profit,
  }
}

export function getTradeOutcome(pnl: number): TradeOutcome {
  if (pnl > 0) {
    return "win"
  }

  if (pnl < 0) {
    return "loss"
  }

  return "flat"
}

export function getTradeMetricGroups(records: TradeRecord[], now = new Date()): TradeMetricGroups {
  const monthRecords = records.filter((record) => isInRollingWindow(record.traded_at, 30, now))
  const weekRecords = records.filter((record) => isInRollingWindow(record.traded_at, 7, now))

  return {
    total: summarize(records),
    month: summarize(monthRecords),
    week: summarize(weekRecords),
  }
}

export function filterTradeRecords(
  records: TradeRecord[],
  query: string,
  outcome: TradeOutcomeFilter,
) {
  const normalizedQuery = query.trim().toLowerCase()

  return records.filter((record) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      record.symbol.toLowerCase().includes(normalizedQuery) ||
      (record.setup ?? "").toLowerCase().includes(normalizedQuery) ||
      (record.note ?? "").toLowerCase().includes(normalizedQuery)

    const matchesOutcome =
      outcome === "all" || getTradeOutcome(record.pnl) === outcome

    return matchesQuery && matchesOutcome
  })
}
