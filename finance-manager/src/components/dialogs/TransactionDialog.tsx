import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ErrorBox } from "../common"
import type { TransactionCreate } from "../../types"

export function TransactionDialog({
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  isPending: boolean
  onSubmit: (form: TransactionCreate) => void
}) {
  const [form, setForm] = useState<TransactionCreate>({ title: "", amount_out: 0, category: "work" })
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(v: boolean) {
    if (v) {
      setForm({ title: "", amount_out: 0, category: "work" })
      setError(null)
    }
    onOpenChange(v)
  }

  function handleSubmit() {
    const n = Number(form.amount_out)
    if (!form.title.trim()) { setError("请输入垫付标题"); return }
    if (isNaN(n) || n <= 0) { setError("请输入有效的垫付金额"); return }
    setError(null)
    onSubmit({ ...form, amount_out: n })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>记录垫付</DialogTitle>
          <DialogDescription>新增一笔垫付账单</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">标题</label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="例如：给车加油" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">金额</label>
            <Input type="number" min="0" step="0.01" value={form.amount_out || ""} onChange={(e) => setForm((p) => ({ ...p, amount_out: Number(e.target.value) }))} placeholder="请输入垫付金额" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">分类</label>
            <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v as TransactionCreate["category"] }))}>
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
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? "提交中..." : "确认录入"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
