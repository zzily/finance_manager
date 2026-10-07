import { cn } from "../../lib/utils"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"

import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { dateFormatter, currency } from "../../lib/formatters"
import type { AppNavigate } from "../../lib/navigation"

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
  onNavigate: AppNavigate
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">最近记录</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate("transactions")}
        >
          查看全部
        </Button>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-48" />
              <Skeleton className="mt-3 h-4 w-20" />
            </div>
          ))}

        {!isLoading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/80 px-4 py-8 text-center text-sm text-muted-foreground">
            还没有最近活动，先录入一笔账单或回款吧。
          </div>
        )}

        {items.map((item) => {
          const isSalary = item.kind === "salary"
          const Icon = isSalary ? ArrowDownCircle : ArrowUpCircle

          return (
            <article
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-lg p-2 transition-colors hover:bg-muted/70"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-2xl",
                    isSalary
                      ? "bg-income/10 text-income"
                      : "bg-warning/10 text-warning-foreground",
                  )}
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.meta}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dateFormatter.format(new Date(item.date))}
                  </p>
                </div>
              </div>
              <p
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  isSalary ? "text-income" : "text-foreground",
                )}
              >
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
