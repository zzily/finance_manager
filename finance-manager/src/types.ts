export type TransactionStatus = "pending" | "partially_settled" | "settled"

export type Transaction = {
  id: number
  title: string
  amount_out: number
  amount_reimbursed: number
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

export type SettleRequest = {
  transaction_id: number
  salary_log_id: number
  amount: number
}
