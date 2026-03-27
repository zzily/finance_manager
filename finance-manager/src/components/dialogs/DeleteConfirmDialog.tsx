import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除账单</DialogTitle>
          <DialogDescription>删除后无法恢复，请确认是否删除该账单。</DialogDescription>
        </DialogHeader>
        {transaction && (
          <div className="rounded-lg border border-red-100 bg-red-50/50 px-3 py-2.5 text-sm text-slate-700">
            <span className="font-medium">{transaction.title}</span>
            <span className="ml-2 tabular-nums text-slate-500">{currency.format(transaction.amount_out)}</span>
          </div>
        )}
        {error && <ErrorBox msg={error} />}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>取消</Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="confirm-delete-transaction"
            aria-label="confirm-delete-transaction"
          >
            {isPending ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
