import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api, setApiEndpoint } from "../lib/api"
import { createQueryClientWrapper } from "../test/queryClient"
import { SettlementWorkbenchPage } from "./SettlementWorkbenchPage"

const transactions = [
  {
    id: 1,
    title: "更早账单",
    amount_out: 800,
    amount_reimbursed: 0,
    category: "work",
    status: "pending",
    created_at: "2026-09-01",
  },
  {
    id: 2,
    title: "指定房租",
    amount_out: 300,
    amount_reimbursed: 0,
    category: "personal",
    status: "pending",
    created_at: "2026-10-01",
  },
]
const income = [
  {
    id: 11,
    source: "salary",
    amount: 100,
    amount_unused: 100,
    month: "2026-10",
    received_date: "2026-10-01",
  },
]
beforeEach(() => {
  setApiEndpoint(0)
  vi.spyOn(api, "get").mockImplementation(async (url) => ({
    data: {
      code: 200,
      message: "ok",
      data: String(url).includes("salary_logs") ? income : transactions,
    },
  }))
})
describe("settlement workflow", () => {
  it("submits the requested bill, chosen income and safe amount once", async () => {
    const post = vi
      .spyOn(api, "post")
      .mockResolvedValue({ data: { code: 200, message: "ok", data: null } })
    render(<SettlementWorkbenchPage initialTransactionId={2} onNavigate={vi.fn()} />, {
      wrapper: createQueryClientWrapper(),
    })
    await waitFor(() => expect(screen.getByLabelText("本次核销金额（人民币）")).toHaveValue(100))
    expect(screen.getByText("使用这笔收入的全部余额")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("本次核销金额（人民币）"), {
      target: { value: "75.50" },
    })
    fireEvent.click(screen.getByRole("button", { name: "确认本次核销" }))
    await waitFor(() => expect(post).toHaveBeenCalledOnce())
    expect(post).toHaveBeenCalledWith("/settle", {
      transaction_id: 2,
      salary_log_id: 11,
      amount: 75.5,
    })
  })
  it("blocks amounts above the income balance and sub-cent amounts", async () => {
    const post = vi.spyOn(api, "post")
    render(<SettlementWorkbenchPage initialTransactionId={2} onNavigate={vi.fn()} />, {
      wrapper: createQueryClientWrapper(),
    })
    await waitFor(() => expect(screen.getByLabelText("本次核销金额（人民币）")).toHaveValue(100))
    for (const value of ["300", "1.001", "-1", "0"]) {
      fireEvent.change(screen.getByLabelText("本次核销金额（人民币）"), { target: { value } })
      expect(screen.getByRole("button", { name: "确认本次核销" })).toBeDisabled()
    }
    expect(post).not.toHaveBeenCalled()
  })
  it("does not select another bill when a requested ID is missing", async () => {
    render(<SettlementWorkbenchPage initialTransactionId={99} onNavigate={vi.fn()} />, {
      wrapper: createQueryClientWrapper(),
    })
    expect(await screen.findByText("这笔账单已结清或不存在")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "确认本次核销" })).toBeDisabled()
  })
  it("does not show a settled conclusion after a loading failure", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("offline"))
    render(<SettlementWorkbenchPage onNavigate={vi.fn()} />, {
      wrapper: createQueryClientWrapper(),
    })
    expect(await screen.findByText("无法获取待处理账单")).toBeInTheDocument()
    expect(screen.queryByText("当前没有待处理账单")).not.toBeInTheDocument()
    expect(screen.queryByText(/本次最多.*0.00/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "确认本次核销" })).toBeDisabled()
  })
})
