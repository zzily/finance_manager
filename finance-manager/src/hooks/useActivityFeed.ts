import { useMemo } from "react"

import type { ActivityItem } from "../components/dashboard/RecentActivityFeed"
import type { SalaryLog, Transaction } from "../types"

export function useActivityFeed({
  salaryLogs,
  transactions,
}: {
  salaryLogs: SalaryLog[]
  transactions: Transaction[]
}) {
  return useMemo<ActivityItem[]>(() => {
    const transactionItems: ActivityItem[] = transactions.map((transaction) => ({
      id: `transaction-${transaction.id}`,
      kind: "transaction",
      title: transaction.title,
      meta: transaction.category === "work" ? "新增工作垫付" : "新增个人支出",
      amount: transaction.amount_out,
      date: transaction.created_at,
    }))

    const salaryItems: ActivityItem[] = salaryLogs.map((salaryLog) => ({
      id: `salary-${salaryLog.id}`,
      kind: "salary",
      title: salaryLog.remark?.trim() || `${salaryLog.month} 回款记录`,
      meta: `${{ salary: "工资", reimbursement: "报销", other: "其他收入" }[salaryLog.source]} · ${salaryLog.month}`,
      amount: salaryLog.amount,
      date: salaryLog.received_date,
    }))

    return [...transactionItems, ...salaryItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6)
  }, [salaryLogs, transactions])
}
