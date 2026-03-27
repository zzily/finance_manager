import { useMemo } from "react"

import type { DashboardAlert } from "../components/dashboard/DashboardAlertsSection"
import { currency } from "../lib/formatters"
import type { Transaction } from "../types"

function getRemainingDebt(transaction: Transaction) {
  return transaction.amount_out - transaction.amount_reimbursed
}

function getAgeDays(createdAt: string) {
  const created = new Date(createdAt)
  const diff = Date.now() - created.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function useDashboardAlerts({
  availableBalance,
  netSavings,
  personalSpending,
  unsettledTransactions,
}: {
  availableBalance: number
  netSavings: number
  personalSpending: number
  unsettledTransactions: Transaction[]
}) {
  return useMemo<DashboardAlert[]>(() => {
    const alerts: DashboardAlert[] = []
    const totalOutstanding = unsettledTransactions.reduce(
      (sum, transaction) => sum + getRemainingDebt(transaction),
      0,
    )
    const agedTransactions = unsettledTransactions.filter(
      (transaction) => getAgeDays(transaction.created_at) >= 14,
    )

    if (unsettledTransactions.length > 0) {
      alerts.push({
        id: "pending-transactions",
        title: `${unsettledTransactions.length} 笔账单还在待核销`,
        description: `当前仍有 ${currency.format(totalOutstanding)} 待结金额，适合先在账单中心统一梳理。`,
        tone: "warning",
        actionLabel: "去账单中心",
        view: "transactions",
      })
    }

    if (availableBalance > 0 && totalOutstanding > 0) {
      alerts.push({
        id: "ready-to-settle",
        title: "资金池里已有可分配回款",
        description: `当前可分配 ${currency.format(availableBalance)}，可以直接进入核销工作台做快速处理。`,
        tone: "info",
        actionLabel: "去核销工作台",
        view: "workbench",
      })
    }

    if (agedTransactions.length > 0) {
      alerts.push({
        id: "aged-transactions",
        title: `${agedTransactions.length} 笔账单已挂账超过 14 天`,
        description: "建议优先处理时间较久的待核销记录，避免后续对账成本继续上升。",
        tone: "warning",
        actionLabel: "查看待处理账单",
        view: "transactions",
      })
    }

    if (netSavings > 0 && personalSpending > 0) {
      alerts.push({
        id: "review-ready",
        title: "这期账本已经有复盘素材",
        description: `目前净结余为 ${currency.format(netSavings)}，可以去复盘页查看收支趋势和支出结构。`,
        tone: "success",
        actionLabel: "去复盘洞察",
        view: "review",
      })
    }

    return alerts.slice(0, 4)
  }, [availableBalance, netSavings, personalSpending, unsettledTransactions])
}
