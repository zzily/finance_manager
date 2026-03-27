import { useState } from "react"

import { Loader2 } from "lucide-react"
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
import { MonthPicker } from "../ui/month-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { currency } from "../../lib/formatters"
import type { SalaryLog, SalaryLogUpdate } from "../../types"

const DEFAULT_SALARY_FORM: SalaryLogUpdate = {
  amount: 0,
  source: "salary",
  month: "",
  remark: "",
}

function createSalaryLogForm(salaryLog: SalaryLog | null): SalaryLogUpdate {
  if (!salaryLog) {
    return { ...DEFAULT_SALARY_FORM }
  }
  return {
    amount: salaryLog.amount,
    source: salaryLog.source,
    month: salaryLog.month,
    remark: salaryLog.remark ?? "",
    received_date: salaryLog.received_date,
  }
}

function EditSalaryLogDialogBody({
  isPending,
  onOpenChange,
  onSubmit,
  salaryLog,
}: {
  isPending: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (id: number, payload: SalaryLogUpdate) => void
  salaryLog: SalaryLog | null
}) {
  const [form, setForm] = useState<SalaryLogUpdate>(() => createSalaryLogForm(salaryLog))
  const [error, setError] = useState<string | null>(null)

  const amountUsed = salaryLog ? salaryLog.amount - salaryLog.amount_unused : 0

  function handleSubmit() {
    if (!salaryLog) return
    const amount = Number(form.amount)
    if (Number.isNaN(amount) || amount <= 0) { setError("请输入有效金额"); return }
    if (amount < amountUsed) {
      setError(`金额不能低于已核销的 ${currency.format(amountUsed)}`)
      return
    }
    if (!form.month.trim()) { setError("请选择归属月份"); return }
    setError(null)
    onSubmit(salaryLog.id, { ...form, amount })
  }

  return (
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
            onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
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
            onValueChange={(value) => {
              setForm((prev) => ({ ...prev, source: value as SalaryLogUpdate["source"] }))
            }}
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
            onChange={(value) => setForm((prev) => ({ ...prev, month: value }))}
            placeholder="选择归属月份"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">备注</label>
          <Input
            value={form.remark ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, remark: e.target.value }))}
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
  )
}

export function EditSalaryLogDialog({
  open,
  onOpenChange,
  salaryLog,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  salaryLog: SalaryLog | null
  isPending: boolean
  onSubmit: (id: number, payload: SalaryLogUpdate) => void
}) {
  const dialogKey = `${salaryLog?.id ?? "empty"}:${open ? "open" : "closed"}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditSalaryLogDialogBody
        key={dialogKey}
        salaryLog={salaryLog}
        isPending={isPending}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    </Dialog>
  )
}
