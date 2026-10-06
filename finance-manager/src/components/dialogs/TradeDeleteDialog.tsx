import { Button } from "../ui/button"
import {
  AlertDialog as Dialog,
  AlertDialogContent as DialogContent,
  AlertDialogCancel as DialogCancel,
  AlertDialogDescription as DialogDescription,
  AlertDialogFooter as DialogFooter,
  AlertDialogHeader as DialogHeader,
  AlertDialogTitle as DialogTitle,
} from "../ui/alert-dialog"
import { currency } from "../../lib/formatters"
import type { TradeRecord } from "../../types"

export function TradeDeleteDialog({
  open,
  onConfirm,
  onOpenChange,
  record,
  isPending,
}: {
  open: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  record: TradeRecord | null
  isPending: boolean
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) onOpenChange(v)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除交易记录</DialogTitle>
          <DialogDescription>删除后无法恢复，请确认是否移除这笔交易记录。</DialogDescription>
        </DialogHeader>

        {record && (
          <div className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2.5 text-sm text-foreground">
            <span className="font-medium">{record.symbol}</span>
            <span className="ml-2 text-muted-foreground">{record.traded_at}</span>
            <span className="ml-2 font-medium tabular-nums">{currency.format(record.pnl)}</span>
          </div>
        )}

        <p className="text-sm text-muted-foreground">删除后，这笔交易不会再参与统计计算。</p>

        <DialogFooter>
          <DialogCancel asChild>
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
              取消
            </Button>
          </DialogCancel>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
