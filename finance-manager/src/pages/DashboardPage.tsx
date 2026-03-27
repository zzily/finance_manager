import { ArrowDownCircle, Plus, Sparkles } from "lucide-react"

import { BusinessLoopCard } from "../components/dashboard/BusinessLoopCard"
import { CategoryPieChart, MonthlyTrendChart } from "../components/dashboard/Charts"
import { DashboardAlertsSection } from "../components/dashboard/DashboardAlertsSection"
import { FamilyLoopCard } from "../components/dashboard/FamilyLoopCard"
import { BalanceCard, TotalAssetsCard } from "../components/dashboard/MetricCards"
import { OperationBar } from "../components/dashboard/OperationBar"
import { RecentActivityFeed } from "../components/dashboard/RecentActivityFeed"
import { Button } from "../components/ui/button"
import { useActivityFeed } from "../hooks/useActivityFeed"
import { useDashboardAlerts } from "../hooks/useDashboardAlerts"
import { useSalaryLogs } from "../hooks/useSalaryLogs"
import { useSummary } from "../hooks/useSummary"
import { useTransactions } from "../hooks/useTransactions"
import type { AppView } from "../layouts/appShell.types"
import { SettlementDialogs } from "./SettlementDialogs"
import { useSettlementPageState } from "./useSettlementPageState"

function getRemainingDebt(amountOut: number, reimbursed: number) {
  return amountOut - reimbursed
}

export function DashboardPage({
  onNavigate,
}: {
  onNavigate: (view: AppView) => void
}) {
  const transactions = useTransactions()
  const salary = useSalaryLogs()
  const summary = useSummary()
  const pageState = useSettlementPageState(transactions.all, transactions.unsettled)

  const alerts = useDashboardAlerts({
    availableBalance: summary.availableBalance,
    netSavings: summary.netSavings,
    personalSpending: summary.personalSpending,
    unsettledTransactions: transactions.unsettled,
  })
  const recentActivities = useActivityFeed({
    transactions: transactions.all,
    salaryLogs: salary.allLogs,
  })
  const pendingPreview = transactions.unsettled.slice(0, 4)

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.94)_55%,_rgba(37,99,235,0.82))] px-5 py-6 text-white shadow-xl shadow-slate-950/10 sm:px-7 sm:py-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300">
              Dashboard
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              先看重点，再决定下一步动作
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              首页现在更偏向“驾驶舱”，把待处理风险、资金状态和最近活动集中到一屏，方便你快速进入账单中心或核销工作台。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => pageState.setTxnDialogOpen(true)}>
              <Plus size={15} />
              记录账单
            </Button>
            <Button variant="secondary" onClick={() => pageState.setSalaryDialogOpen(true)}>
              <ArrowDownCircle size={15} />
              录入回款
            </Button>
            <Button onClick={() => onNavigate("workbench")}>
              <Sparkles size={15} />
              去核销工作台
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <BalanceCard
          isLoading={summary.isLoading}
          balance={summary.availableBalance}
          onClick={() => pageState.setPoolOpen(true)}
        />
        <TotalAssetsCard isLoading={summary.isLoading} totalAssets={summary.totalAssets} />
      </div>

      <DashboardAlertsSection
        alerts={alerts}
        isLoading={summary.isLoading || transactions.query.isLoading}
        onNavigate={onNavigate}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
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

          <OperationBar
            isLoading={summary.isLoading}
            billsPending={summary.billsPending}
            availableBalance={summary.availableBalance}
            actionNeeded={summary.actionNeeded}
          />
        </div>

        <RecentActivityFeed
          items={recentActivities}
          isLoading={transactions.query.isLoading || salary.allQuery.isLoading}
          onNavigate={onNavigate}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <MonthlyTrendChart data={summary.chartData} isLoading={summary.isLoading} />
        <CategoryPieChart data={summary.chartData} isLoading={summary.isLoading} />
      </div>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Pending focus
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                待核销焦点账单
              </h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate("transactions")}>
              去账单中心
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {transactions.query.isLoading && Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                <div className="mt-3 h-4 w-40 animate-pulse rounded bg-slate-100" />
              </div>
            ))}

            {!transactions.query.isLoading && pendingPreview.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                当前没有待核销账单，节奏不错。
              </div>
            )}

            {pendingPreview.map((transaction) => (
              <button
                key={transaction.id}
                type="button"
                onClick={() => onNavigate("workbench")}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-100 px-4 py-4 text-left transition hover:border-slate-200 hover:bg-slate-50/70"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-950">{transaction.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {transaction.category === "work" ? "工作垫付" : "个人支出"} · {transaction.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-red-600">
                    ¥{getRemainingDebt(transaction.amount_out, transaction.amount_reimbursed).toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">未结金额</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Next step
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            推荐的使用路径
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "先看提醒",
                description: "确认今天最需要处理的账单或余额变化。",
              },
              {
                title: "再进账单中心",
                description: "用筛选和排序快速收敛到要处理的记录。",
              },
              {
                title: "最后去工作台",
                description: "带着推荐回款完成核销，不再来回试金额。",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SettlementDialogs pageState={pageState} salary={salary} transactions={transactions} />
    </div>
  )
}
