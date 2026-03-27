import { Search, X } from "lucide-react"

import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"
import type {
  TransactionFilterState,
  TransactionSort,
} from "../../hooks/useTransactionFilters"

const nativeSelectClassName =
  "h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"

const statusOptions: Array<{ label: string; value: TransactionFilterState["status"] }> = [
  { value: "all", label: "全部状态" },
  { value: "pending", label: "待核销" },
  { value: "partially_settled", label: "部分核销" },
  { value: "settled", label: "已结清" },
]

const categoryOptions: Array<{ label: string; value: TransactionFilterState["category"] }> = [
  { value: "all", label: "全部分类" },
  { value: "work", label: "工作垫付" },
  { value: "personal", label: "个人支出" },
]

const sortLabels: Record<TransactionSort, string> = {
  latest: "最新优先",
  oldest: "最早优先",
  amount_desc: "金额从高到低",
  amount_asc: "金额从低到高",
  debt_desc: "欠款从高到低",
}

export function TransactionFiltersBar({
  availableMonths,
  hasActiveFilters,
  onCategoryChange,
  onMonthChange,
  onQueryChange,
  onReset,
  onSortChange,
  onStatusChange,
  state,
}: {
  availableMonths: string[]
  hasActiveFilters: boolean
  onCategoryChange: (category: TransactionFilterState["category"]) => void
  onMonthChange: (month: string) => void
  onQueryChange: (query: string) => void
  onReset: () => void
  onSortChange: (sort: TransactionSort) => void
  onStatusChange: (status: TransactionFilterState["status"]) => void
  state: TransactionFilterState
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_auto_auto]">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={state.query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="pl-9"
            placeholder="搜索标题，比如：差旅、办公、房租"
          />
        </div>

        <select
          className={nativeSelectClassName}
          value={state.month}
          onChange={(event) => onMonthChange(event.target.value)}
        >
          <option value="all">全部月份</option>
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <select
          className={nativeSelectClassName}
          value={state.sort}
          onChange={(event) => onSortChange(event.target.value as TransactionSort)}
        >
          {Object.entries(sortLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatusChange(option.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              state.status === option.value
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onCategoryChange(option.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                state.category === option.value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X size={14} />
            清空筛选
          </Button>
        )}
      </div>
    </section>
  )
}
