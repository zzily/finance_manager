import { ArrowDownCircle, Download, Plus } from "lucide-react"
import { BillsSection } from "./BillsSection"
import { SettlementDialogs } from "./SettlementDialogs"
import { useSettlementPageState } from "./useSettlementPageState"
import { TransactionFiltersBar } from "../components/transactions/TransactionFiltersBar"
import { TransactionResultToolbar } from "../components/transactions/TransactionResultToolbar"
import { PageHeader } from "../components/common/PageHeader"
import { QueryError } from "../components/common/QueryState"
import { Button } from "../components/ui/button"
import { Skeleton } from "../components/ui/skeleton"
import { useSalaryLogs } from "../hooks/useSalaryLogs"
import { useTransactionFilters } from "../hooks/useTransactionFilters"
import { useTransactions } from "../hooks/useTransactions"
import { exportTransactionsCsv } from "../lib/export"
import type { AppNavigate } from "../lib/navigation"
export function TransactionsPage({ onNavigate }: { onNavigate: AppNavigate }) {
  const transactions = useTransactions()
  const salary = useSalaryLogs()
  const pageState = useSettlementPageState(transactions.all, transactions.unsettled)
  const filters = useTransactionFilters(transactions.all, true)
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="账单">
        <Button variant="outline" size="sm" onClick={() => pageState.setSalaryDialogOpen(true)}>
          <ArrowDownCircle data-icon="inline-start" />
          录入收入
        </Button>
        <Button size="sm" onClick={() => pageState.setTxnDialogOpen(true)}>
          <Plus data-icon="inline-start" />
          记录账单
        </Button>
      </PageHeader>
      <TransactionFiltersBar
        availableExpenseCategories={filters.availableExpenseCategories}
        onExpenseCategoryChange={filters.setExpenseCategoryId}
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
      {transactions.query.isError && (
        <QueryError
          title="无法刷新账单"
          hasData={Boolean(transactions.query.data)}
          onRetry={() => {
            void transactions.query.refetch()
          }}
          isFetching={transactions.query.isFetching}
        />
      )}
      {transactions.query.isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        transactions.query.data && (
          <div className="flex flex-col gap-2">
            <TransactionResultToolbar
              activeTab="history"
              count={filters.filteredTransactions.length}
              hasActiveFilters={filters.hasActiveFilters}
              totalAmount={filters.totals.amount}
              totalOutstanding={filters.totals.outstanding}
            />
            <Button
              variant="ghost"
              size="sm"
              className="self-end"
              disabled={filters.filteredTransactions.length === 0}
              onClick={() => exportTransactionsCsv(filters.filteredTransactions)}
            >
              <Download data-icon="inline-start" />
              导出当前账单
            </Button>
          </div>
        )
      )}
      <BillsSection
        activeTab="history"
        hideTabs
        hasActiveFilters={filters.hasActiveFilters}
        onReset={filters.resetFilters}
        data={filters.filteredTransactions}
        isLoading={transactions.query.isLoading}
        isError={transactions.query.isError && !transactions.query.data}
        onAdd={() => pageState.setTxnDialogOpen(true)}
        onDelete={pageState.openDeleteTransaction}
        onEdit={pageState.openEditTransaction}
        onHistory={pageState.openSettlementHistory}
        onSettle={(t) => onNavigate("workbench", { transactionId: t.id })}
        onTabChange={pageState.setActiveTab}
      />
      <SettlementDialogs pageState={pageState} salary={salary} transactions={transactions} />
    </div>
  )
}
