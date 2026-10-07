import { NativeSelect } from "../ui/native-select"
import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../ui/collapsible"
import { Field, FieldLabel, FieldGroup } from "../ui/field"
import type {
  TransactionFilterState,
  TransactionSort,
} from "../../hooks/useTransactionFilters"
const statusOptions = [
  { value: "all", label: "全部" },
  { value: "open", label: "待处理" },
  { value: "pending", label: "未核销" },
  { value: "partially_settled", label: "部分核销" },
  { value: "settled", label: "已结清" },
] as const
const sorts: Record<TransactionSort, string> = {
  latest: "最新优先",
  oldest: "最早优先",
  amount_desc: "金额从高到低",
  amount_asc: "金额从低到高",
  debt_desc: "未结金额从高到低",
}
export function TransactionFiltersBar({
  availableExpenseCategories = [],
  onExpenseCategoryChange,
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
  availableExpenseCategories?: Array<[string, string]>
  onExpenseCategoryChange?: (v: string) => void
  availableMonths: string[]
  hasActiveFilters: boolean
  onCategoryChange: (v: TransactionFilterState["category"]) => void
  onMonthChange: (v: string) => void
  onQueryChange: (v: string) => void
  onReset: () => void
  onSortChange: (v: TransactionSort) => void
  onStatusChange: (v: TransactionFilterState["status"]) => void
  state: TransactionFilterState
}) {
  const [expanded, setExpanded] = useState(
    state.month !== "all" ||
      state.category !== "all" ||
      Boolean(state.expenseCategoryId && state.expenseCategoryId !== "all"),
  )
  const months = Array.from(
    new Set([
      ...availableMonths,
      ...(state.month !== "all" ? [state.month] : []),
    ]),
  )
    .sort()
    .reverse()
  return (
    <section aria-label="账单筛选" className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          aria-label="搜索账单标题"
          type="search"
          value={state.query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="搜索账单标题"
        />
        <Button
          variant="outline"
          size="icon"
          aria-label={expanded ? "收起更多筛选" : "展开更多筛选"}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <SlidersHorizontal />
        </Button>
      </div>
      <ToggleGroup
        type="single"
        value={state.status}
        onValueChange={(v) => {
          if (v) onStatusChange(v as TransactionFilterState["status"])
        }}
        aria-label="账单状态"
        className="flex flex-wrap justify-start gap-1"
      >
        {statusOptions.map((o) => (
          <ToggleGroupItem
            key={o.value}
            value={o.value}
            variant="outline"
            className="min-h-11 px-2 text-xs sm:min-h-9"
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="sr-only">更多筛选</CollapsibleTrigger>
        <CollapsibleContent>
          <FieldGroup className="gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="filter-month">月份</FieldLabel>
                <NativeSelect
                  id="filter-month"
                  value={state.month}
                  onChange={(e) => onMonthChange(e.target.value)}
                >
                  <option value="all">全部月份</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="filter-sort">排序</FieldLabel>
                <NativeSelect
                  id="filter-sort"
                  value={state.sort}
                  onChange={(e) =>
                    onSortChange(e.target.value as TransactionSort)
                  }
                >
                  {Object.entries(sorts).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
            <Field>
              <FieldLabel>账单类型</FieldLabel>
              <ToggleGroup
                type="single"
                value={state.category}
                onValueChange={(v) => {
                  if (v)
                    onCategoryChange(v as TransactionFilterState["category"])
                }}
                aria-label="账单类型"
                className="justify-start"
              >
                <ToggleGroupItem value="all">全部类型</ToggleGroupItem>
                <ToggleGroupItem value="work">工作垫付</ToggleGroupItem>
                <ToggleGroupItem value="personal">个人支出</ToggleGroupItem>
              </ToggleGroup>
            </Field>
            {onExpenseCategoryChange &&
              availableExpenseCategories.length > 0 && (
                <Field>
                  <FieldLabel htmlFor="filter-expense-category">
                    支出分类
                  </FieldLabel>
                  <NativeSelect
                    id="filter-expense-category"
                    value={state.expenseCategoryId ?? "all"}
                    onChange={(e) => onExpenseCategoryChange(e.target.value)}
                  >
                    <option value="all">全部分类</option>
                    <option value="uncategorized">未分类</option>
                    {availableExpenseCategories.map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
          </FieldGroup>
        </CollapsibleContent>
      </Collapsible>
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {state.month !== "all" ? `${state.month} · ` : ""}
            {state.category !== "all"
              ? state.category === "work"
                ? "工作垫付 · "
                : "个人支出 · "
              : ""}
            已应用筛选
          </span>
          <Button variant="ghost" size="sm" onClick={onReset}>
            清空筛选
          </Button>
        </div>
      )}
    </section>
  )
}
