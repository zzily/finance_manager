import { Filter, TrendingDown, Wallet } from "lucide-react"

import { currency } from "../../lib/formatters"

export function TransactionResultToolbar({
  activeTab,
  count,
  hasActiveFilters,
  totalAmount,
  totalOutstanding,
}: {
  activeTab: "history" | "pending"
  count: number
  hasActiveFilters: boolean
  totalAmount: number
  totalOutstanding: number
}) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-card lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Results
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
          {activeTab === "pending" ? "待核销账单" : "全部账单记录"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {count} 笔记录
          {hasActiveFilters ? " · 当前结果已应用筛选条件" : " · 当前展示完整结果"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Filter size={13} />
            结果数量
          </p>
          <p className="mt-2 text-lg font-bold tracking-tight text-slate-950">{count}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Wallet size={13} />
            账单总额
          </p>
          <p className="mt-2 text-lg font-bold tracking-tight text-slate-950">
            {currency.format(totalAmount)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <TrendingDown size={13} />
            未结金额
          </p>
          <p className="mt-2 text-lg font-bold tracking-tight text-red-600">
            {currency.format(totalOutstanding)}
          </p>
        </div>
      </div>
    </section>
  )
}
