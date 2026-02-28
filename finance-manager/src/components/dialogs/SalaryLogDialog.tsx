import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { MonthPicker } from "../ui/month-picker"
import { ErrorBox } from "../common"
import type { SalaryLogCreate } from "../../types"

export function SalaryLogDialog({
  open,
  onOpenChange,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  isPending: boolean
  onSubmit: (form: SalaryLogCreate) => void
}) {
  const [form, setForm] = useState<SalaryLogCreate>({ amount: 0, month: "", source: "salary", remark: "" })
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(v: boolean) {
    if (v) {
      setForm({ amount: 0, month: "", source: "salary", remark: "" })
      setError(null)
    }
    onOpenChange(v)
  }

  function handleSubmit() {
    const n = Number(form.amount)
    if (isNaN(n) || n <= 0) { setError("请输入有效的回款金额"); return }
    if (!form.month) { setError("请选择回款月份"); return }
    setError(null)
    onSubmit({ ...form, amount: n, remark: form.remark?.trim() || null })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>录入回款</DialogTitle>
          <DialogDescription>新增一笔回款进入资金池</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">金额</label>
            <Input type="number" min="0" step="0.01" value={form.amount || ""} onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))} placeholder="例如：5000" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">回款月份</label>
            <MonthPicker value={form.month} onChange={(v) => setForm((p) => ({ ...p, month: v }))} placeholder="选择回款月份" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">来源</label>
            <Select value={form.source} onValueChange={(v) => setForm((p) => ({ ...p, source: v as SalaryLogCreate["source"] }))}>
              <SelectTrigger><SelectValue placeholder="请选择来源" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">工资</SelectItem>
                <SelectItem value="reimbursement">报销</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">备注</label>
            <Input value={form.remark ?? ""} onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))} placeholder="例如：收到工资转账" />
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
