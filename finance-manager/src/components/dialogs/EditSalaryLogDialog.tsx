import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { MonthPicker } from "../ui/month-picker"
import { ErrorBox } from "../common"
import { currency } from "../../lib/formatters"
import type { SalaryLog, SalaryLogUpdate } from "../../types"

export function EditSalaryLogDialog({
  open,
  onOpenChange,
  salaryLog,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  salaryLog: SalaryLog | null
  isPending: boolean
  onSubmit: (id: number, payload: SalaryLogUpdate) => void
}) {
  const [form, setForm] = useState<SalaryLogUpdate>({
    amount: 0,
    source: "salary",
    month: "",
    remark: "",
  })
  const [error, setError] = useState<string | null>(null)

  /* Pre-fill form when dialog opens */
  useEffect(() => {
    if (open && salaryLog) {
      setForm({
        amount: salaryLog.amount,
        source: salaryLog.source,
        month: salaryLog.month,
        remark: salaryLog.remark ?? "",
        received_date: salaryLog.received_date,
      })
      setError(null)
    }
  }, [open, salaryLog])

  const amountUsed = salaryLog ? salaryLog.amount - salaryLog.amount_unused : 0

  function handleSubmit() {
    if (!salaryLog) return
    const n = Number(form.amount)
    if (isNaN(n) || n <= 0) { setError("请输入有效金额"); return }
    if (n < amountUsed) {
      setError(`金额不能低于已核销的 ${currency.format(amountUsed)}`)
      return
    }
    if (!form.month.trim()) { setError("请选择归属月份"); return }
    setError(null)
    onSubmit(salaryLog.id, { ...form, amount: n })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑回款记录</DialogTitle>
          <DialogDescription>
            {salaryLog && amountUsed > 0
              ? `该笔资金已核销 ${currency.format(amountUsed)}，金额不可低于此值`
              : "修改回款金额、来源或归属月份"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">金额</label>
            <Input
              type="number"
              min={amountUsed}
              step="0.01"
              value={form.amount || ""}
              onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
              placeholder="请输入回款金额"
              autoFocus
            />
            {amountUsed > 0 && (
              <p className="text-[11px] text-amber-600">
                已核销 {currency.format(amountUsed)}，最低不能小于此值
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">来源</label>
            <Select
              value={form.source}
              onValueChange={(v) => setForm((p) => ({ ...p, source: v as SalaryLogUpdate["source"] }))}
            >
              <SelectTrigger><SelectValue placeholder="请选择来源" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">工资</SelectItem>
                <SelectItem value="reimbursement">报销</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">归属月份</label>
            <MonthPicker
              value={form.month}
              onChange={(v) => setForm((p) => ({ ...p, month: v }))}
              placeholder="选择归属月份"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">备注</label>
            <Input
              value={form.remark ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
              placeholder="可选备注"
            />
          </div>
          {error && <ErrorBox msg={error} />}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>取消</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {isPending ? "保存中..." : "保存修改"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
