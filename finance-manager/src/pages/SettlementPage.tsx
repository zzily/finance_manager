import { ArrowDownCircle, Plus, Wallet } from "lucide-react"

import { BusinessLoopCard } from "../components/dashboard/BusinessLoopCard"
import { MonthlyTrendChart, CategoryPieChart } from "../components/dashboard/Charts"
import { FamilyLoopCard } from "../components/dashboard/FamilyLoopCard"
import { BalanceCard, TotalAssetsCard } from "../components/dashboard/MetricCards"
import { OperationBar } from "../components/dashboard/OperationBar"
import { Button } from "../components/ui/button"
import { useSalaryLogs } from "../hooks/useSalaryLogs"
import { useSummary } from "../hooks/useSummary"
import { useTransactions } from "../hooks/useTransactions"
import { BillsSection } from "./BillsSection"
import { SettlementDialogs } from "./SettlementDialogs"
import { useSettlementPageState } from "./useSettlementPageState"

export default function SettlementPage() {
  const transactions = useTransactions()
  const salary = useSalaryLogs()
  const summary = useSummary()
  const pageState = useSettlementPageState(transactions.all, transactions.unsettled)

  return (
    <div className="min-h-screen bg-slate-50" data-testid="settlement-page">
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
            <Button variant="outline" size="sm" onClick={() => pageState.setTxnDialogOpen(true)}>
              <Plus size={14} /><span className="hidden sm:inline">记录垫付</span><span className="sm:hidden">垫付</span>
            </Button>
            <Button size="sm" onClick={() => pageState.setSalaryDialogOpen(true)}>
              <ArrowDownCircle size={14} /><span className="hidden sm:inline">录入回款</span><span className="sm:hidden">回款</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        <div className="grid gap-4 md:grid-cols-2">
          <BalanceCard
            isLoading={summary.isLoading}
            balance={summary.availableBalance}
            onClick={() => pageState.setPoolOpen(true)}
          />
          <TotalAssetsCard isLoading={summary.isLoading} totalAssets={summary.totalAssets} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <BusinessLoopCard
            isLoading={summary.isLoading}
            loop={summary.businessLoop}
            debt={summary.businessDebt}
          />
          <FamilyLoopCard
            isLoading={summary.isLoading}
            loop={summary.familyLoop}
            netSavings={summary.netSavings}
            personalSpending={summary.personalSpending}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <MonthlyTrendChart data={summary.chartData} isLoading={summary.isLoading} />
          </div>
          <CategoryPieChart data={summary.chartData} isLoading={summary.isLoading} />
        </div>

        <OperationBar
          isLoading={summary.isLoading}
          billsPending={summary.billsPending}
          availableBalance={summary.availableBalance}
          actionNeeded={summary.actionNeeded}
        />

        <BillsSection
          activeTab={pageState.activeTab}
          data={pageState.displayList}
          isLoading={transactions.query.isLoading}
          isError={transactions.query.isError}
          onAdd={() => pageState.setTxnDialogOpen(true)}
          onDelete={pageState.openDeleteTransaction}
          onEdit={pageState.openEditTransaction}
          onHistory={pageState.openSettlementHistory}
          onSettle={pageState.openSettle}
          onTabChange={pageState.setActiveTab}
        />
      </main>

      <SettlementDialogs pageState={pageState} salary={salary} transactions={transactions} />
    </div>
  )
}
