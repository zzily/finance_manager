import { useState, type ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { SalaryLogsState } from "../hooks/useSalaryLogs"
import type { TransactionsState } from "../hooks/useTransactions"
import type { Transaction } from "../types"
import type { SettlementPageState } from "./useSettlementPageState"
import { SettlementDialogs } from "./SettlementDialogs"

vi.mock("../components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) => (
    open ? <div>{children}</div> : null
  ),
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

vi.mock("../components/dialogs/EditSalaryLogDialog", () => ({
  EditSalaryLogDialog: () => null,
}))

vi.mock("../components/dialogs/EditTransactionDialog", () => ({
  EditTransactionDialog: () => null,
}))

vi.mock("../components/dialogs/SalaryLogDialog", () => ({
  SalaryLogDialog: () => null,
}))

vi.mock("../components/dialogs/SalaryPoolDialog", () => ({
  SalaryPoolDialog: () => null,
}))

vi.mock("../components/dialogs/SettleDialog", () => ({
  SettleDialog: () => null,
}))

vi.mock("../components/dialogs/SettlementHistoryDialog", () => ({
  SettlementHistoryDialog: () => null,
}))

vi.mock("../components/dialogs/TransactionDialog", () => ({
  TransactionDialog: () => null,
}))

const deletingTransaction: Transaction = {
  id: 8,
  title: "Linked transaction",
  amount_out: 200,
  amount_reimbursed: 50,
  category: "work",
  status: "partially_settled",
  created_at: "2026-03-27T00:00:00Z",
}

function renderDeleteFailureFlow(deleteMessage: string) {
  const getDeleteErrorMessage = vi.fn(() => deleteMessage)
  const removeMutate = vi.fn(
    (_id: number, options?: { onError?: (error: unknown) => void }) => {
      options?.onError?.(new Error("delete failed"))
    },
  )

  function Harness() {
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(true)

    const pageState = {
      activeTab: "pending",
      deleteError,
      deleteOpen,
      deletingTxn: deletingTransaction,
      displayList: [],
      editOpen: false,
      editSalaryOpen: false,
      editingSalaryLog: null,
      editingTxn: null,
      historyOpen: false,
      historyTxn: null,
      openDeleteTransaction: vi.fn(),
      openEditSalaryLog: vi.fn(),
      openEditTransaction: vi.fn(),
      openSettle: vi.fn(),
      openSettlementHistory: vi.fn(),
      poolOpen: false,
      salaryDialogOpen: false,
      selectedTxn: null,
      setActiveTab: vi.fn(),
      setDeleteError,
      setDeleteOpen,
      setEditOpen: vi.fn(),
      setEditSalaryOpen: vi.fn(),
      setHistoryOpen: vi.fn(),
      setPoolOpen: vi.fn(),
      setSalaryDialogOpen: vi.fn(),
      setSettleOpen: vi.fn(),
      setTxnDialogOpen: vi.fn(),
      settleOpen: false,
      txnDialogOpen: false,
    } satisfies SettlementPageState

    const transactions = {
      create: { isPending: false, mutate: vi.fn() },
      update: { isPending: false, mutate: vi.fn() },
      remove: {
        isPending: false,
        mutate: removeMutate,
      },
      getDeleteErrorMessage,
    } as unknown as TransactionsState

    const salary = {
      available: [],
      availableQuery: { isLoading: false, isError: false },
      allLogs: [],
      allQuery: { isLoading: false, isError: false },
      create: { isPending: false, mutate: vi.fn() },
      update: { isPending: false, mutate: vi.fn() },
      remove: { isPending: false, mutate: vi.fn() },
      settle: { isPending: false, mutate: vi.fn() },
    } as unknown as SalaryLogsState

    return <SettlementDialogs pageState={pageState} salary={salary} transactions={transactions} />
  }

  render(<Harness />)

  return { getDeleteErrorMessage, removeMutate }
}

describe("SettlementDialogs", () => {
  it("shows the backend delete message when removing a transaction fails", async () => {
    const user = userEvent.setup()
    const deleteMessage = "该账单已有 1 条核销记录，无法直接删除。请先撤销相关核销。"
    const { getDeleteErrorMessage, removeMutate } = renderDeleteFailureFlow(deleteMessage)

    await user.click(screen.getByTestId("confirm-delete-transaction"))

    expect(removeMutate).toHaveBeenCalledWith(
      deletingTransaction.id,
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    )
    expect(getDeleteErrorMessage).toHaveBeenCalled()
    expect(screen.getByText(deleteMessage)).toBeInTheDocument()
  })
})
