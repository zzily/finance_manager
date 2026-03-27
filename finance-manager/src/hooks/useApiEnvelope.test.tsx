import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "../lib/api"
import type { SalaryLog, Transaction } from "../types"
import { createQueryClientWrapper } from "../test/queryClient"
import { useSalaryLogs } from "./useSalaryLogs"
import { useTransactions } from "./useTransactions"

const transactionsPayload: Transaction[] = [
  {
    id: 1,
    title: "Envelope pending",
    amount_out: 90,
    amount_reimbursed: 0,
    category: "work",
    status: "pending",
    created_at: "2026-03-27T00:00:00Z",
  },
  {
    id: 2,
    title: "Envelope settled",
    amount_out: 40,
    amount_reimbursed: 40,
    category: "personal",
    status: "settled",
    created_at: "2026-03-26T00:00:00Z",
  },
]

const salaryPayload: SalaryLog[] = [
  {
    id: 10,
    amount: 1000,
    amount_unused: 600,
    month: "2026-03",
    source: "salary",
    remark: "main",
    received_date: "2026-03-05T00:00:00Z",
  },
  {
    id: 11,
    amount: 300,
    amount_unused: 0,
    month: "2026-03",
    source: "reimbursement",
    remark: "used",
    received_date: "2026-03-06T00:00:00Z",
  },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("API envelope hooks", () => {
  it("unwraps transactions from the common API envelope", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValue({
      data: {
        code: 200,
        message: "ok",
        data: transactionsPayload,
      },
    } as never)

    const { result } = renderHook(() => useTransactions(), {
      wrapper: createQueryClientWrapper(),
    })

    await waitFor(() => {
      expect(result.current.all).toHaveLength(2)
    })

    expect(getSpy).toHaveBeenCalledWith("/transactions/")
    expect(result.current.all).toEqual(transactionsPayload)
    expect(result.current.unsettled).toEqual([transactionsPayload[0]])
  })

  it("unwraps salary logs from the common API envelope across both queries", async () => {
    const getSpy = vi.spyOn(api, "get").mockImplementation((url, config) => {
      if (url === "/salary_logs/" && config?.params?.available_only) {
        return Promise.resolve({
          data: {
            code: 200,
            message: "ok",
            data: salaryPayload,
          },
        } as never)
      }

      return Promise.resolve({
        data: {
          code: 200,
          message: "ok",
          data: salaryPayload,
        },
      } as never)
    })

    const { result } = renderHook(() => useSalaryLogs(), {
      wrapper: createQueryClientWrapper(),
    })

    await waitFor(() => {
      expect(result.current.allLogs).toHaveLength(2)
      expect(result.current.available).toHaveLength(1)
    })

    expect(getSpy).toHaveBeenCalledWith("/salary_logs/", { params: { available_only: true } })
    expect(getSpy).toHaveBeenCalledWith("/salary_logs/")
    expect(result.current.allLogs).toEqual(salaryPayload)
    expect(result.current.available).toEqual([salaryPayload[0]])
  })
})
