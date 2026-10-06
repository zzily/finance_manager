import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "./api"
import { fetchAllPages } from "./pagination"
afterEach(() => vi.restoreAllMocks())
describe("complete ledger pagination", () => {
  it("reads beyond 100 records and pins every page to one source", async () => {
    const rows = Array.from({ length: 201 }, (_, i) => ({ id: i + 1 }))
    const get = vi.spyOn(api, "get").mockImplementation(async (_path, config) => ({ data: { code: 200, data: rows.slice(config?.params.skip, config?.params.skip + 100) } }))
    expect(await fetchAllPages("/transactions/", "local")).toHaveLength(201)
    expect(get).toHaveBeenCalledTimes(3)
    expect(get.mock.calls.every(([, config]) => config?.baseURL === "http://localhost:8000")).toBe(true)
  })
  it("rejects an incomplete export when the server ignores pagination", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: { code: 200, data: Array.from({ length: 100 }, (_, id) => ({ id })) } })
    await expect(fetchAllPages("/transactions/", "local")).rejects.toThrow("分页读取未完成")
  })
})
