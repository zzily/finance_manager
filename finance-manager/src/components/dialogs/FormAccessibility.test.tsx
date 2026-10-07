import { render, screen, within, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { TradeRecordDialog } from "./TradeRecordDialog"
import { EditTransactionDialog } from "./EditTransactionDialog"
import { EditSalaryLogDialog } from "./EditSalaryLogDialog"
import { TRADE_MISTAKE_OPTIONS } from "../../lib/tradeOptions"
import type { SalaryLog, Transaction } from "../../types"

function expectLinkedError(control: HTMLElement, message: string) {
  expect(control).toHaveAttribute("aria-invalid", "true")
  expect(control).toHaveAccessibleDescription(expect.stringContaining(message))
  expect(control.closest('[data-slot="field"]')).toHaveAttribute(
    "data-invalid",
    "true",
  )
}

describe("accessible editing forms", () => {
  it("links trade errors to fields and submits the corrected quick entry with Enter", async () => {
    const user = userEvent.setup(),
      onSubmit = vi.fn()
    render(
      <TradeRecordDialog
        open
        record={null}
        isPending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )
    await user.click(screen.getByRole("button", { name: "确认新增" }))
    const symbol = screen.getByRole("textbox", { name: "标的" })
    expectLinkedError(symbol, "请输入标的名称或代码")
    expectLinkedError(
      screen.getByRole("spinbutton", { name: "盈亏（人民币）" }),
      "交易盈亏需要是有效数字",
    )
    await user.type(symbol, "SPY")
    await user.type(
      screen.getByRole("spinbutton", { name: "盈亏（人民币）" }),
      "-50",
    )
    await user.type(
      screen.getByRole("spinbutton", { name: "手续费（可选）" }),
      "-1",
    )
    expectLinkedError(
      screen.getByRole("spinbutton", { name: "手续费（可选）" }),
      "手续费不能为负数",
    )
    expect(onSubmit).not.toHaveBeenCalled()
    await user.clear(screen.getByRole("spinbutton", { name: "手续费（可选）" }))
    await user.type(symbol, "{Enter}")
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: "SPY", pnl: -50, fees: null }),
    )
  })

  it("announces multiple mistake selections and saves only the active tags", async () => {
    const user = userEvent.setup(),
      onSubmit = vi.fn()
    render(
      <TradeRecordDialog
        open
        record={null}
        isPending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )
    await user.click(screen.getByRole("radio", { name: "详细复盘" }))
    const tags = within(screen.getByRole("toolbar", { name: "错误类型" }))
    const [first, second] = TRADE_MISTAKE_OPTIONS
    const firstButton = tags.getByRole("button", { name: first.label })
    const secondButton = tags.getByRole("button", { name: second.label })
    await user.click(firstButton)
    await user.click(secondButton)
    expect(firstButton).toHaveAttribute("aria-pressed", "true")
    expect(secondButton).toHaveAttribute("aria-pressed", "true")
    await user.click(firstButton)
    expect(firstButton).toHaveAttribute("aria-pressed", "false")
    await user.type(screen.getByRole("textbox", { name: "标的" }), "SPY")
    await user.type(screen.getByRole("spinbutton", { name: "交易盈亏" }), "10")
    await user.click(screen.getByRole("button", { name: "确认新增" }))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ mistake_tags: [second.value] }),
    )
  })

  it("rejects an edited bill below its settled amount and submits valid changes", async () => {
    const user = userEvent.setup(),
      onSubmit = vi.fn()
    const transaction: Transaction = {
      id: 1,
      title: "账单",
      amount_out: 100,
      amount_reimbursed: 40,
      category: "work",
      status: "partially_settled",
      created_at: "2025-01-01T00:00:00Z",
    }
    render(
      <EditTransactionDialog
        open
        transaction={transaction}
        isPending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )
    const amount = screen.getByRole("spinbutton", { name: "金额（人民币）" })
    await user.clear(amount)
    await user.type(amount, "30{Enter}")
    expectLinkedError(amount, "金额不能低于已核销金额")
    expect(onSubmit).not.toHaveBeenCalled()
    await user.clear(amount)
    await user.type(amount, "60{Enter}")
    expect(onSubmit).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ amount_out: 60 }),
    )
  })

  it("associates a cleared salary month error with the picker trigger", async () => {
    const user = userEvent.setup(),
      onSubmit = vi.fn()
    const log: SalaryLog = {
      id: 1,
      amount: 100,
      amount_unused: 50,
      month: "2025-01",
      source: "salary",
      remark: "",
      received_date: "2025-01-15T12:00:00Z",
    }
    render(
      <EditSalaryLogDialog
        open
        salaryLog={log}
        isPending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )
    await user.click(screen.getByRole("button", { name: "清除月份" }))
    await user.click(screen.getByRole("button", { name: "保存修改" }))
    expectLinkedError(screen.getByLabelText("归属月份"), "请选择归属月份")
    expect(onSubmit).not.toHaveBeenCalled()
  })
  it("allows keyboard selection inside the modal and restores focus to Select", async () => {
    const user = userEvent.setup(),
      onSubmit = vi.fn()
    const log: SalaryLog = {
      id: 1,
      amount: 100,
      amount_unused: 100,
      month: "2025-01",
      source: "salary",
      remark: "",
      received_date: "2025-01-15T12:00:00Z",
    }
    render(
      <EditSalaryLogDialog
        open
        salaryLog={log}
        isPending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )
    const source = screen.getByRole("combobox", { name: "来源" })
    await waitFor(() =>
      expect(screen.getByRole("spinbutton", { name: "金额" })).toHaveFocus(),
    )
    await user.tab()
    expect(source).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    await waitFor(() =>
      expect(screen.getByRole("option", { name: "工资" })).toHaveFocus(),
    )
    await user.keyboard("{ArrowDown}{Enter}")
    await waitFor(() => expect(source).toHaveFocus())
    await user.click(screen.getByRole("button", { name: "保存修改" }))
    expect(onSubmit).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ source: "reimbursement" }),
    )
  })
})
