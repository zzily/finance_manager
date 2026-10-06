import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { api, apiBaseUrl, getCurrentApiIndex, setApiEndpoint, unwrapResponseData } from "./api"
import { buildHash, readLocation, transactionDate } from "./navigation"
import { csvCell } from "./export"
import { loadTemplates, markTemplateRecorded, parseTemplates, rememberTemplate } from "./templates"
import { useTransactions } from "../hooks/useTransactions"
import { useTransactionFilters } from "../hooks/useTransactionFilters"
import { createQueryClientWrapper } from "../test/queryClient"
import type { Transaction } from "../types"

const rows: Transaction[] = [
  {
    id: 1,
    title: "房租",
    category: "personal",
    amount_out: 3000,
    amount_reimbursed: 0,
    status: "pending",
    created_at: "2026-10-05",
    occurred_at: "2026-09-30",
  },
  {
    id: 2,
    title: "采购",
    category: "personal",
    amount_out: 50,
    amount_reimbursed: 50,
    status: "settled",
    created_at: "2026-10-01",
  },
]
afterEach(() => {
  vi.restoreAllMocks()
  setApiEndpoint(0)
  localStorage.clear()
  window.history.replaceState(null, "", "#dashboard")
})
describe("financial workflow regressions", () => {
  it("keeps a requested bill and month in navigation", () => {
    expect(
      readLocation(buildHash("workbench", { transactionId: 2 })).params.get("transactionId"),
    ).toBe("2")
    expect(
      readLocation(buildHash("transactions", { month: "2026-09", query: "房租" })).params.get(
        "query",
      ),
    ).toBe("房租")
    expect(transactionDate(rows[0])).toBe("2026-09-30")
  })
  it("shows settled records and restores a month filter", () => {
    window.history.replaceState(null, "", "#transactions?status=settled&month=2026-10")
    const { result } = renderHook(() => useTransactionFilters(rows, true))
    expect(result.current.filteredTransactions.map((t) => t.id)).toEqual([2])
    act(() => result.current.setQuery("采购"))
    expect(readLocation().params.get("query")).toBe("采购")
    act(() => result.current.resetFilters())
    expect(result.current.filteredTransactions).toHaveLength(2)
    expect(window.location.hash).toBe("#transactions")
  })
  it("uses occurrence date for the month when the backend returns it", () => {
    const { result } = renderHook(() => useTransactionFilters(rows))
    act(() => result.current.setMonth("2026-09"))
    expect(result.current.filteredTransactions.map((t) => t.id)).toEqual([1])
  })
  it("clears age filters with the remaining filters", () => {
    window.history.replaceState(null, "", "#transactions?minAge=9999&status=open")
    const { result } = renderHook(() => useTransactionFilters(rows, true))
    expect(result.current.filteredTransactions).toEqual([])
    act(() => result.current.resetFilters())
    expect(result.current.filteredTransactions).toHaveLength(2)
  })
  it("rejects an error envelope returned with HTTP 200", async () => {
    const get = vi
      .spyOn(api, "get")
      .mockResolvedValue({ data: { code: 503, message: "数据暂不可用", data: null } })
    await expect(unwrapResponseData(api.get("/summary"))).rejects.toThrow("数据暂不可用")
    expect(get).toHaveBeenCalledOnce()
  })
  it("does not replay a timed-out write on another ledger", async () => {
    const hosts: string[] = []
    await expect(
      api.post(
        "/settle",
        {},
        {
          adapter: async (config) => {
            hosts.push(config.baseURL!)
            throw new Error("timeout")
          },
        },
      ),
    ).rejects.toThrow("timeout")
    expect(hosts).toEqual([apiBaseUrl("remote")])
    expect(getCurrentApiIndex()).toBe(0)
  })
  it("separates local and online query results", async () => {
    vi.spyOn(api, "get").mockImplementation(async (_, config) => ({
      data: {
        code: 200,
        message: "ok",
        data: config?.baseURL === apiBaseUrl("remote") ? [rows[0]] : [rows[1]],
      },
    }))
    const { result } = renderHook(() => useTransactions(), { wrapper: createQueryClientWrapper() })
    await waitFor(() => expect(result.current.all[0]?.id).toBe(1))
    act(() => setApiEndpoint(1))
    await waitFor(() => expect(result.current.all[0]?.id).toBe(2))
    act(() => setApiEndpoint(0))
    await waitFor(() => expect(result.current.all[0]?.id).toBe(1))
  })
  it("quotes CSV titles and prevents formulas without altering numbers", () => {
    expect(csvCell("=SUM(A1:A2)")).toBe('"\'=SUM(A1:A2)"')
    expect(csvCell('标题"换行\n第二行')).toBe('"标题""换行\n第二行"')
    expect(csvCell(-100)).toBe('"-100"')
  })
  it("records monthly template completion only after a successful create", () => {
    const template = {
      title: "房租",
      amount_out: 3000,
      category: "personal" as const,
      repeatMonthly: true,
    }
    rememberTemplate(template)
    expect(loadTemplates()[0].lastRecordedMonth).toBeUndefined()
    markTemplateRecorded({ ...template, category: "work" })
    expect(loadTemplates()[0].lastRecordedMonth).toBeUndefined()
    markTemplateRecorded({ ...template, amount_out: 3100 })
    expect(loadTemplates()[0].lastRecordedMonth).toMatch(/^\d{4}-\d{2}$/)
    setApiEndpoint(1)
    expect(loadTemplates()).toEqual([])
  })
  it("validates imported templates", () => {
    expect(() => parseTemplates([{ title: "", amount_out: 0, category: "personal" }])).toThrow()
    expect(() => parseTemplates({ title: "房租" })).toThrow()
    expect(
      parseTemplates([{ title: " 房租 ", amount_out: 100, category: "personal", id: 10 }])[0],
    ).toEqual({ title: "房租", amount_out: 100, category: "personal", repeatMonthly: false })
  })
})

it("uses the expense month when completing a backdated monthly template", () => {
  const template = { title: "补录月费", amount_out: 100, category: "personal" as const, repeatMonthly: true }
  rememberTemplate(template)
  markTemplateRecorded({ ...template, occurred_at: "2026-09-30" })
  expect(loadTemplates().find(t => t.title === template.title)?.lastRecordedMonth).toBe("2026-09")
})
