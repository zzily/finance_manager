import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "../lib/api"
import { createQueryClientWrapper } from "../test/queryClient"
import { useBackendCapabilities } from "./useBackendCapabilities"
afterEach(() => vi.restoreAllMocks())
describe("backend capability compatibility", () => {
  it("retains legacy workflows when the backend has no capability route", async () => {
    vi.spyOn(api, "get").mockRejectedValue({ isAxiosError: true, response: { status: 404 } })
    const { result } = renderHook(useBackendCapabilities, { wrapper: createQueryClientWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Object.values(result.current.capabilities).every(v => v === false)).toBe(true)
  })
  it("enables only capabilities reported by the selected backend", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: { code: 200, data: { transactionOccurrenceDate: true, expenseCategories: true, immediatePayment: true, backups: true, restore: false } } })
    const { result } = renderHook(useBackendCapabilities, { wrapper: createQueryClientWrapper() })
    await waitFor(() => expect(result.current.capabilities.expenseCategories).toBe(true))
    expect(result.current.capabilities.restore).toBe(false)
  })
})
