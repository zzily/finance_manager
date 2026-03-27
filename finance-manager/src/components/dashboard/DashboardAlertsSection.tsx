import { AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"

import { Button } from "../ui/button"
import { Skeleton } from "../ui/skeleton"
import { cn } from "../../lib/utils"
import type { AppView } from "../../layouts/appShell.types"

export type DashboardAlert = {
  actionLabel: string
  description: string
  id: string
  title: string
  tone: "info" | "success" | "warning"
  view: AppView
}

const toneStyles: Record<DashboardAlert["tone"], string> = {
  info: "border-sky-200 bg-sky-50/90 text-sky-700",
  success: "border-emerald-200 bg-emerald-50/90 text-emerald-700",
  warning: "border-amber-200 bg-amber-50/90 text-amber-700",
}

const toneIcons = {
  info: Sparkles,
  success: CheckCircle2,
  warning: AlertTriangle,
} satisfies Record<DashboardAlert["tone"], typeof Sparkles>

export function DashboardAlertsSection({
  alerts,
  isLoading,
  onNavigate,
}: {
  alerts: DashboardAlert[]
  isLoading: boolean
  onNavigate: (view: AppView) => void
}) {
  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="mt-4 h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-5 h-9 w-28" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Alerts
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
            本周最值得优先处理的动作
          </h2>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
          {alerts.length > 0 ? `${alerts.length} 条提醒` : "状态平稳"}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-emerald-900">当前没有紧急提醒</h3>
              <p className="mt-1 text-sm text-emerald-700">
                账单、回款和可分配资金都比较平稳，可以继续录入新记录或前往复盘页查看整体趋势。
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-3">
          {alerts.map((alert) => {
            const Icon = toneIcons[alert.tone]

            return (
              <article key={alert.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
                <div
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl border",
                    toneStyles[alert.tone],
                  )}
                >
                  <Icon size={18} />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-950">{alert.title}</h3>
                <p className="mt-2 min-h-[44px] text-sm leading-6 text-slate-500">
                  {alert.description}
                </p>
                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={() => onNavigate(alert.view)}
                >
                  {alert.actionLabel}
                  <ArrowRight size={14} />
                </Button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
