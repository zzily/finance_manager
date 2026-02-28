import { TrendingUp, PiggyBank, ChevronRight } from "lucide-react"
import { currency } from "../../lib/formatters"
import { CardSkeleton } from "../common"

export function BalanceCard({
  isLoading,
  balance,
  onClick,
}: {
  isLoading: boolean
  balance: number
  onClick: () => void
}) {
  if (isLoading) return <CardSkeleton />
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-slate-950" />
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} className="text-slate-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">资金池余额</p>
        </div>
        <p className="mt-0.5 text-xs text-slate-400">可用于核销的未分配回款</p>
        <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-slate-950">
          {currency.format(balance)}
        </p>
        <p className="mt-3 flex items-center gap-0.5 text-xs text-slate-400 transition-colors group-hover:text-slate-600">
          查看资金池明细
          <ChevronRight size={11} className="transition-transform group-hover:translate-x-0.5" />
        </p>
      </div>
    </div>
  )
}

export function TotalAssetsCard({
  isLoading,
  totalAssets,
}: {
  isLoading: boolean
  totalAssets: number
}) {
  if (isLoading) return <CardSkeleton />
  return (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
      <div className="absolute left-0 top-0 h-full w-1 bg-slate-300" />
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <PiggyBank size={14} className="text-slate-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">总资产</p>
        </div>
        <p className="mt-0.5 text-xs text-slate-400">现金 + 待回款</p>
        <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-slate-950">
          {currency.format(totalAssets)}
        </p>
      </div>
    </div>
  )
}
