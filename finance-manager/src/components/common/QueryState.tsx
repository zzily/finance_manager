import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Button } from "../ui/button"

export function QueryError({
  title = "暂时无法获取数据",
  hasData = false,
  onRetry,
  isFetching = false,
}: {
  title?: string
  hasData?: boolean
  onRetry: () => void
  isFetching?: boolean
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {hasData
            ? "当前显示上次成功获取的数据，请刷新后再核对。"
            : "数据尚未成功获取，请检查连接后重试。"}
        </span>
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isFetching}>
          <RefreshCw data-icon="inline-start" aria-hidden="true" />
          {isFetching ? "重试中…" : "重试"}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function DataUpdated({ timestamp }: { timestamp: number }) {
  if (!timestamp) return null
  return (
    <p className="text-xs text-muted-foreground">
      数据更新于{" "}
      {new Intl.DateTimeFormat("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(timestamp)}
    </p>
  )
}
