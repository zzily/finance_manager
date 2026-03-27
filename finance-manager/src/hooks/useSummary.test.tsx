import { renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { api } from "../lib/api"
import { createQueryClientWrapper } from "../test/queryClient"
import { useSummary } from "./useSummary"

describe("useSummary", () => {
  it("passes the selected month to the summary endpoint and maps the response", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValue({
      data: {
        code: 200,
        message: "ok",
        data: {
          chart_data: {
            monthly_timeline: [{ month: "2026-03", income_salary: 200, income_reimbursement: 30, spending_work: 100, spending_personal: 20 }],
            category_breakdown: [{ name: "工作垫付", value: 100 }],
          },
          financial_status: {
            description: "summary",
            business_loop: {
              total_lent: 100,
              total_reimbursed: 30,
              current_debt: 70,
              status: "等待报销",
            },
            family_loop: {
              gross_income: 200,
              personal_spending: 20,
              net_savings: 180,
              status: "资产增值中",
            },
            total_assets: 350,
          },
          operational_status: {
            description: "ops",
            bills_pending_settlement: 120,
            cash_waiting_allocation: 230,
            action_needed: "有闲钱，快去销账",
          },
        },
      },
    } as never)

    const { result } = renderHook(() => useSummary("2026-03"), {
      wrapper: createQueryClientWrapper(),
    })

    await waitFor(() => {
      expect(result.current.totalAssets).toBe(350)
    })

    expect(getSpy).toHaveBeenCalledWith("/summary", { params: { month: "2026-03" } })
    expect(result.current.availableBalance).toBe(230)
    expect(result.current.businessDebt).toBe(70)
    expect(result.current.netSavings).toBe(180)
    expect(result.current.chartData?.monthly_timeline).toHaveLength(1)
  })
})
