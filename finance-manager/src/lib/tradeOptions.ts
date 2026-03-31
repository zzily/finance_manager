import type {
  TradeExecutionQuality,
  TradeMarket,
  TradeMistakeType,
  TradeOptionRight,
  TradeOptionStructure,
  TradeOutcome,
  TradePlanClarity,
  TradePremiumType,
  TradeSide,
} from "../types"

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

export const TRADE_PLAN_CLARITY_OPTIONS: Array<{ label: string; value: TradePlanClarity }> = [
  { value: "clear", label: "计划清晰" },
  { value: "mixed", label: "计划模糊" },
  { value: "missing", label: "没有计划" },
]

export const TRADE_PLAN_CLARITY_LABELS: Record<TradePlanClarity, string> = {
  clear: "计划清晰",
  mixed: "计划模糊",
  missing: "没有计划",
}

export const TRADE_EXECUTION_QUALITY_OPTIONS: Array<{
  label: string
  value: TradeExecutionQuality
}> = [
  { value: "disciplined", label: "按计划执行" },
  { value: "drifted", label: "有轻微偏离" },
  { value: "broken", label: "明显失控" },
]

export const TRADE_EXECUTION_QUALITY_LABELS: Record<TradeExecutionQuality, string> = {
  disciplined: "按计划执行",
  drifted: "有轻微偏离",
  broken: "明显失控",
}

export const TRADE_MISTAKE_OPTIONS: Array<{ label: string; value: TradeMistakeType }> = [
  { value: "chasing", label: "追高 / 追空" },
  { value: "early_exit", label: "过早止盈" },
  { value: "holding_loser", label: "扛单放大亏损" },
  { value: "oversized", label: "仓位过大" },
  { value: "no_edge", label: "不该做的时候做" },
  { value: "unplanned", label: "计划外交易" },
]

export const TRADE_MISTAKE_LABELS: Record<TradeMistakeType, string> = {
  chasing: "追高 / 追空",
  early_exit: "过早止盈",
  holding_loser: "扛单放大亏损",
  oversized: "仓位过大",
  no_edge: "不该做的时候做",
  unplanned: "计划外交易",
}

export const TRADE_OPTION_RIGHT_OPTIONS: Array<{ label: string; value: TradeOptionRight }> = [
  { value: "call", label: "Call" },
  { value: "put", label: "Put" },
]

export const TRADE_OPTION_RIGHT_LABELS: Record<TradeOptionRight, string> = {
  call: "Call",
  put: "Put",
}

export const TRADE_OPTION_STRUCTURE_OPTIONS: Array<{
  label: string
  value: TradeOptionStructure
}> = [
  { value: "single", label: "单腿" },
  { value: "vertical_spread", label: "价差" },
  { value: "iron_condor", label: "铁鹰" },
  { value: "straddle", label: "跨式" },
  { value: "strangle", label: "宽跨式" },
  { value: "other", label: "其他" },
]

export const TRADE_OPTION_STRUCTURE_LABELS: Record<TradeOptionStructure, string> = {
  single: "单腿",
  vertical_spread: "价差",
  iron_condor: "铁鹰",
  straddle: "跨式",
  strangle: "宽跨式",
  other: "其他",
}

export const TRADE_PREMIUM_TYPE_OPTIONS: Array<{ label: string; value: TradePremiumType }> = [
  { value: "debit", label: "借记" },
  { value: "credit", label: "贷记" },
]

export const TRADE_PREMIUM_TYPE_LABELS: Record<TradePremiumType, string> = {
  debit: "借记",
  credit: "贷记",
}
