import { cn } from "../../lib/utils"
import { TrendingUp } from "lucide-react"
import { currency } from "../../lib/formatters"
import { DualCardSkeleton } from "../common"
import type { SummaryData } from "../../types"

export function FamilyLoopCard({
  isLoading,
  loop,
  netSavings,
  personalSpending,
}: {
  isLoading: boolean
  loop?: SummaryData["financial_status"]["family_loop"]
  netSavings: number
  personalSpending: number
}) {
  if (isLoading) return <DualCardSkeleton />
  return (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1",
          netSavings >= 0 ? "bg-income/60" : "bg-destructive/60",
        )}
      />
      <div className="px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                家庭储蓄
              </p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              目标：持续增长
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-semibold",
              netSavings >= 0 ? "text-income" : "text-destructive",
            )}
          >
            {netSavings >= 0 ? "资产增值中" : "入不敷出"}
          </span>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">工资收入</span>
            <span className="tabular-nums font-medium text-foreground">
              {currency.format(loop?.gross_income ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">个人消费</span>
            <span className="tabular-nums font-medium text-warning-foreground">
              -{currency.format(Math.abs(personalSpending))}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-muted-foreground">净储蓄</span>
            <span
              className={cn(
                "tabular-nums text-2xl font-bold tracking-tight",
                netSavings >= 0 ? "text-income" : "text-destructive",
              )}
            >
              {currency.format(netSavings)}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {loop?.status ?? "正在计算"}
        </p>
      </div>
    </div>
  )
}
