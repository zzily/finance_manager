export type TransactionStatus = "pending" | "partially_settled" | "settled"

export type Transaction = {
  id: number
  title: string
  amount_out: number
  amount_reimbursed: number
  category: "work" | "personal"
  status: TransactionStatus
  created_at: string
}

export type SalaryLog = {
  id: number
  amount: number
  amount_unused: number
  month: string
  source: "salary" | "reimbursement" | "other"
  remark?: string | null
  received_date: string
}

export type TransactionCreate = {
  title: string
  amount_out: number
  category: "work" | "personal"
}

export type TransactionUpdate = {
  title: string
  amount_out: number
  category: "work" | "personal"
}

export type SalaryLogCreate = {
  amount: number
  month: string
  source: "salary" | "reimbursement" | "other"
  remark?: string | null
  received_date?: string | null
}

export type SalaryLogUpdate = {
  amount: number
  source: "salary" | "reimbursement" | "other"
  month: string
  remark?: string | null
  received_date?: string | null
}

export type TradeSide = "long" | "short"

export type TradeMarket = "stock" | "crypto" | "futures" | "forex" | "options" | "other"

export type TradeOutcome = "win" | "loss" | "flat"

export type TradePlanClarity = "clear" | "mixed" | "missing"

export type TradeExecutionQuality = "disciplined" | "drifted" | "broken"

export type TradeMistakeType =
  | "chasing"
  | "early_exit"
  | "holding_loser"
  | "oversized"
  | "no_edge"
  | "unplanned"

export type TradeOptionRight = "call" | "put"

export type TradeOptionStructure =
  | "single"
  | "vertical_spread"
  | "iron_condor"
  | "straddle"
  | "strangle"
  | "other"

export type TradePremiumType = "debit" | "credit"

export type TradeRecordBase = {
  symbol: string
  market: TradeMarket
  side: TradeSide
  traded_at: string
  pnl: number
  setup?: string
  note?: string | null
}

export type TradeRecordMeta = {
  entry_at?: string | null
  exit_at?: string | null
  entry_price?: number | null
  exit_price?: number | null
  position_size?: number | null
  thesis?: string | null
  planned_stop?: number | null
  planned_target?: number | null
  actual_stop?: number | null
  actual_target?: number | null
  fees?: number | null
  slippage?: number | null
  followed_plan?: boolean | null
  plan_clarity?: TradePlanClarity | null
  execution_quality?: TradeExecutionQuality | null
  mistake_tags: TradeMistakeType[]
  lesson?: string | null
  option_expiration?: string | null
  option_strike?: number | null
  option_right?: TradeOptionRight | null
  option_structure?: TradeOptionStructure | null
  option_premium_type?: TradePremiumType | null
  option_max_risk?: number | null
  option_max_reward?: number | null
  option_delta?: number | null
}

export type TradeRecordApi = TradeRecordBase & {
  id: number
  created_at: string
}

export type TradeRecord = TradeRecordApi & TradeRecordMeta

export type TradeRecordInput = Omit<TradeRecord, "id" | "created_at">

export type TradeRecordApiPayload = Omit<TradeRecordBase, "created_at">

export type SettleRequest = {
  transaction_id: number
  salary_log_id: number
  amount: number
}

export type SettlementDetail = {
  id: number
  transaction_id: number
  salary_log_id: number
  amount: number
  salary_month: string
  salary_source: "salary" | "reimbursement" | "other"
  created_at: string
}

export type ApiResponse<T = unknown> = {
  code: number
  message: string
  data: T
}

export type IdPayload = {
  id: number
}

export type MonthlyData = {
  month: string
  income_salary: number
  income_reimbursement: number
  spending_work: number
  spending_personal: number
}

export type CategoryBreakdown = {
  name: string
  value: number
}

export type ChartData = {
  monthly_timeline: MonthlyData[]
  category_breakdown: CategoryBreakdown[]
}

export type SummaryData = {
  chart_data: ChartData
  financial_status: {
    description: string
    business_loop: {
      total_lent: number
      total_reimbursed: number
      current_debt: number
      status: string
    }
    family_loop: {
      gross_income: number
      personal_spending: number
      net_savings: number
      status: string
    }
    total_assets: number
  }
  operational_status: {
    description: string
    bills_pending_settlement: number
    cash_waiting_allocation: number
    action_needed: string
  }
}
