import { ErrorBox } from "../common"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { currency } from "../../lib/formatters"
import type { TradeRecord } from "../../types"

export function TradeDeleteDialog({
  open,
  onConfirm,
  onOpenChange,
  record,
}: {
  open: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  record: TradeRecord | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除交易记录</DialogTitle>
          <DialogDescription>删除后无法恢复，请确认是否移除这笔交易记录。</DialogDescription>
        </DialogHeader>

        {record && (
          <div className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2.5 text-sm text-slate-700">
            <span className="font-medium">{record.symbol}</span>
            <span className="ml-2 text-slate-500">{record.traded_at}</span>
            <span className="ml-2 font-medium tabular-nums">{currency.format(record.pnl)}</span>
          </div>
        )}

        <ErrorBox msg="删除后，这笔交易不会再参与统计计算。" />

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
