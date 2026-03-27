import { useMemo, useState } from "react"

import type { SalaryLog, Transaction } from "../types"

export type SettlementTab = "pending" | "history"

export function useSettlementPageState(
  allTransactions: Transaction[],
  unsettledTransactions: Transaction[],
) {
  const [settleOpen, setSettleOpen] = useState(false)
  const [txnDialogOpen, setTxnDialogOpen] = useState(false)
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [poolOpen, setPoolOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [editSalaryOpen, setEditSalaryOpen] = useState(false)

  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null)
  const [deletingTxn, setDeletingTxn] = useState<Transaction | null>(null)
  const [historyTxn, setHistoryTxn] = useState<Transaction | null>(null)
  const [editingSalaryLog, setEditingSalaryLog] = useState<SalaryLog | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SettlementTab>("pending")

  const displayList = useMemo(
    () => (activeTab === "pending" ? unsettledTransactions : allTransactions),
    [activeTab, allTransactions, unsettledTransactions],
  )

  function openSettle(transaction: Transaction) {
    setSelectedTxn(transaction)
    setSettleOpen(true)
  }

  function openEditTransaction(transaction: Transaction) {
    setEditingTxn(transaction)
    setEditOpen(true)
  }

  function openDeleteTransaction(transaction: Transaction) {
    setDeletingTxn(transaction)
    setDeleteError(null)
    setDeleteOpen(true)
  }

  function openSettlementHistory(transaction: Transaction) {
    setHistoryTxn(transaction)
    setHistoryOpen(true)
  }

  function openEditSalaryLog(salaryLog: SalaryLog) {
    setEditingSalaryLog(salaryLog)
    setEditSalaryOpen(true)
  }

  return {
    activeTab,
    deleteError,
    deleteOpen,
    deletingTxn,
    displayList,
    editOpen,
    editSalaryOpen,
    editingSalaryLog,
    editingTxn,
    historyOpen,
    historyTxn,
    openDeleteTransaction,
    openEditSalaryLog,
    openEditTransaction,
    openSettle,
    openSettlementHistory,
    poolOpen,
    salaryDialogOpen,
    selectedTxn,
    setActiveTab,
    setDeleteError,
    setDeleteOpen,
    setEditOpen,
    setEditSalaryOpen,
    setHistoryOpen,
    setPoolOpen,
    setSalaryDialogOpen,
    setSettleOpen,
    setTxnDialogOpen,
    settleOpen,
    txnDialogOpen,
  }
}

export type SettlementPageState = ReturnType<typeof useSettlementPageState>
