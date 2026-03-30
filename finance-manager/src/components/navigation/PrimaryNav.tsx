import {
  BarChart3,
  LayoutDashboard,
  ReceiptText,
  Sparkles,
  TrendingUp,
} from "lucide-react"

import { cn } from "../../lib/utils"
import type { AppView } from "../../layouts/appShell.types"

const NAV_ITEMS: Array<{
  description: string
  icon: typeof LayoutDashboard
  label: string
  view: AppView
}> = [
  {
    view: "dashboard",
    label: "首页总览",
    description: "看状态与提醒",
    icon: LayoutDashboard,
  },
  {
    view: "transactions",
    label: "账单中心",
    description: "筛选、编辑、追踪",
    icon: ReceiptText,
  },
  {
    view: "workbench",
    label: "核销工作台",
    description: "更快完成核销",
    icon: Sparkles,
  },
  {
    view: "review",
    label: "复盘洞察",
    description: "看趋势与总结",
    icon: BarChart3,
  },
  {
    view: "trading",
    label: "交易日志",
    description: "统计、编辑、复盘",
    icon: TrendingUp,
  },
]

export function PrimaryNav({
  activeView,
  onViewChange,
}: {
  activeView: AppView
  onViewChange: (view: AppView) => void
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = item.view === activeView

        return (
          <button
            key={item.view}
            type="button"
            onClick={() => onViewChange(item.view)}
            className={cn(
              "group min-w-[150px] rounded-2xl border px-4 py-3 text-left transition-all duration-200",
              isActive
                ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10"
                : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                )}
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <p className={cn("text-sm font-semibold", isActive ? "text-white" : "text-slate-900")}>
                  {item.label}
                </p>
                <p className={cn("text-xs", isActive ? "text-slate-300" : "text-slate-400")}>
                  {item.description}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </nav>
  )
}
