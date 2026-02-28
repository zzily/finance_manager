import { useMemo, useState } from "react"
import { Wallet, Plus, ArrowDownCircle } from "lucide-react"
import { Button } from "../components/ui/button"
import { useTransactions } from "../hooks/useTransactions"
import { useSalaryLogs } from "../hooks/useSalaryLogs"
import { useSummary } from "../hooks/useSummary"
import { BalanceCard, TotalAssetsCard } from "../components/dashboard/MetricCards"
import { BusinessLoopCard } from "../components/dashboard/BusinessLoopCard"
import { FamilyLoopCard } from "../components/dashboard/FamilyLoopCard"
import { OperationBar } from "../components/dashboard/OperationBar"
import { MonthlyTrendChart, CategoryPieChart } from "../components/dashboard/Charts"
import { TransactionTable } from "../components/transaction/TransactionTable"
import { MobileTransactionCard } from "../components/transaction/MobileTransactionCard"
import { MobileCardSkeleton, EmptyState } from "../components/common"
import { SettleDialog } from "../components/dialogs/SettleDialog"
import { TransactionDialog } from "../components/dialogs/TransactionDialog"
import { SalaryLogDialog } from "../components/dialogs/SalaryLogDialog"
import { EditTransactionDialog } from "../components/dialogs/EditTransactionDialog"
import { DeleteConfirmDialog } from "../components/dialogs/DeleteConfirmDialog"
import { SalaryPoolDialog } from "../components/dialogs/SalaryPoolDialog"
import { SettlementHistoryDialog } from "../components/dialogs/SettlementHistoryDialog"
import type { Transaction } from "../types"

