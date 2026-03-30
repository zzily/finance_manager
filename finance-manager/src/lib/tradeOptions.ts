import type { TradeMarket, TradeOutcome, TradeSide } from "../types"

export const TRADE_SIDE_OPTIONS: Array<{ label: string; value: TradeSide }> = [
  { value: "long", label: "做多" },
  { value: "short", label: "做空" },
]

export const TRADE_MARKET_OPTIONS: Array<{ label: string; value: TradeMarket }> = [
  { value: "stock", label: "股票" },
  { value: "crypto", label: "加密货币" },
  { value: "futures", label: "期货" },
  { value: "forex", label: "外汇" },
  { value: "options", label: "期权" },
  { value: "other", label: "其他" },
]

export const TRADE_OUTCOME_LABELS: Record<TradeOutcome, string> = {
  win: "盈利",
  loss: "亏损",
  flat: "保本",
}

export const TRADE_SIDE_LABELS: Record<TradeSide, string> = {
  long: "做多",
  short: "做空",
}

export const TRADE_MARKET_LABELS: Record<TradeMarket, string> = {
  stock: "股票",
  crypto: "加密货币",
  futures: "期货",
  forex: "外汇",
  options: "期权",
  other: "其他",
}
