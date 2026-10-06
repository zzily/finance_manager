import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { TransactionDialog } from "./TransactionDialog"
const categories = [{ id: 7, name: "餐饮", kind: "personal" as const, archived: false }]
const income = [{ id: 3, amount: 100, amount_unused: 30, month: "2026-09", source: "salary" as const, received_date: "2026-09-01" }]
beforeEach(() => localStorage.clear())
describe("household transaction entry", () => {
  it("submits the chosen occurrence date, category and one-step payment", async () => {
    const user = userEvent.setup(), submit = vi.fn()
    render(<TransactionDialog open onOpenChange={vi.fn()} isPending={false} onSubmit={submit} supportsOccurrenceDate supportsCategories categories={categories} supportsImmediatePayment availableLogs={income} />)
    await user.type(screen.getByLabelText("标题"), "晚餐")
    await user.type(screen.getByLabelText("金额（人民币）"), "20.05")
    await user.clear(screen.getByLabelText("发生日期"))
    await user.type(screen.getByLabelText("发生日期"), "2026-09-30")
    await user.selectOptions(screen.getByLabelText("支出分类"), "7")
    await user.click(screen.getByRole("radio", { name: "已支付，一次记录" }))
    await user.selectOptions(screen.getByLabelText("使用已到账收入"), "3")
    await user.click(screen.getByRole("button", { name: "确认录入" }))
    expect(submit).toHaveBeenCalledWith({ title: "晚餐", amount_out: 20.05, category: "personal", occurred_at: "2026-09-30", expense_category_id: 7, payment_salary_log_id: 3 })
  })
  it("prevents insufficient income and resets payment when switching to work", async () => {
    const user = userEvent.setup(), submit = vi.fn()
    render(<TransactionDialog open onOpenChange={vi.fn()} isPending={false} onSubmit={submit} supportsImmediatePayment availableLogs={income} />)
    await user.type(screen.getByLabelText("标题"), "采购")
    await user.type(screen.getByLabelText("金额（人民币）"), "40")
    await user.click(screen.getByRole("radio", { name: "已支付，一次记录" }))
    await user.selectOptions(screen.getByLabelText("使用已到账收入"), "3")
    await user.click(screen.getByRole("button", { name: "确认录入" }))
    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByText("消费金额超过这笔收入的可用余额")).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "工作垫付" }))
    await user.click(screen.getByRole("button", { name: "确认录入" }))
    expect(submit).toHaveBeenCalledWith({ title: "采购", amount_out: 40, category: "work" })
  })
})
