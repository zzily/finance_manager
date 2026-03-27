import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"

import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { dateFormatter, currency } from "../../lib/formatters"
import type { AppView } from "../../layouts/appShell.types"

export type ActivityItem = {
  amount: number
  date: string
  id: string
  kind: "salary" | "transaction"
  meta: string
  title: string
}

export function RecentActivityFeed({
  items,
  isLoading,
  onNavigate,
}: {
  items: ActivityItem[]
  isLoading: boolean
  onNavigate: (view: AppView) => void
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Activity
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            最近记录
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate("transactions")}>
          查看全部
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading && Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-100 p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
            <Skeleton className="mt-3 h-4 w-20" />
          </div>
        ))}

        {!isLoading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
            还没有最近活动，先录入一笔账单或回款吧。
          </div>
        )}

        {items.map((item) => {
          const isSalary = item.kind === "salary"
          const Icon = isSalary ? ArrowDownCircle : ArrowUpCircle

          return (
            <article
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 p-4 transition-colors hover:bg-slate-50/70"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                    isSalary
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {dateFormatter.format(new Date(item.date))}
                  </p>
                </div>
              </div>
              <p className={`shrink-0 text-sm font-semibold tabular-nums ${
                isSalary ? "text-emerald-600" : "text-slate-900"
              }`}>
                {isSalary ? "+" : "-"}
                {currency.format(item.amount)}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
