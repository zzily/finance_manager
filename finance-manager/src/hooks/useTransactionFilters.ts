import { useMemo, useState } from "react"

import type { Transaction, TransactionStatus } from "../types"

export type TransactionSort =
  | "amount_asc"
  | "amount_desc"
  | "debt_desc"
  | "latest"
  | "oldest"

export type TransactionFilterState = {
  category: Transaction["category"] | "all"
  month: string
  query: string
  sort: TransactionSort
  status: TransactionStatus | "all"
}

function getRemainingDebt(transaction: Transaction) {
  return transaction.amount_out - transaction.amount_reimbursed
}

export function useTransactionFilters(transactions: Transaction[]) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<TransactionFilterState["status"]>("all")
  const [category, setCategory] = useState<TransactionFilterState["category"]>("all")
  const [month, setMonth] = useState("all")
  const [sort, setSort] = useState<TransactionSort>("latest")

  const availableMonths = useMemo(
    () =>
      Array.from(new Set(transactions.map((transaction) => transaction.created_at.slice(0, 7)))).sort(
        (left, right) => right.localeCompare(left),
      ),
    [transactions],
  )

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const result = transactions.filter((transaction) => {
      if (normalizedQuery && !transaction.title.toLowerCase().includes(normalizedQuery)) {
        return false
      }
      if (status !== "all" && transaction.status !== status) {
        return false
      }
      if (category !== "all" && transaction.category !== category) {
        return false
      }
      if (month !== "all" && !transaction.created_at.startsWith(month)) {
        return false
      }
      return true
    })

    result.sort((left, right) => {
      switch (sort) {
        case "oldest":
          return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
        case "amount_desc":
          return right.amount_out - left.amount_out
        case "amount_asc":
          return left.amount_out - right.amount_out
        case "debt_desc":
          return getRemainingDebt(right) - getRemainingDebt(left)
        case "latest":
        default:
          return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      }
    })

    return result
  }, [category, month, query, sort, status, transactions])

  const totals = useMemo(
    () => ({
      amount: filteredTransactions.reduce((sum, transaction) => sum + transaction.amount_out, 0),
      outstanding: filteredTransactions.reduce(
        (sum, transaction) => sum + getRemainingDebt(transaction),
        0,
      ),
    }),
    [filteredTransactions],
  )

  const hasActiveFilters =
    query.trim().length > 0 || status !== "all" || category !== "all" || month !== "all"

  function resetFilters() {
    setQuery("")
    setStatus("all")
    setCategory("all")
    setMonth("all")
    setSort("latest")
  }

  return {
    availableMonths,
    filteredTransactions,
    hasActiveFilters,
    resetFilters,
    setCategory,
    setMonth,
    setQuery,
    setSort,
    setStatus,
    state: {
      category,
      month,
      query,
      sort,
      status,
    } satisfies TransactionFilterState,
    totals,
  }
}
