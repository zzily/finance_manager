import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { Transaction } from "../../types"
import { EditTransactionDialog } from "./EditTransactionDialog"

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
          data-testid="transaction-category-select"
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

const firstTransaction: Transaction = {
  id: 1,
  title: "First record",
  amount_out: 25,
  amount_reimbursed: 0,
  category: "work",
  status: "pending",
  created_at: "2026-03-27T00:00:00Z",
}

const secondTransaction: Transaction = {
  id: 2,
  title: "Second record",
  amount_out: 80,
  amount_reimbursed: 10,
  category: "personal",
  status: "partially_settled",
  created_at: "2026-03-26T00:00:00Z",
}

describe("EditTransactionDialog", () => {
  it("hydrates the form with the selected transaction when opening different records", () => {
    const { rerender } = render(
      <EditTransactionDialog
        open
        onOpenChange={vi.fn()}
        transaction={firstTransaction}
        isPending={false}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue("First record")).toBeInTheDocument()
    expect(screen.getByDisplayValue("25")).toBeInTheDocument()
    expect(screen.getByTestId("transaction-category-select")).toHaveValue("work")

    rerender(
      <EditTransactionDialog
        open
        onOpenChange={vi.fn()}
        transaction={secondTransaction}
        isPending={false}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue("Second record")).toBeInTheDocument()
    expect(screen.getByDisplayValue("80")).toBeInTheDocument()
    expect(screen.getByTestId("transaction-category-select")).toHaveValue("personal")
    expect(screen.queryByDisplayValue("First record")).not.toBeInTheDocument()
  })
})
