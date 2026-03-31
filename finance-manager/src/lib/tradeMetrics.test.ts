import { describe, expect, it } from "vitest"

import type { TradeRecord } from "../types"
import {
  filterTradeRecords,
  getTradeAnalytics,
  getTradeHoldingLabel,
  getTradeMetricGroups,
  getTradeNetPnl,
  getTradeOutcome,
  getTradeSessionLabel,
} from "./tradeMetrics"

const records: TradeRecord[] = [
  {
    id: 1,
    symbol: "SPY",
    market: "stock",
    side: "long",
    traded_at: "2026-03-31",
    pnl: 320,
    setup: "Opening range breakout",
    note: "顺势加仓",
    created_at: "2026-03-31T00:00:00Z",
    entry_at: "2026-03-31T09:35",
    exit_at: "2026-03-31T10:05",
    entry_price: 518.2,
    exit_price: 521.6,
    position_size: 100,
    thesis: "突破昨日高点后放量延续",
    planned_stop: 516.5,
    planned_target: 522,
    actual_stop: null,
    actual_target: 521.6,
    fees: 8,
    slippage: 2,
    followed_plan: true,
    plan_clarity: "clear",
    execution_quality: "disciplined",
    mistake_tags: [],
    lesson: "确认放量后加仓更稳",
    option_expiration: null,
    option_strike: null,
    option_right: null,
    option_structure: null,
    option_premium_type: null,
    option_max_risk: null,
    option_max_reward: null,
    option_delta: null,
  },
  {
    id: 2,
    symbol: "NVDA",
    market: "stock",
    side: "short",
    traded_at: "2026-03-26",
    pnl: -120,
    setup: "午盘反抽做空",
    note: "止损执行",
    created_at: "2026-03-26T00:00:00Z",
    entry_at: "2026-03-26T13:10",
    exit_at: "2026-03-26T15:00",
    entry_price: 995,
    exit_price: 999,
    position_size: 20,
    thesis: "弱势反抽不过 VWAP",
    planned_stop: 1000,
    planned_target: 985,
    actual_stop: 999,
    actual_target: null,
    fees: 5,
    slippage: 1,
    followed_plan: true,
    plan_clarity: "clear",
    execution_quality: "disciplined",
    mistake_tags: ["holding_loser"],
    lesson: "弱势股不该补第二次仓",
    option_expiration: null,
    option_strike: null,
    option_right: null,
    option_structure: null,
    option_premium_type: null,
    option_max_risk: null,
    option_max_reward: null,
    option_delta: null,
  },
  {
    id: 3,
    symbol: "TSLA",
    market: "options",
    side: "long",
    traded_at: "2026-03-05",
    pnl: 180,
    setup: "财报前波动率交易",
    note: "提前止盈",
    created_at: "2026-03-05T00:00:00Z",
    entry_at: "2026-03-05T10:30",
    exit_at: "2026-03-06T11:00",
    entry_price: 6.5,
    exit_price: 8.2,
    position_size: 2,
    thesis: "IV 扩张延续",
    planned_stop: 5.2,
    planned_target: 9.5,
    actual_stop: null,
    actual_target: 8.2,
    fees: 4,
    slippage: 1,
    followed_plan: false,
    plan_clarity: "mixed",
    execution_quality: "drifted",
    mistake_tags: ["early_exit"],
    lesson: "达到目标前不要先被盈亏波动吓出场",
    option_expiration: "2026-03-20",
    option_strike: 300,
    option_right: "call",
    option_structure: "single",
    option_premium_type: "debit",
    option_max_risk: 130,
    option_max_reward: 400,
    option_delta: 0.34,
  },
  {
    id: 4,
    symbol: "AAPL",
    market: "stock",
    side: "long",
    traded_at: "2026-01-20",
    pnl: 40,
    setup: "财报波段",
    note: "低仓位试单",
    created_at: "2026-01-20T00:00:00Z",
    entry_at: null,
    exit_at: null,
    entry_price: null,
    exit_price: null,
    position_size: null,
    thesis: null,
    planned_stop: null,
    planned_target: null,
    actual_stop: null,
    actual_target: null,
    fees: null,
    slippage: null,
    followed_plan: null,
    plan_clarity: null,
    execution_quality: null,
    mistake_tags: ["unplanned"],
    lesson: null,
    option_expiration: null,
    option_strike: null,
    option_right: null,
    option_structure: null,
    option_premium_type: null,
    option_max_risk: null,
    option_max_reward: null,
    option_delta: null,
  },
]

describe("tradeMetrics", () => {
  it("calculates total, monthly, and weekly snapshots using net pnl and execution data", () => {
    const result = getTradeMetricGroups(records, new Date(2026, 2, 31, 12, 0, 0, 0))

    expect(result.total.count).toBe(4)
    expect(result.total.grossPnl).toBe(420)
    expect(result.total.netPnl).toBe(399)
    expect(result.total.winRate).toBe(75)
    expect(result.total.averageWin).toBe(175)
    expect(result.total.averageLoss).toBe(126)
    expect(result.total.payoffRatio).toBeCloseTo(1.39, 2)
    expect(result.total.profitFactor).toBeCloseTo(4.17, 2)
    expect(result.total.maxDrawdown).toBe(126)
    expect(result.total.averageHoldingMinutes).toBeCloseTo(536.67, 1)
    expect(result.total.planAdherenceRate).toBeCloseTo(66.67, 1)
    expect(result.total.worstDayPnl).toBe(-126)

    expect(result.month.count).toBe(3)
    expect(result.month.netPnl).toBe(359)

    expect(result.week.count).toBe(2)
    expect(result.week.netPnl).toBe(184)
  })

  it("builds analytics for charts and dimension breakdowns", () => {
    const analytics = getTradeAnalytics(records)

    expect(analytics.equityCurve).toHaveLength(4)
    expect(analytics.monthlyBars).toHaveLength(2)
    expect(analytics.breakouts.bySetup[0]?.label).toBe("Opening range breakout")
    expect(analytics.breakouts.bySession.map((item) => item.label)).toContain("开盘窗口")
    expect(analytics.breakouts.byHoldingStyle.map((item) => item.label)).toContain("持仓过夜")
    expect(analytics.mistakeStats[0]).toEqual({
      type: "holding_loser",
      count: 1,
      lossImpact: 126,
    })
  })

  it("filters trades by extended fields and maps trading context labels", () => {
    expect(filterTradeRecords(records, "VWAP", "loss")).toHaveLength(1)
    expect(filterTradeRecords(records, "holding_loser", "loss")).toHaveLength(1)
    expect(getTradeNetPnl(records[0])).toBe(310)
    expect(getTradeHoldingLabel(records[0])).toBe("30-120 分钟")
    expect(getTradeHoldingLabel(records[2])).toBe("持仓过夜")
    expect(getTradeSessionLabel(records[0])).toBe("开盘窗口")
    expect(getTradeSessionLabel(records[2])).toBe("持仓过夜")
    expect(getTradeOutcome(getTradeNetPnl(records[1]))).toBe("loss")
  })
})
