import { useMemo, useState } from "react"

import { readLocation, transactionDate } from "../lib/navigation"
import type { Transaction, TransactionStatus } from "../types"

export type TransactionSort = "amount_asc" | "amount_desc" | "debt_desc" | "latest" | "oldest"

export type TransactionFilterState = {
  expenseCategoryId?: string
  category: Transaction["category"] | "all"
  month: string
  query: string
  sort: TransactionSort
  status: TransactionStatus | "all" | "open"
}

function getRemainingDebt(transaction: Transaction) {
  return transaction.amount_out - transaction.amount_reimbursed
}

export function useTransactionFilters(transactions: Transaction[], persist = false) {
  const initial = persist ? readLocation().params : new URLSearchParams()
  const [query, setQuery] = useState(initial.get("query") || "")
  const [status, setStatus] = useState<TransactionFilterState["status"]>(() => {
    const value = initial.get("status")
    return ["all", "open", "pending", "partially_settled", "settled"].includes(value || "")
      ? (value as TransactionFilterState["status"])
      : "all"
  })
  const [category, setCategory] = useState<TransactionFilterState["category"]>(() =>
    initial.get("category") === "work"
      ? "work"
      : initial.get("category") === "personal"
        ? "personal"
        : "all",
  )
  const [expenseCategoryId, setExpenseCategoryId] = useState(initial.get("expenseCategoryId") || "all")
  const [month, setMonth] = useState(initial.get("month") || "all")
  const [sort, setSort] = useState<TransactionSort>(() =>
    ["latest", "oldest", "amount_asc", "amount_desc", "debt_desc"].includes(
      initial.get("sort") || "",
    )
      ? (initial.get("sort") as TransactionSort)
      : "latest",
  )

  const [now] = useState(() => Date.now())
  const [minAge, setMinAge] = useState(persist ? Math.max(0, Number(initial.get("minAge")) || 0) : 0)

  const availableMonths = useMemo(
    () =>
      Array.from(
        new Set(transactions.map((transaction) => transactionDate(transaction).slice(0, 7))),
      ).sort((left, right) => right.localeCompare(left)),
    [transactions],
  )

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const result = transactions.filter((transaction) => {
      if (minAge && now - new Date(transactionDate(transaction)).getTime() < minAge * 86_400_000)
        return false
      if (normalizedQuery && !transaction.title.toLowerCase().includes(normalizedQuery)) {
        return false
      }
      if (status === "open" && transaction.status === "settled") return false
      if (status !== "all" && status !== "open" && transaction.status !== status) {
        return false
      }
      if (category !== "all" && transaction.category !== category) {
        return false
      }
      if (expenseCategoryId !== "all" && String(transaction.expense_category_id ?? "uncategorized") !== expenseCategoryId) return false
      if (month !== "all" && !transactionDate(transaction).startsWith(month)) {
        return false
      }
      return true
    })

    result.sort((left, right) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(transactionDate(left)).getTime() - new Date(transactionDate(right)).getTime()
          )
        case "amount_desc":
          return right.amount_out - left.amount_out
        case "amount_asc":
          return left.amount_out - right.amount_out
        case "debt_desc":
          return getRemainingDebt(right) - getRemainingDebt(left)
        case "latest":
        default:
          return (
            new Date(transactionDate(right)).getTime() - new Date(transactionDate(left)).getTime()
          )
      }
    })

    return result
  }, [category, expenseCategoryId, month, query, sort, status, transactions, minAge, now])

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
    expenseCategoryId !== "all" ||
    minAge > 0 ||
    query.trim().length > 0 ||
    status !== "all" ||
    category !== "all" ||
    month !== "all"

  function resetFilters() {
    setExpenseCategoryId("all")
    setMinAge(0)
    setQuery("")
    setStatus("all")
    setCategory("all")
    setMonth("all")
    setSort("latest")
  }

  function update<T>(key: string, setter: (value: T) => void, value: T) {
    setter(value)
    if (!persist) return
    const { view, params } = readLocation()
    params.set(key, String(value))
    window.history.replaceState(null, "", `#${view}?${params}`)
  }

  return {
    availableExpenseCategories: Array.from(new Map(transactions.filter(t => t.expense_category_id).map(t => [String(t.expense_category_id), t.expense_category_name ?? "未命名分类"]))),
    setExpenseCategoryId: (value: string) => update("expenseCategoryId", setExpenseCategoryId, value),
    availableMonths,
    filteredTransactions,
    hasActiveFilters,
    resetFilters: () => {
      resetFilters()
      if (persist) window.history.replaceState(null, "", "#transactions")
    },
    setCategory: (value: TransactionFilterState["category"]) =>
      update("category", setCategory, value),
    setMonth: (value: string) => update("month", setMonth, value),
    setQuery: (value: string) => update("query", setQuery, value),
    setSort: (value: TransactionSort) => update("sort", setSort, value),
    setStatus: (value: TransactionFilterState["status"]) => update("status", setStatus, value),
    state: {
      expenseCategoryId,
      category,
      month,
      query,
      sort,
      status,
    } satisfies TransactionFilterState,
    totals,
  }
}
