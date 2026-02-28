import { ArrowRightLeft } from "lucide-react"
import { currency } from "../../lib/formatters"
import { DualCardSkeleton } from "../common"
import type { SummaryData } from "../../types"

export function BusinessLoopCard({
  isLoading,
  loop,
  debt,
}: {
  isLoading: boolean
  loop?: SummaryData["financial_status"]["business_loop"]
  debt: number
}) {
  if (isLoading) return <DualCardSkeleton />
  return (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
      <div className={`absolute left-0 top-0 h-full w-1 ${debt > 0 ? "bg-red-400" : "bg-emerald-400"}`} />
      <div className="px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft size={14} className="text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">公司往来</p>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">目标：归零</p>
          </div>
          <span className={`text-xs font-semibold ${debt > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {debt > 0 ? "盯着老板要" : "已平账"}
          </span>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">垫付总额</span>
            <span className="tabular-nums font-medium text-slate-900">{currency.format(loop?.total_lent ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">报销回款</span>
            <span className="tabular-nums font-medium text-slate-900">{currency.format(loop?.total_reimbursed ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="text-slate-500">待回款</span>
            <span className={`tabular-nums text-2xl font-bold tracking-tight ${debt > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {currency.format(debt)}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">{loop?.status ?? "正在计算"}</p>
      </div>
    </div>
  )
}
