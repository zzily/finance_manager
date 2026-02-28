import { TrendingDown, Wallet } from "lucide-react"
import { Skeleton } from "../ui/skeleton"
import { currency } from "../../lib/formatters"

export function OperationBar({
  isLoading,
  billsPending,
  availableBalance,
  actionNeeded,
}: {
  isLoading: boolean
  billsPending: number
  availableBalance: number
  actionNeeded: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-card sm:flex-row sm:items-center sm:gap-6 sm:px-5 sm:py-3.5">
      <div className="flex flex-1 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingDown size={15} className="text-amber-500" />
          <span className="text-sm text-slate-500">待核销账单</span>
        </div>
        <span className="tabular-nums text-sm font-semibold text-slate-900">
          {isLoading ? <Skeleton className="inline-block h-4 w-20" /> : currency.format(billsPending)}
        </span>
      </div>
      <div className="hidden h-6 w-px bg-slate-200 sm:block" />
      <div className="border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 flex flex-1 items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet size={15} className="text-slate-400" />
          <span className="text-sm text-slate-500">未分配现金</span>
        </div>
        <span className="tabular-nums text-sm font-semibold text-slate-900">
          {isLoading ? <Skeleton className="inline-block h-4 w-20" /> : currency.format(availableBalance)}
        </span>
      </div>
      <div className="hidden h-6 w-px bg-slate-200 sm:block" />
      <p className="border-t border-slate-100 pt-3 text-xs text-slate-400 sm:max-w-[200px] sm:border-t-0 sm:pt-0 sm:text-right">
        {actionNeeded}
      </p>
    </div>
  )
}
