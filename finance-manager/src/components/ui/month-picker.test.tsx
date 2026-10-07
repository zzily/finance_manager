import { useState } from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { MonthPicker } from "./month-picker"
import { Field, FieldLabel } from "./field"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./dialog"

function Harness({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState("2025-05")
  return (
    <Dialog open>
      <DialogContent>
        <DialogTitle>编辑收入测试</DialogTitle>
        <DialogDescription>选择归属月份</DialogDescription>
        <Field>
          <FieldLabel htmlFor="month">归属月份</FieldLabel>
          <MonthPicker
            id="month"
            value={value}
            onChange={(next) => {
              setValue(next)
              onChange(next)
            }}
          />
        </Field>
      </DialogContent>
    </Dialog>
  )
}

describe("MonthPicker", () => {
  it("exposes the selected month and restores trigger focus after selection inside a dialog", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const trigger = screen.getByLabelText("归属月份")
    await waitFor(() => expect(trigger).toHaveFocus())
    await user.click(trigger)
    const panel = screen.getByRole("dialog", { name: "选择月份" })
    expect(within(panel).getByRole("button", { name: "5月" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    await user.click(within(panel).getByRole("button", { name: "6月" }))
    expect(onChange).toHaveBeenCalledWith("2025-06")
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(
      screen.getByRole("dialog", { name: "编辑收入测试" }),
    ).toBeInTheDocument()
    expect(trigger.querySelector('[role="button"],button')).toBeNull()
  })

  it("closes only the popover on Escape and provides a separate clear action", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const trigger = screen.getByLabelText("归属月份")
    await waitFor(() => expect(trigger).toHaveFocus())
    await user.click(trigger)
    await user.keyboard("{Escape}")
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "选择月份" }),
      ).not.toBeInTheDocument(),
    )
    expect(trigger).toHaveFocus()
    expect(
      screen.getByRole("dialog", { name: "编辑收入测试" }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "清除月份" }))
    expect(onChange).toHaveBeenCalledWith("")
    expect(trigger).toHaveTextContent("选择月份")
    expect(trigger).toHaveFocus()
  })

  it("limits year navigation and marks future months unavailable", async () => {
    const user = userEvent.setup()
    const now = new Date()
    render(
      <MonthPicker
        value={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`}
        onChange={vi.fn()}
      />,
    )
    await user.click(screen.getAllByRole("button")[0])
    expect(screen.getByRole("button", { name: "下一年" })).toBeDisabled()
    if (now.getMonth() < 11)
      expect(
        screen.getByRole("button", { name: `${now.getMonth() + 2}月` }),
      ).toBeDisabled()
    await user.click(
      screen.getByRole("button", { name: `${now.getFullYear()}年` }),
    )
    const year = screen.getByRole("spinbutton", { name: "年份" })
    await user.clear(year)
    await user.type(year, "2000{Enter}")
    expect(screen.getByRole("button", { name: "上一年" })).toBeDisabled()
  })
})
