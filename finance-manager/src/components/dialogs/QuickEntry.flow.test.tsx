import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { TradeRecordDialog } from "./TradeRecordDialog"
import { TransactionDialog } from "./TransactionDialog"

describe("quick entry", () => {
  it("creates a trade from core fields and keeps optional details empty", () => {
    const onSubmit = vi.fn()
    render(
      <TradeRecordDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        record={null}
        isPending={false}
      />,
    )
    fireEvent.change(screen.getByLabelText("标的"), {
      target: { value: " spy " },
    })
    fireEvent.change(screen.getByLabelText("盈亏（人民币）"), {
      target: { value: "-100" },
    })
    fireEvent.change(screen.getByLabelText("手续费（可选）"), {
      target: { value: "5" },
    })
    expect(screen.queryByLabelText("入场价")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "确认新增" }))
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      symbol: "spy",
      pnl: -100,
      fees: 5,
      market: "stock",
      side: "long",
      entry_price: null,
      mistake_tags: [],
    })
  })
  it("keeps validation errors visible in quick entry", () => {
    const onSubmit = vi.fn()
    render(
      <TradeRecordDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        record={null}
        isPending={false}
      />,
    )
    fireEvent.click(screen.getByRole("button", { name: "确认新增" }))
    expect(
      screen
        .getAllByRole("alert")
        .some((alert) => alert.textContent === "请输入标的名称或代码"),
    ).toBe(true)
    expect(onSubmit).not.toHaveBeenCalled()
  })
  it("does not submit an invalid bill amount", () => {
    const onSubmit = vi.fn()
    render(
      <TransactionDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
        isPending={false}
      />,
    )
    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "房租" },
    })
    fireEvent.change(screen.getByLabelText("金额（人民币）"), {
      target: { value: "1.001" },
    })
    fireEvent.submit(
      screen.getByRole("button", { name: "确认录入" }).closest("form")!,
    )
    expect(screen.getByRole("alert")).toHaveTextContent("金额最多保留两位小数")
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
