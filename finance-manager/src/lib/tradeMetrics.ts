import type { TradeMistakeType, TradeOutcome, TradeRecord } from "../types"

export type TradeMetricSnapshot = {
  count: number
  winRate: number
  grossPnl: number
  netPnl: number
  averageWin: number
  averageLoss: number
  payoffRatio: number | null
  profitFactor: number | null
  expectancy: number
  maxDrawdown: number
  longestWinStreak: number
  longestLossStreak: number
  averageHoldingMinutes: number | null
  feeRate: number
  planAdherenceRate: number | null
  worstDayPnl: number
}

export type TradeMetricGroups = {
  total: TradeMetricSnapshot
  month: TradeMetricSnapshot
  week: TradeMetricSnapshot
}

export type TradeOutcomeFilter = "all" | TradeOutcome

export type TradeBreakdownItem = {
  key: string
  label: string
  trades: number
  winRate: number
  netPnl: number
  expectancy: number
  averageHoldingMinutes: number | null
  planAdherenceRate: number | null
}

export type TradeEquityPoint = {
  date: string
  label: string
  equity: number
  drawdown: number
  netPnl: number
}

export type TradeCalendarDay = {
  date: string
  label: string
  netPnl: number
  count: number
}

export type TradeMonthlyBar = {
  month: string
  label: string
  netPnl: number
}

export type TradeMistakeStat = {
  type: TradeMistakeType
  count: number
  lossImpact: number
}

export type TradeAnalytics = {
  breakouts: {
    bySetup: TradeBreakdownItem[]
    bySymbol: TradeBreakdownItem[]
    bySession: TradeBreakdownItem[]
    byHoldingStyle: TradeBreakdownItem[]
  }
  equityCurve: TradeEquityPoint[]
  calendar: TradeCalendarDay[]
  monthlyBars: TradeMonthlyBar[]
  mistakeStats: TradeMistakeStat[]
}

type DailyProfit = {
  date: string
  netPnl: number
}

function parseTradeDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function parseDateTime(value?: string | null) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function startOfNextDay(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime()
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

function getTradeSortTime(record: TradeRecord) {
  const exactDate =
    parseDateTime(record.exit_at) ??
    parseDateTime(record.entry_at) ??
    parseTradeDate(record.traded_at)

  return exactDate?.getTime() ?? 0
}

function summarizeDailyProfits(records: TradeRecord[]): DailyProfit[] {
  const grouped = new Map<string, number>()

  records.forEach((record) => {
    grouped.set(record.traded_at, (grouped.get(record.traded_at) ?? 0) + getTradeNetPnl(record))
  })

  return Array.from(grouped.entries())
    .map(([date, netPnl]) => ({ date, netPnl }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

function summarize(records: TradeRecord[]): TradeMetricSnapshot {
  const count = records.length
  const netValues = records.map(getTradeNetPnl)
  const wins = netValues.filter((value) => value > 0)
  const losses = netValues.filter((value) => value < 0)
  const grossPnl = records.reduce((sum, record) => sum + record.pnl, 0)
  const netPnl = netValues.reduce((sum, value) => sum + value, 0)
  const grossProfit = wins.reduce((sum, value) => sum + value, 0)
  const grossLoss = Math.abs(losses.reduce((sum, value) => sum + value, 0))
  const holdingDurations = records
    .map(getTradeHoldingMinutes)
    .filter((value): value is number => typeof value === "number")
  const markedPlanRecords = records.filter((record) => typeof record.followed_plan === "boolean")
  const followedPlanCount = markedPlanRecords.filter((record) => record.followed_plan).length
  const totalFees = records.reduce((sum, record) => sum + getTradeCost(record), 0)
  const dailyProfits = summarizeDailyProfits(records)

  let runningEquity = 0
  let peakEquity = 0
  let maxDrawdown = 0
  let longestWinStreak = 0
  let longestLossStreak = 0
  let currentWinStreak = 0
  let currentLossStreak = 0

  records
    .slice()
    .sort((left, right) => getTradeSortTime(left) - getTradeSortTime(right))
    .forEach((record) => {
      const value = getTradeNetPnl(record)
      runningEquity += value
      peakEquity = Math.max(peakEquity, runningEquity)
      maxDrawdown = Math.max(maxDrawdown, peakEquity - runningEquity)

      if (value > 0) {
        currentWinStreak += 1
        currentLossStreak = 0
      } else if (value < 0) {
        currentLossStreak += 1
        currentWinStreak = 0
      } else {
        currentWinStreak = 0
        currentLossStreak = 0
      }

      longestWinStreak = Math.max(longestWinStreak, currentWinStreak)
      longestLossStreak = Math.max(longestLossStreak, currentLossStreak)
    })

  return {
    count,
    winRate: count === 0 ? 0 : (wins.length / count) * 100,
    grossPnl,
    netPnl,
    averageWin: wins.length === 0 ? 0 : grossProfit / wins.length,
    averageLoss: losses.length === 0 ? 0 : grossLoss / losses.length,
    payoffRatio: grossLoss === 0 ? null : (wins.length === 0 ? 0 : grossProfit / wins.length) / (grossLoss / losses.length),
    profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss,
    expectancy: count === 0 ? 0 : netPnl / count,
    maxDrawdown,
    longestWinStreak,
    longestLossStreak,
    averageHoldingMinutes:
      holdingDurations.length === 0
        ? null
        : holdingDurations.reduce((sum, value) => sum + value, 0) / holdingDurations.length,
    feeRate: grossProfit <= 0 ? 0 : (totalFees / grossProfit) * 100,
    planAdherenceRate:
      markedPlanRecords.length === 0 ? null : (followedPlanCount / markedPlanRecords.length) * 100,
    worstDayPnl:
      dailyProfits.length === 0
        ? 0
        : dailyProfits.reduce((worst, item) => Math.min(worst, item.netPnl), 0),
  }
}

function toBreakdownItem(label: string, records: TradeRecord[]): TradeBreakdownItem {
  const snapshot = summarize(records)

  return {
    key: label,
    label,
    trades: snapshot.count,
    winRate: snapshot.winRate,
    netPnl: snapshot.netPnl,
    expectancy: snapshot.expectancy,
    averageHoldingMinutes: snapshot.averageHoldingMinutes,
    planAdherenceRate: snapshot.planAdherenceRate,
  }
}

function buildBreakdown(
  records: TradeRecord[],
  resolver: (record: TradeRecord) => string,
  limit = 5,
) {
  const groups = new Map<string, TradeRecord[]>()

  records.forEach((record) => {
    const key = resolver(record)
    groups.set(key, [...(groups.get(key) ?? []), record])
  })

  return Array.from(groups.entries())
    .map(([label, items]) => toBreakdownItem(label, items))
    .sort((left, right) => {
      if (right.netPnl !== left.netPnl) {
        return right.netPnl - left.netPnl
      }

      return right.trades - left.trades
    })
    .slice(0, limit)
}

export function getTradeNetPnl(record: TradeRecord) {
  return record.pnl - getTradeCost(record)
}

export function getTradeCost(record: TradeRecord) {
  return (record.fees ?? 0) + (record.slippage ?? 0)
}

export function getTradeHoldingMinutes(record: TradeRecord) {
  const entryAt = parseDateTime(record.entry_at)
  const exitAt = parseDateTime(record.exit_at)

  if (!entryAt || !exitAt) {
    return null
  }

  const diff = exitAt.getTime() - entryAt.getTime()
  if (diff <= 0) {
    return null
  }

  return diff / (1000 * 60)
}

export function getTradeHoldingLabel(record: TradeRecord) {
  const minutes = getTradeHoldingMinutes(record)

  if (minutes === null) {
    return "未标注时长"
  }

  if (minutes < 30) {
    return "0-30 分钟"
  }

  if (minutes < 120) {
    return "30-120 分钟"
  }

  if (minutes < 24 * 60) {
    return "日内 > 2 小时"
  }

  return "持仓过夜"
}

export function getTradeSessionLabel(record: TradeRecord) {
  const minutes = getTradeHoldingMinutes(record)
  if (typeof minutes === "number" && minutes >= 24 * 60) {
    return "持仓过夜"
  }

  const date = parseDateTime(record.entry_at)
  if (!date) {
    return "未标注时段"
  }

  const minuteOfDay = date.getHours() * 60 + date.getMinutes()

  if (minuteOfDay < 10 * 60) {
    return "开盘窗口"
  }

  if (minuteOfDay < 14 * 60 + 30) {
    return "盘中"
  }

  if (minuteOfDay < 17 * 60) {
    return "尾盘"
  }

  return "夜盘 / 其他"
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

export function getTradeAnalytics(records: TradeRecord[]): TradeAnalytics {
  const sortedRecords = records
    .slice()
    .sort((left, right) => getTradeSortTime(left) - getTradeSortTime(right))

  let equity = 0
  let peak = 0

  const equityCurve = sortedRecords.map((record) => {
    const value = getTradeNetPnl(record)
    equity += value
    peak = Math.max(peak, equity)

    return {
      date: record.traded_at,
      label: record.traded_at.slice(5),
      equity,
      drawdown: peak - equity,
      netPnl: value,
    }
  })

  const dailyGroups = summarizeDailyProfits(records)
  const calendar = dailyGroups.map((item) => ({
    date: item.date,
    label: item.date.slice(5),
    netPnl: item.netPnl,
    count: records.filter((record) => record.traded_at === item.date).length,
  }))

  const monthlyStore = new Map<string, number>()
  records.forEach((record) => {
    const monthKey = record.traded_at.slice(0, 7)
    monthlyStore.set(monthKey, (monthlyStore.get(monthKey) ?? 0) + getTradeNetPnl(record))
  })

  const monthlyBars = Array.from(monthlyStore.entries())
    .map(([month, netPnl]) => ({
      month,
      label: month.replace("-", "/"),
      netPnl,
    }))
    .sort((left, right) => left.month.localeCompare(right.month))
    .slice(-6)

  const mistakeStore = new Map<TradeMistakeType, TradeMistakeStat>()
  records.forEach((record) => {
    record.mistake_tags.forEach((type) => {
      const prev = mistakeStore.get(type) ?? {
        type,
        count: 0,
        lossImpact: 0,
      }

      prev.count += 1
      prev.lossImpact += Math.abs(Math.min(getTradeNetPnl(record), 0))
      mistakeStore.set(type, prev)
    })
  })

  return {
    breakouts: {
      bySetup: buildBreakdown(records, (record) => record.setup?.trim() || "未标记 setup"),
      bySymbol: buildBreakdown(records, (record) => record.symbol.trim()),
      bySession: buildBreakdown(records, getTradeSessionLabel),
      byHoldingStyle: buildBreakdown(records, getTradeHoldingLabel),
    },
    equityCurve,
    calendar,
    monthlyBars,
    mistakeStats: Array.from(mistakeStore.values()).sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return right.lossImpact - left.lossImpact
    }),
  }
}

export function getOptionDaysToExpiration(
  expirationDate: string | null | undefined,
  tradeTime: string | null | undefined,
) {
  const expiration = parseTradeDate(expirationDate ?? "")
  const parsedTradeDateTime = parseDateTime(tradeTime)
  const tradeDate = parsedTradeDateTime
    ? parseTradeDate(toDateKey(parsedTradeDateTime))
    : parseTradeDate((tradeTime ?? "").slice(0, 10))

  if (!expiration || !tradeDate) {
    return null
  }

  const diff = expiration.getTime() - tradeDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
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
      (record.note ?? "").toLowerCase().includes(normalizedQuery) ||
      (record.thesis ?? "").toLowerCase().includes(normalizedQuery) ||
      (record.lesson ?? "").toLowerCase().includes(normalizedQuery) ||
      record.mistake_tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))

    const matchesOutcome = outcome === "all" || getTradeOutcome(getTradeNetPnl(record)) === outcome

    return matchesQuery && matchesOutcome
  })
}
