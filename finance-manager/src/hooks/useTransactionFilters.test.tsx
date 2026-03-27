import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { Transaction } from "../types"
import { useTransactionFilters } from "./useTransactionFilters"

const transactions: Transaction[] = [
  {
    id: 1,
    title: "差旅垫付",
    amount_out: 300,
    amount_reimbursed: 100,
    category: "work",
    status: "partially_settled",
    created_at: "2026-03-10T00:00:00Z",
  },
  {
    id: 2,
    title: "办公采购",
    amount_out: 120,
    amount_reimbursed: 0,
    category: "work",
    status: "pending",
    created_at: "2026-02-05T00:00:00Z",
  },
  {
    id: 3,
    title: "家庭支出",
    amount_out: 90,
    amount_reimbursed: 90,
    category: "personal",
    status: "settled",
    created_at: "2026-03-01T00:00:00Z",
  },
]

describe("useTransactionFilters", () => {
  it("filters by query, category and month, then keeps totals in sync", () => {
    const { result } = renderHook(() => useTransactionFilters(transactions))

    act(() => {
      result.current.setQuery("差旅")
      result.current.setCategory("work")
      result.current.setMonth("2026-03")
    })

    expect(result.current.availableMonths).toEqual(["2026-03", "2026-02"])
    expect(result.current.filteredTransactions.map((transaction) => transaction.id)).toEqual([1])
    expect(result.current.totals.amount).toBe(300)
    expect(result.current.totals.outstanding).toBe(200)
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it("sorts by outstanding debt and can reset filters", () => {
    const { result } = renderHook(() => useTransactionFilters(transactions))

    act(() => {
      result.current.setStatus("pending")
      result.current.setSort("debt_desc")
    })

    expect(result.current.filteredTransactions.map((transaction) => transaction.id)).toEqual([2])

    act(() => {
      result.current.resetFilters()
      result.current.setSort("debt_desc")
    })

    expect(result.current.filteredTransactions.map((transaction) => transaction.id)).toEqual([1, 2, 3])
    expect(result.current.hasActiveFilters).toBe(false)
  })
})
