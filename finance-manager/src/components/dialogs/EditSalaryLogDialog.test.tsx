import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { SalaryLog } from "../../types"
import { EditSalaryLogDialog } from "./EditSalaryLogDialog"

vi.mock("../ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => (
    open ? <div>{children}</div> : null
  ),
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

vi.mock("../ui/month-picker", () => ({
  MonthPicker: ({
    onChange,
    placeholder,
    value,
  }: {
    onChange: (value: string) => void
    placeholder?: string
    value: string
  }) => (
    <input
      data-testid="salary-month-picker"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  ),
}))

vi.mock("../ui/select", async () => {
  const React = await import("react")

  type SelectContextValue = {
    onValueChange: (value: string) => void
    value: string
  }

  const SelectContext = React.createContext<SelectContextValue | null>(null)

  return {
    Select: ({
      children,
      onValueChange,
      value,
    }: {
      children: ReactNode
      onValueChange: (value: string) => void
      value: string
    }) => (
      <SelectContext.Provider value={{ onValueChange, value }}>
        {children}
      </SelectContext.Provider>
    ),
    SelectContent: ({ children }: { children: ReactNode }) => {
      const context = React.useContext(SelectContext)
      return (
        <select
          data-testid="salary-source-select"
          value={context?.value}
          onChange={(event) => context?.onValueChange(event.target.value)}
        >
          {children}
        </select>
      )
    },
    SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
      <option value={value}>{children}</option>
    ),
    SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => {
      const context = React.useContext(SelectContext)
      return <span>{context?.value ?? placeholder}</span>
    },
  }
})

const firstSalaryLog: SalaryLog = {
  id: 1,
  amount: 120,
  amount_unused: 90,
  month: "2026-01",
  source: "salary",
  remark: "first remark",
  received_date: "2026-01-15T00:00:00Z",
}

const secondSalaryLog: SalaryLog = {
  id: 2,
  amount: 260,
  amount_unused: 140,
  month: "2026-02",
  source: "reimbursement",
  remark: "second remark",
  received_date: "2026-02-15T00:00:00Z",
}

describe("EditSalaryLogDialog", () => {
  it("hydrates the form with the selected salary log when opening different records", () => {
    const { rerender } = render(
      <EditSalaryLogDialog
        open
        onOpenChange={vi.fn()}
        salaryLog={firstSalaryLog}
        isPending={false}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue("120")).toBeInTheDocument()
    expect(screen.getByTestId("salary-source-select")).toHaveValue("salary")
    expect(screen.getByTestId("salary-month-picker")).toHaveValue("2026-01")
    expect(screen.getByDisplayValue("first remark")).toBeInTheDocument()

    rerender(
      <EditSalaryLogDialog
        open
        onOpenChange={vi.fn()}
        salaryLog={secondSalaryLog}
        isPending={false}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue("260")).toBeInTheDocument()
    expect(screen.getByTestId("salary-source-select")).toHaveValue("reimbursement")
    expect(screen.getByTestId("salary-month-picker")).toHaveValue("2026-02")
    expect(screen.getByDisplayValue("second remark")).toBeInTheDocument()
    expect(screen.queryByDisplayValue("first remark")).not.toBeInTheDocument()
  })
})
