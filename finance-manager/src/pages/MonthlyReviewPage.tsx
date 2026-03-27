import { useMemo, useState } from "react"

import { ArrowRight, CalendarDays, Sparkles, TrendingUp, Wallet } from "lucide-react"

import { BusinessLoopCard } from "../components/dashboard/BusinessLoopCard"
import { CategoryPieChart, MonthlyTrendChart } from "../components/dashboard/Charts"
import { FamilyLoopCard } from "../components/dashboard/FamilyLoopCard"
import { BalanceCard, TotalAssetsCard } from "../components/dashboard/MetricCards"
import { Button } from "../components/ui/button"
import { MonthPicker } from "../components/ui/month-picker"
import { useSalaryLogs } from "../hooks/useSalaryLogs"
import { useSummary } from "../hooks/useSummary"
import { useTransactions } from "../hooks/useTransactions"
import type { AppView } from "../layouts/appShell.types"
import { currency } from "../lib/formatters"

function getCurrentMonthKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `${now.getFullYear()}-${month}`
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-")
  return `${year} 年 ${Number(monthNumber)} 月`
}

export function MonthlyReviewPage({
  onNavigate,
}: {
  onNavigate: (view: AppView) => void
}) {
  const transactions = useTransactions()
  const salary = useSalaryLogs()
  const [preferredMonth, setPreferredMonth] = useState("")

  const availableMonths = useMemo(
    () =>
      Array.from(
        new Set([
          ...transactions.all.map((transaction) => transaction.created_at.slice(0, 7)),
          ...salary.allLogs.map((log) => log.month),
        ]),
      )
        .filter(Boolean)
        .sort((left, right) => right.localeCompare(left)),
    [salary.allLogs, transactions.all],
  )
  const selectedMonth = useMemo(() => {
    if (preferredMonth) {
      return preferredMonth
    }
    return availableMonths[0] ?? getCurrentMonthKey()
  }, [availableMonths, preferredMonth])

  const summary = useSummary(selectedMonth)
  const categoryBreakdown = summary.chartData?.category_breakdown ?? []
  const topCategory = [...categoryBreakdown].sort((left, right) => right.value - left.value)[0]
  const businessCoverage =
    summary.businessLoop?.total_lent && summary.businessLoop.total_lent > 0
      ? (summary.businessLoop.total_reimbursed / summary.businessLoop.total_lent) * 100
      : 0

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-card lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Review
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            用复盘视角看账本，而不只是看余额
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            复盘页现在已经支持按月份查看 summary 结果。你可以切换月份观察当期回款覆盖率、净结余和支出重点，再决定是否回到账单中心追查明细。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:min-w-[280px]">
          <MonthPicker
            value={selectedMonth}
            onChange={(value) => setPreferredMonth(value)}
            placeholder="选择要复盘的月份"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPreferredMonth("")}>
              使用最新月份
            </Button>
            <Button onClick={() => onNavigate("transactions")}>
              去账单中心细看明细
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Selected month
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            {formatMonthLabel(selectedMonth)}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            当前卡片和图表都按这个月份过滤，方便做单月复盘。
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays size={16} className="text-slate-400" />
            <span>有数据月份 {availableMonths.length > 0 ? availableMonths.length : 1} 个</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(availableMonths.length > 0 ? availableMonths : [selectedMonth]).map((month) => {
              const isActive = month === selectedMonth

              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => setPreferredMonth(month)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {formatMonthLabel(month)}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <BalanceCard isLoading={summary.isLoading} balance={summary.availableBalance} onClick={() => {}} />
        <TotalAssetsCard isLoading={summary.isLoading} totalAssets={summary.totalAssets} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Sparkles size={18} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-950">回款覆盖率</h3>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {businessCoverage.toFixed(0)}%
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            已回款 {currency.format(summary.businessLoop?.total_reimbursed ?? 0)}，对应垫付总额 {currency.format(summary.businessLoop?.total_lent ?? 0)}。
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <TrendingUp size={18} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-950">净结余状态</h3>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${summary.netSavings >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {currency.format(summary.netSavings)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            家庭储蓄表现 {summary.netSavings >= 0 ? "保持在正区间" : "已经跌入负区间"}，适合结合个人支出与收入走势一起看。
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Wallet size={18} />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-950">当前支出重点</h3>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {topCategory?.name ?? "暂无"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            当前最大支出分类为 {topCategory?.name ?? "暂无"}，累计 {currency.format(topCategory?.value ?? 0)}。
          </p>
        </div>
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

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <MonthlyTrendChart data={summary.chartData} isLoading={summary.isLoading} />
        <CategoryPieChart data={summary.chartData} isLoading={summary.isLoading} />
      </div>
    </div>
  )
}
