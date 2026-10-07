import { Alert, AlertTitle, AlertDescription } from "../ui/alert"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "../ui/empty"
import { Badge } from "../ui/badge"
import { Spinner } from "../ui/spinner"
import { useState } from "react"
import { History, Undo2, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { currency } from "../../lib/formatters"
import { useSettlements } from "../../hooks/useSettlements"
import type { Transaction, SettlementDetail } from "../../types"

const SOURCE_LABEL: Record<string, string> = {
  salary: "工资",
  reimbursement: "报销",
  other: "其他",
}

function formatDate(iso: string | null) {
  if (!iso) return "-"
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function UndoConfirm({
  record,
  isPending,
  onConfirm,
  onCancel,
}: {
  record: SettlementDetail
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Alert variant="warning">
      <AlertTriangle aria-hidden="true" />
      <AlertTitle>确认撤销这笔核销？</AlertTitle>
      <AlertDescription>
        将退回{" "}
        <span className="font-bold">{currency.format(record.amount)}</span>{" "}
        至资金池（来源：
        {record.salary_month}{" "}
        {SOURCE_LABEL[record.salary_source] ?? record.salary_source}），
        账单欠款将相应增加。
      </AlertDescription>
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={onConfirm}
        >
          {isPending && <Spinner />}
          确认撤销
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={onCancel}
        >
          取消
        </Button>
      </div>
    </Alert>
  )
}

export function SettlementHistoryDialog({
  open,
  onOpenChange,
  transaction,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  transaction: Transaction | null
}) {
  const { records, isLoading, isError, undo } = useSettlements(
    open && transaction ? transaction.id : null,
  )
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const handleUndo = (id: number) => {
    undo.mutate(id, {
      onSuccess: () => setConfirmId(null),
    })
  }

  const totalSettled = records.reduce((s, r) => s + r.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History size={18} />
            核销记录
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? `「${transaction.title}」的核销明细 · 已还 ${currency.format(totalSettled)}`
              : "加载中..."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Spinner />
              加载中...
            </div>
          )}

          {/* Error */}
          {isError && (
            <Alert variant="destructive">
              <AlertTitle>无法加载核销记录</AlertTitle>
              <AlertDescription>请稍后重试。</AlertDescription>
            </Alert>
          )}

          {/* Empty */}
          {!isLoading && !isError && records.length === 0 && (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>暂无核销记录</EmptyTitle>
                <EmptyDescription>
                  关联收入核销后，可在这里查看明细。
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {/* Records */}
          {records.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-border bg-muted/50 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {currency.format(r.amount)}
                    </span>
                    <Badge variant="secondary">
                      {SOURCE_LABEL[r.salary_source] ?? r.salary_source}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    来源：{r.salary_month} · {formatDate(r.created_at)}
                  </p>
                </div>
                {confirmId !== r.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmId(r.id)}
                  >
                    <Undo2 data-icon="inline-start" />
                    撤销
                  </Button>
                )}
              </div>

              {confirmId === r.id && (
                <UndoConfirm
                  record={r}
                  isPending={undo.isPending}
                  onConfirm={() => handleUndo(r.id)}
                  onCancel={() => setConfirmId(null)}
                />
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
