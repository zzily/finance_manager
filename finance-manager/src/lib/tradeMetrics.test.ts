import { describe, expect, it } from "vitest"

import type { TradeRecord } from "../types"
import { filterTradeRecords, getTradeMetricGroups, getTradeOutcome } from "./tradeMetrics"

const records: TradeRecord[] = [
  {
    id: "trade-1",
    symbol: "BTCUSDT",
    market: "crypto",
    side: "long",
    traded_at: "2026-03-31",
    pnl: 320,
    setup: "趋势突破",
    note: "顺势加仓",
  },
  {
    id: "trade-2",
    symbol: "ETHUSDT",
    market: "crypto",
    side: "short",
    traded_at: "2026-03-26",
    pnl: -120,
    setup: "回撤做空",
    note: "止损执行",
  },
  {
    id: "trade-3",
    symbol: "IF 主连",
    market: "futures",
    side: "long",
    traded_at: "2026-03-05",
    pnl: 180,
    setup: "早盘反转",
    note: "按计划减仓",
  },
  {
    id: "trade-4",
    symbol: "AAPL",
    market: "stock",
    side: "long",
    traded_at: "2026-01-20",
    pnl: 40,
    setup: "财报波段",
    note: "低仓位试单",
  },
]

describe("tradeMetrics", () => {
  it("calculates total, monthly, and weekly snapshots", () => {
    const result = getTradeMetricGroups(records, new Date(2026, 2, 31, 12, 0, 0, 0))

    expect(result.total.count).toBe(4)
    expect(result.total.profit).toBe(420)
    expect(result.total.winRate).toBe(75)

    expect(result.month.count).toBe(3)
    expect(result.month.profit).toBe(380)
    expect(result.month.winRate).toBeCloseTo(66.67, 1)

    expect(result.week.count).toBe(2)
    expect(result.week.profit).toBe(200)
    expect(result.week.winRate).toBe(50)
  })

  it("filters trades by query and outcome", () => {
    expect(filterTradeRecords(records, "突破", "all")).toHaveLength(1)
    expect(filterTradeRecords(records, "", "win")).toHaveLength(3)
    expect(filterTradeRecords(records, "止损", "loss")).toHaveLength(1)
  })

  it("maps pnl values to outcomes", () => {
    expect(getTradeOutcome(10)).toBe("win")
    expect(getTradeOutcome(-1)).toBe("loss")
    expect(getTradeOutcome(0)).toBe("flat")
  })
})
