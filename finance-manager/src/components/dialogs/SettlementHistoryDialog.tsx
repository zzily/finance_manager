import { useState } from "react"
import { History, Undo2, Loader2, AlertTriangle } from "lucide-react"
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
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <AlertTriangle size={15} />
        确认撤销这笔核销？
      </div>
      <p className="text-xs text-amber-700">
        将退回 <span className="font-bold">{currency.format(record.amount)}</span> 至资金池（来源：
        {record.salary_month} {SOURCE_LABEL[record.salary_source] ?? record.salary_source}），
        账单欠款将相应增加。
      </p>
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending}
          onClick={onConfirm}
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          确认撤销
        </Button>
        <Button size="sm" variant="ghost" disabled={isPending} onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
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
            <div className="flex items-center justify-center py-10 text-sm text-slate-400">
              <Loader2 size={16} className="mr-2 animate-spin" />
              加载中...
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="py-10 text-center text-sm text-red-500">
              无法加载核销记录，请稍后重试
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && records.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-400">
              暂无核销记录
            </div>
          )}

          {/* Records */}
          {records.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      {currency.format(r.amount)}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {SOURCE_LABEL[r.salary_source] ?? r.salary_source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    来源：{r.salary_month} · {formatDate(r.created_at)}
                  </p>
                </div>
                {confirmId !== r.id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                    onClick={() => setConfirmId(r.id)}
                  >
                    <Undo2 size={13} />
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
