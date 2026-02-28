import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ErrorBox } from "../common"
import { currency } from "../../lib/formatters"
import type { Transaction, SalaryLog } from "../../types"

export function SettleDialog({
  open,
  onOpenChange,
  transaction,
  availableLogs,
  isLoadingLogs,
  isErrorLogs,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  transaction: Transaction | null
  availableLogs: SalaryLog[]
  isLoadingLogs: boolean
  isErrorLogs: boolean
  isPending: boolean
  onSubmit: (salaryLogId: number, amount: number) => void
}) {
  const [selectedSalaryId, setSelectedSalaryId] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState<string | null>(null)

  const remainingDebt = useMemo(
    () => (transaction ? transaction.amount_out - transaction.amount_reimbursed : 0),
    [transaction],
  )
  const selectedSalary = useMemo(
    () => availableLogs.find((i) => String(i.id) === selectedSalaryId),
    [availableLogs, selectedSalaryId],
  )

  function handleOpenChange(v: boolean) {
    if (v) {
      setSelectedSalaryId("")
      setAmount("")
      setError(null)
    }
    onOpenChange(v)
  }

  function handleSubmit() {
    if (!transaction) return
    if (!selectedSalaryId) { setError("请选择一笔可用的回款"); return }
    const n = Number(amount)
    if (!amount || isNaN(n) || n <= 0) { setError("请输入有效金额"); return }
    if (n > remainingDebt) { setError("核销金额不能超过未结清金额"); return }
    if (selectedSalary && n > selectedSalary.amount_unused) { setError("核销金额不能超过回款余额"); return }
    setError(null)
    onSubmit(Number(selectedSalaryId), n)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>核销账单</DialogTitle>
          <DialogDescription>选择回款并输入本次核销金额</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-500">账单</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {transaction ? `${transaction.title}  未结清 ${currency.format(remainingDebt)}` : ""}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">选择回款</label>
            <Select value={selectedSalaryId} onValueChange={setSelectedSalaryId}>
              <SelectTrigger><SelectValue placeholder="请选择可用回款" /></SelectTrigger>
              <SelectContent>
                {isLoadingLogs && <SelectItem value="loading" disabled>加载中</SelectItem>}
                {isErrorLogs && <SelectItem value="error" disabled>回款加载失败</SelectItem>}
                {!isLoadingLogs && availableLogs.length === 0 && <SelectItem value="empty" disabled>暂无可用回款</SelectItem>}
                {availableLogs.map((log) => (
                  <SelectItem key={log.id} value={String(log.id)}>
                    {`${log.month}  余额 ${currency.format(log.amount_unused)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">核销金额</label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="请输入核销金额" autoFocus />
            {selectedSalary && <p className="text-xs text-slate-400">回款余额：{currency.format(selectedSalary.amount_unused)}</p>}
          </div>
          {error && <ErrorBox msg={error} />}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>取消</Button>
          <Button onClick={handleSubmit} disabled={isPending}>{isPending ? "提交中..." : "确认核销"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
