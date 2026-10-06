import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "../ui/alert"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Skeleton } from "../ui/skeleton"
import type { AppView } from "../../layouts/appShell.types"
import type { AppNavigate, NavigationParams } from "../../lib/navigation"
export type DashboardAlert = {
  actionLabel: string
  description: string
  id: string
  title: string
  tone: "info" | "success" | "warning"
  view: AppView
  params?: NavigationParams
}
export function DashboardAlertsSection({
  alerts,
  isLoading,
  onNavigate,
}: {
  alerts: DashboardAlert[]
  isLoading: boolean
  onNavigate: AppNavigate
}) {
  if (isLoading) return <Skeleton className="h-24 w-full" />
  const actionable = alerts.filter((a) => a.tone !== "success")
  if (!actionable.length)
    return (
      <Alert>
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>当前没有待办提醒</AlertTitle>
        <AlertDescription>可继续记账或查看月度复盘。</AlertDescription>
      </Alert>
    )
  const primary = actionable.find((a) => a.id === "aged-transactions") ?? actionable[0]
  const remaining = actionable.filter((a) => a.id !== primary.id)
  return (
    <section aria-label="待办提醒" className="flex flex-col gap-2">
      {[primary].map((a) => (
        <Alert key={a.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                <Badge variant={a.tone === "warning" ? "warning" : "info"}>提醒</Badge>
                {a.title}
              </AlertTitle>
              <AlertDescription>{a.description}</AlertDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate(a.view, a.params)}>
              {a.actionLabel}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          {remaining.length > 0 && (
            <details className="mt-3 border-t pt-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                其他提醒（{remaining.length}）
              </summary>
              <div className="mt-2 flex flex-col gap-2">
                {remaining.map((other) => (
                  <div key={other.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm">{other.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate(other.view, other.params)}
                    >
                      {other.actionLabel}
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </Alert>
      ))}
    </section>
  )
}
