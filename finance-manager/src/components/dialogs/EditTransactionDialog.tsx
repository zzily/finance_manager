import { useState } from "react"

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
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import type { Transaction, TransactionUpdate } from "../../types"

const DEFAULT_TRANSACTION_FORM: TransactionUpdate = {
  title: "",
  amount_out: 0,
  category: "work",
}

function createTransactionForm(transaction: Transaction | null): TransactionUpdate {
  if (!transaction) {
    return { ...DEFAULT_TRANSACTION_FORM }
  }
  return {
    title: transaction.title,
    amount_out: transaction.amount_out,
    category: transaction.category,
  }
}

function EditTransactionDialogBody({
  isPending,
  onOpenChange,
  onSubmit,
  transaction,
}: {
  isPending: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (id: number, form: TransactionUpdate) => void
  transaction: Transaction | null
}) {
  const [form, setForm] = useState<TransactionUpdate>(() => createTransactionForm(transaction))
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!transaction) return
    if (!form.title.trim()) { setError("请输入账单标题"); return }
    const amount = Number(form.amount_out)
    if (Number.isNaN(amount) || amount <= 0) { setError("请输入有效的账单金额"); return }
    setError(null)
    onSubmit(transaction.id, { title: form.title.trim(), amount_out: amount, category: form.category })
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>编辑账单</DialogTitle>
        <DialogDescription>修改标题、金额或分类</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">标题</label>
          <Input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="例如：给车加油"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">金额</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.amount_out || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, amount_out: Number(e.target.value) }))}
            placeholder="请输入账单金额"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">分类</label>
          <Select
            value={form.category}
            onValueChange={(value) => {
              setForm((prev) => ({ ...prev, category: value as TransactionUpdate["category"] }))
            }}
          >
            <SelectTrigger><SelectValue placeholder="请选择分类" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="work">工作</SelectItem>
              <SelectItem value="personal">个人</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && <ErrorBox msg={error} />}
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>取消</Button>
        <Button onClick={handleSubmit} disabled={isPending}>{isPending ? "保存中..." : "保存修改"}</Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  transaction: Transaction | null
  isPending: boolean
  onSubmit: (id: number, form: TransactionUpdate) => void
}) {
  const dialogKey = `${transaction?.id ?? "empty"}:${open ? "open" : "closed"}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditTransactionDialogBody
        key={dialogKey}
        transaction={transaction}
        isPending={isPending}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    </Dialog>
  )
}
