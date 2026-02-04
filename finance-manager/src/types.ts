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
}

export type SettleRequest = {
  transaction_id: number
  salary_log_id: number
  amount: number
}

export type SummaryResponse = {
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
