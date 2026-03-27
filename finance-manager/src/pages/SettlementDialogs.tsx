import { DeleteConfirmDialog } from "../components/dialogs/DeleteConfirmDialog"
import { EditSalaryLogDialog } from "../components/dialogs/EditSalaryLogDialog"
import { EditTransactionDialog } from "../components/dialogs/EditTransactionDialog"
import { SalaryLogDialog } from "../components/dialogs/SalaryLogDialog"
import { SalaryPoolDialog } from "../components/dialogs/SalaryPoolDialog"
import { SettleDialog } from "../components/dialogs/SettleDialog"
import { SettlementHistoryDialog } from "../components/dialogs/SettlementHistoryDialog"
import { TransactionDialog } from "../components/dialogs/TransactionDialog"
import type { SalaryLogsState } from "../hooks/useSalaryLogs"
import type { TransactionsState } from "../hooks/useTransactions"

import type { SettlementPageState } from "./useSettlementPageState"

type SettlementDialogsProps = {
  pageState: SettlementPageState
  salary: SalaryLogsState
  transactions: TransactionsState
}

export function SettlementDialogs({
  pageState,
  salary,
  transactions,
}: SettlementDialogsProps) {
  return (
    <>
      <SettleDialog
        open={pageState.settleOpen}
        onOpenChange={pageState.setSettleOpen}
        transaction={pageState.selectedTxn}
        availableLogs={salary.available}
        isLoadingLogs={salary.availableQuery.isLoading}
        isErrorLogs={salary.availableQuery.isError}
        isPending={salary.settle.isPending}
        onSubmit={(salaryLogId, amount) => {
          if (!pageState.selectedTxn) return
          salary.settle.mutate(
            { transaction_id: pageState.selectedTxn.id, salary_log_id: salaryLogId, amount },
            { onSuccess: () => pageState.setSettleOpen(false) },
          )
        }}
      />
      <TransactionDialog
        open={pageState.txnDialogOpen}
        onOpenChange={pageState.setTxnDialogOpen}
        isPending={transactions.create.isPending}
        onSubmit={(form) => {
          transactions.create.mutate(form, { onSuccess: () => pageState.setTxnDialogOpen(false) })
        }}
      />
      <SalaryLogDialog
        open={pageState.salaryDialogOpen}
        onOpenChange={pageState.setSalaryDialogOpen}
        isPending={salary.create.isPending}
        onSubmit={(form) => {
          salary.create.mutate(form, { onSuccess: () => pageState.setSalaryDialogOpen(false) })
        }}
      />
      <EditTransactionDialog
        open={pageState.editOpen}
        onOpenChange={pageState.setEditOpen}
        transaction={pageState.editingTxn}
        isPending={transactions.update.isPending}
        onSubmit={(id, payload) => {
          transactions.update.mutate({ id, payload }, { onSuccess: () => pageState.setEditOpen(false) })
        }}
      />
      <DeleteConfirmDialog
        open={pageState.deleteOpen}
        onOpenChange={pageState.setDeleteOpen}
        transaction={pageState.deletingTxn}
        isPending={transactions.remove.isPending}
        error={pageState.deleteError}
        onConfirm={() => {
          if (!pageState.deletingTxn) return
          transactions.remove.mutate(pageState.deletingTxn.id, {
            onSuccess: () => pageState.setDeleteOpen(false),
            onError: (error) => {
              pageState.setDeleteError(transactions.getDeleteErrorMessage(error))
            },
          })
        }}
      />
      <SalaryPoolDialog
        open={pageState.poolOpen}
        onOpenChange={pageState.setPoolOpen}
        data={salary.allLogs}
        isLoading={salary.allQuery.isLoading}
        isError={salary.allQuery.isError}
        isDeleting={salary.remove.isPending}
        onEdit={pageState.openEditSalaryLog}
        onDelete={(id) => salary.remove.mutate(id)}
      />
      <EditSalaryLogDialog
        open={pageState.editSalaryOpen}
        onOpenChange={pageState.setEditSalaryOpen}
        salaryLog={pageState.editingSalaryLog}
        isPending={salary.update.isPending}
        onSubmit={(id, payload) => {
          salary.update.mutate({ id, payload }, { onSuccess: () => pageState.setEditSalaryOpen(false) })
        }}
      />
      <SettlementHistoryDialog
        open={pageState.historyOpen}
        onOpenChange={pageState.setHistoryOpen}
        transaction={pageState.historyTxn}
      />
    </>
  )
}
