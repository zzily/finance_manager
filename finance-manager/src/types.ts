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

export type TradeRecord = {
  id: number
  symbol: string
  market: TradeMarket
  side: TradeSide
  traded_at: string
  pnl: number
  setup?: string
  note?: string | null
  created_at: string
}

export type TradeRecordInput = Omit<TradeRecord, "id" | "created_at">

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
