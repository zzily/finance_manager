import {
  AlertDialog as Dialog,
  AlertDialogContent as DialogContent,
  AlertDialogCancel as DialogCancel,
  AlertDialogDescription as DialogDescription,
  AlertDialogFooter as DialogFooter,
  AlertDialogHeader as DialogHeader,
  AlertDialogTitle as DialogTitle,
} from "../ui/alert-dialog"
import { Button } from "../ui/button"
import { ErrorBox } from "../common"
import { currency } from "../../lib/formatters"
import type { Transaction } from "../../types"

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  transaction,
  isPending,
  error,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  transaction: Transaction | null
  isPending: boolean
  error: string | null
  onConfirm: () => void
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
          <DialogTitle>删除账单</DialogTitle>
          <DialogDescription>
            删除后无法恢复，请确认是否删除该账单。
          </DialogDescription>
        </DialogHeader>
        {transaction && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/50 px-3 py-2.5 text-sm text-foreground">
            <span className="font-medium">{transaction.title}</span>
            <span className="ml-2 tabular-nums text-muted-foreground">
              {currency.format(transaction.amount_out)}
            </span>
          </div>
        )}
        {error && <ErrorBox msg={error} />}
        <DialogFooter>
          <DialogCancel asChild>
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              取消
            </Button>
          </DialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="confirm-delete-transaction"
            aria-label="确认删除账单"
          >
            {isPending ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
