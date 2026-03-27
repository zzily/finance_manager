import { ArrowDownCircle, Plus, Sparkles } from "lucide-react"

import { BillsSection } from "./BillsSection"
import { SettlementDialogs } from "./SettlementDialogs"
import { useSettlementPageState } from "./useSettlementPageState"
import { TransactionFiltersBar } from "../components/transactions/TransactionFiltersBar"
import { TransactionResultToolbar } from "../components/transactions/TransactionResultToolbar"
import { Button } from "../components/ui/button"
import { useSalaryLogs } from "../hooks/useSalaryLogs"
import { useSummary } from "../hooks/useSummary"
import { useTransactionFilters } from "../hooks/useTransactionFilters"
import { useTransactions } from "../hooks/useTransactions"
import type { AppView } from "../layouts/appShell.types"

export function TransactionsPage({
  onNavigate,
}: {
  onNavigate: (view: AppView) => void
}) {
  const transactions = useTransactions()
  const salary = useSalaryLogs()
  const summary = useSummary()
  const pageState = useSettlementPageState(transactions.all, transactions.unsettled)
  const filters = useTransactionFilters(pageState.displayList)

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-card lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Transaction center
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            先筛选，再处理，减少在长列表里翻找
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            账单中心把筛选、排序、编辑和核销入口放到一页内，适合你先收敛范围，再决定是修改、删除还是进入核销工作台。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => pageState.setTxnDialogOpen(true)}>
            <Plus size={15} />
            记录账单
          </Button>
          <Button variant="outline" onClick={() => pageState.setSalaryDialogOpen(true)}>
            <ArrowDownCircle size={15} />
            录入回款
          </Button>
          <Button onClick={() => onNavigate("workbench")}>
            <Sparkles size={15} />
            去核销工作台
          </Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-card">
          <p className="text-xs font-medium text-slate-500">待核销总额</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-red-600">
            ¥{summary.billsPending.toFixed(2)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-card">
          <p className="text-xs font-medium text-slate-500">可分配回款</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            ¥{summary.availableBalance.toFixed(2)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-card">
          <p className="text-xs font-medium text-slate-500">全部账单数</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {transactions.all.length}
          </p>
        </div>
      </section>

      <TransactionFiltersBar
        availableMonths={filters.availableMonths}
        hasActiveFilters={filters.hasActiveFilters}
        onCategoryChange={filters.setCategory}
        onMonthChange={filters.setMonth}
        onQueryChange={filters.setQuery}
        onReset={filters.resetFilters}
        onSortChange={filters.setSort}
        onStatusChange={filters.setStatus}
        state={filters.state}
      />

      <TransactionResultToolbar
        activeTab={pageState.activeTab}
        count={filters.filteredTransactions.length}
        hasActiveFilters={filters.hasActiveFilters}
        totalAmount={filters.totals.amount}
        totalOutstanding={filters.totals.outstanding}
      />

      <BillsSection
        activeTab={pageState.activeTab}
        data={filters.filteredTransactions}
        isLoading={transactions.query.isLoading}
        isError={transactions.query.isError}
        onAdd={() => pageState.setTxnDialogOpen(true)}
        onDelete={pageState.openDeleteTransaction}
        onEdit={pageState.openEditTransaction}
        onHistory={pageState.openSettlementHistory}
        onSettle={pageState.openSettle}
        onTabChange={pageState.setActiveTab}
      />

      <SettlementDialogs pageState={pageState} salary={salary} transactions={transactions} />
    </div>
  )
}