export default function SettlementPage() {
  const txns = useTransactions()
  const salary = useSalaryLogs()
  const summary = useSummary()

  /* dialog visibility */
  const [settleOpen, setSettleOpen] = useState(false)
  const [txnDialogOpen, setTxnDialogOpen] = useState(false)
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [poolOpen, setPoolOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  /* selection state */
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null)
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null)
  const [deletingTxn, setDeletingTxn] = useState<Transaction | null>(null)
  const [historyTxn, setHistoryTxn] = useState<Transaction | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending")

  const displayList = useMemo(
    () => (activeTab === "pending" ? txns.unsettled : txns.all),
    [activeTab, txns.unsettled, txns.all],
  )

  /* dialog openers */
  function openSettle(t: Transaction) { setSelectedTxn(t); setSettleOpen(true) }
  function openEdit(t: Transaction) { setEditingTxn(t); setEditOpen(true) }
  function openDelete(t: Transaction) { setDeletingTxn(t); setDeleteError(null); setDeleteOpen(true) }
  function openHistory(t: Transaction) { setHistoryTxn(t); setHistoryOpen(true) }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 shadow-[0_1px_0_0_rgb(0_0_0/.04)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
              <Wallet size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight text-slate-950">财务管理</h1>
              <p className="text-xs text-slate-400">个人垫付与核销</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setTxnDialogOpen(true)}>
              <Plus size={14} /><span className="hidden sm:inline">记录垫付</span><span className="sm:hidden">垫付</span>
            </Button>
            <Button size="sm" onClick={() => setSalaryDialogOpen(true)}>
              <ArrowDownCircle size={14} /><span className="hidden sm:inline">录入回款</span><span className="sm:hidden">回款</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        {/* Row 1: Core Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <BalanceCard isLoading={summary.isLoading} balance={summary.availableBalance} onClick={() => setPoolOpen(true)} />
          <TotalAssetsCard isLoading={summary.isLoading} totalAssets={summary.totalAssets} />
        </div>

        {/* Row 2: Dual Loops */}
        <div className="grid gap-4 md:grid-cols-2">
          <BusinessLoopCard isLoading={summary.isLoading} loop={summary.businessLoop} debt={summary.businessDebt} />
          <FamilyLoopCard isLoading={summary.isLoading} loop={summary.familyLoop} netSavings={summary.netSavings} personalSpending={summary.personalSpending} />
        </div>

        {/* Row 3: Charts */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <MonthlyTrendChart data={summary.chartData} isLoading={summary.isLoading} />
          </div>
          <CategoryPieChart data={summary.chartData} isLoading={summary.isLoading} />
        </div>

        {/* Row 4: Operation Bar */}
        <OperationBar isLoading={summary.isLoading} billsPending={summary.billsPending} availableBalance={summary.availableBalance} actionNeeded={summary.actionNeeded} />

        {/* Row 4: Bills */}
        <div className="overflow-hidden rounded-xl bg-white shadow-card">
          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="relative flex items-center gap-1 rounded-full bg-slate-100 p-0.5">
              {(["pending", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`relative z-10 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${activeTab === tab ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "pending" ? "待核销" : "全部记录"}
                </button>
              ))}
            </div>
            <span className="hidden text-xs text-slate-400 sm:inline">
              {activeTab === "pending" ? "仅显示未结清账单" : "展示全部账单记录"}
            </span>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <TransactionTable
              data={displayList}
              isLoading={txns.query.isLoading}
              isError={txns.query.isError}
              activeTab={activeTab}
              onSettle={openSettle}
              onEdit={openEdit}
              onDelete={openDelete}
              onHistory={openHistory}
              onAdd={() => setTxnDialogOpen(true)}
            />
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-3 md:hidden">
            {txns.query.isLoading && Array.from({ length: 3 }).map((_, i) => <MobileCardSkeleton key={i} />)}
            {txns.query.isError && <div className="py-10 text-center text-sm text-red-500">无法加载账单，请稍后重试</div>}
            {!txns.query.isLoading && displayList.length === 0 && <EmptyState tab={activeTab} onAdd={() => setTxnDialogOpen(true)} />}
            {displayList.map((item) => (
              <MobileTransactionCard key={item.id} item={item} onSettle={openSettle} onEdit={openEdit} onDelete={openDelete} onHistory={openHistory} />
            ))}
          </div>
        </div>
      </main>

      {/* ─── Dialogs ─── */}
      <SettleDialog
        open={settleOpen} onOpenChange={setSettleOpen} transaction={selectedTxn}
        availableLogs={salary.available} isLoadingLogs={salary.availableQuery.isLoading} isErrorLogs={salary.availableQuery.isError}
        isPending={salary.settle.isPending}
        onSubmit={(salaryLogId, amount) => {
          if (!selectedTxn) return
          salary.settle.mutate(
            { transaction_id: selectedTxn.id, salary_log_id: salaryLogId, amount },
            { onSuccess: () => setSettleOpen(false), onError: () => {} },
          )
        }}
      />
      <TransactionDialog
        open={txnDialogOpen} onOpenChange={setTxnDialogOpen}
        isPending={txns.create.isPending}
        onSubmit={(form) => txns.create.mutate(form, { onSuccess: () => setTxnDialogOpen(false) })}
      />
      <SalaryLogDialog
        open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}
        isPending={salary.create.isPending}
        onSubmit={(form) => salary.create.mutate(form, { onSuccess: () => setSalaryDialogOpen(false) })}
      />
      <EditTransactionDialog
        open={editOpen} onOpenChange={setEditOpen} transaction={editingTxn}
        isPending={txns.update.isPending}
        onSubmit={(id, payload) => txns.update.mutate({ id, payload }, { onSuccess: () => setEditOpen(false) })}
      />
      <DeleteConfirmDialog
        open={deleteOpen} onOpenChange={setDeleteOpen} transaction={deletingTxn}
        isPending={txns.remove.isPending} error={deleteError}
        onConfirm={() => { if (deletingTxn) txns.remove.mutate(deletingTxn.id, { onSuccess: () => setDeleteOpen(false), onError: () => setDeleteError("删除失败，请稍后重试") }) }}
      />
      <SalaryPoolDialog
        open={poolOpen} onOpenChange={setPoolOpen}
        data={salary.allLogs} isLoading={salary.allQuery.isLoading} isError={salary.allQuery.isError}
      />
      <SettlementHistoryDialog
        open={historyOpen} onOpenChange={setHistoryOpen} transaction={historyTxn}
      />
    </div>
  )
}
