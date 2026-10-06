import { currency } from "../../lib/formatters"
export function TransactionResultToolbar({
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
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap gap-x-4 gap-y-1 border-y py-3 text-xs text-muted-foreground"
    >
      <span>
        {hasActiveFilters ? "筛选结果" : "全部记录"}：
        <strong className="text-foreground">{count} 笔</strong>
      </span>
      <span>总额 {currency.format(totalAmount)}</span>
      <span>
        未结 <strong className="text-expense">{currency.format(totalOutstanding)}</strong>
      </span>
    </div>
  )
}
