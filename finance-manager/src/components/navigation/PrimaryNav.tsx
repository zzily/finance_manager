import { BarChart3, LayoutDashboard, ReceiptText, Sparkles, TrendingUp } from "lucide-react"
import { cn } from "../../lib/utils"
import type { AppView } from "../../layouts/appShell.types"
const items = [
  { view: "dashboard", label: "总览", icon: LayoutDashboard },
  { view: "transactions", label: "账单", icon: ReceiptText },
  { view: "workbench", label: "核销", icon: Sparkles },
  { view: "review", label: "复盘", icon: BarChart3 },
  { view: "trading", label: "交易", icon: TrendingUp },
] as const
export function PrimaryNav({
  activeView,
  onViewChange,
}: {
  activeView: AppView
  onViewChange: (view: AppView) => void
}) {
  return (
    <nav
      aria-label="主要导航"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] sm:static sm:flex sm:gap-1 sm:border-0 sm:pb-0"
    >
      {items.map((item) => (
        <button
          key={item.view}
          type="button"
          aria-current={activeView === item.view ? "page" : undefined}
          onClick={() => onViewChange(item.view)}
          className={cn(
            "flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-10 sm:flex-row sm:gap-2 sm:rounded-md sm:px-3 sm:text-sm",
            activeView === item.view
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          <item.icon className="size-5 sm:size-4" aria-hidden="true" />
          {item.label}
        </button>
      ))}
    </nav>
  )
}
