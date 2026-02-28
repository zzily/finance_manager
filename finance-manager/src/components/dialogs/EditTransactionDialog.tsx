import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ErrorBox } from "../common"
import type { Transaction, TransactionUpdate } from "../../types"

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  transaction: Transaction | null
  isPending: boolean
  onSubmit: (id: number, form: TransactionUpdate) => void
}) {
  const [form, setForm] = useState<TransactionUpdate>({ title: "", amount_out: 0, category: "work" })
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(v: boolean) {
    if (v && transaction) {
      setForm({ title: transaction.title, amount_out: transaction.amount_out, category: transaction.category })
      setError(null)
    }
    onOpenChange(v)
  }

  function handleSubmit() {
    if (!transaction) return
    if (!form.title.trim()) { setError("请输入账单标题"); return }
    const n = Number(form.amount_out)
    if (isNaN(n) || n <= 0) { setError("请输入有效的账单金额"); return }
    setError(null)
    onSubmit(transaction.id, { title: form.title.trim(), amount_out: n, category: form.category })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑账单</DialogTitle>
          <DialogDescription>修改标题、金额或分类</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">标题</label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="例如：给车加油" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">金额</label>
            <Input type="number" min="0" step="0.01" value={form.amount_out || ""} onChange={(e) => setForm((p) => ({ ...p, amount_out: Number(e.target.value) }))} placeholder="请输入账单金额" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">分类</label>
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as TransactionUpdate["category"] }))}>
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
    </Dialog>
  )
}
