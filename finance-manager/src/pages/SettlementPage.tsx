import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import type { SalaryLog, SettleRequest, Transaction } from "../types"
import { Button } from "../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"

const currency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 2,
})

async function fetchTransactions() {
  const response = await api.get<Transaction[]>("/transactions/", {
    params: { unpaid_only: true },
  })
  return response.data
}

async function fetchSalaryLogs() {
  const response = await api.get<SalaryLog[]>("/salary_logs/", {
    params: { available_only: true },
  })
  return response.data
}

async function settleDebt(payload: SettleRequest) {
  const response = await api.post("/settle", payload)
  return response.data
}

export default function SettlementPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedSalaryId, setSelectedSalaryId] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [formError, setFormError] = useState<string | null>(null)

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  })

  const salaryLogsQuery = useQuery({
    queryKey: ["salary_logs"],
    queryFn: fetchSalaryLogs,
  })

  const settleMutation = useMutation({
    mutationFn: settleDebt,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["salary_logs"] }),
      ])
      setOpen(false)
    },
    onError: (error) => {
      if (typeof error === "object" && error && "response" in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } }
        setFormError(axiosError.response?.data?.detail ?? "核销失败，请稍后重试")
        return
      }
      setFormError("核销失败，请稍后重试")
    },
  })

  const unsettledTransactions = useMemo(() => {
    const list = transactionsQuery.data ?? []
    return list.filter((item) => item.amount_out - item.amount_reimbursed > 0)
  }, [transactionsQuery.data])

  const availableSalaryLogs = useMemo(() => {
    const list = salaryLogsQuery.data ?? []
    return list.filter((item) => item.amount_unused > 0)
  }, [salaryLogsQuery.data])

  const selectedSalary = useMemo(() => {
    return availableSalaryLogs.find((item) => String(item.id) === selectedSalaryId)
  }, [availableSalaryLogs, selectedSalaryId])

  const remainingDebt = useMemo(() => {
    if (!selectedTransaction) return 0
    return selectedTransaction.amount_out - selectedTransaction.amount_reimbursed
  }, [selectedTransaction])

  function openDialog(transaction: Transaction) {
    setSelectedTransaction(transaction)
    setSelectedSalaryId("")
    setAmount("")
    setFormError(null)
    setOpen(true)
  }

  function handleSubmit() {
    if (!selectedTransaction) return
    if (!selectedSalaryId) {
      setFormError("请选择一笔可用的回款")
      return
    }
    const numericAmount = Number(amount)
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFormError("请输入有效金额")
      return
    }
    if (numericAmount > remainingDebt) {
      setFormError("核销金额不能超过未结清金额")
      return
    }
    if (selectedSalary && numericAmount > selectedSalary.amount_unused) {
      setFormError("核销金额不能超过回款余额")
      return
    }
    setFormError(null)
    settleMutation.mutate({
      transaction_id: selectedTransaction.id,
      salary_log_id: Number(selectedSalaryId),
      amount: numericAmount,
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">核销页面</h1>
          <p className="text-sm text-slate-500">请选择未结清账单进行核销操作</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>账单金额</TableHead>
                <TableHead>已还</TableHead>
                <TableHead>未结清</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    加载中...
                  </TableCell>
                </TableRow>
              )}
              {transactionsQuery.isError && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-red-600">
                    无法加载账单，请稍后重试
                  </TableCell>
                </TableRow>
              )}
              {!transactionsQuery.isLoading && unsettledTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    暂无未结清账单
                  </TableCell>
                </TableRow>
              )}
              {unsettledTransactions.map((item) => {
                const due = item.amount_out - item.amount_reimbursed
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-slate-900">
                      {item.title}
                    </TableCell>
                    <TableCell>{currency.format(item.amount_out)}</TableCell>
                    <TableCell>{currency.format(item.amount_reimbursed)}</TableCell>
                    <TableCell>{currency.format(due)}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => openDialog(item)}>核销</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>核销账单</DialogTitle>
            <DialogDescription>
              选择回款并输入本次核销金额
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-500">账单</p>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {selectedTransaction
                  ? `${selectedTransaction.title} · 未结清 ${currency.format(remainingDebt)}`
                  : ""}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-500">选择回款</label>
              <Select value={selectedSalaryId} onValueChange={setSelectedSalaryId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择可用回款" />
                </SelectTrigger>
                <SelectContent>
                  {salaryLogsQuery.isLoading && (
                    <SelectItem value="loading" disabled>
                      加载中...
                    </SelectItem>
                  )}
                  {salaryLogsQuery.isError && (
                    <SelectItem value="error" disabled>
                      回款加载失败
                    </SelectItem>
                  )}
                  {!salaryLogsQuery.isLoading && availableSalaryLogs.length === 0 && (
                    <SelectItem value="empty" disabled>
                      暂无可用回款
                    </SelectItem>
                  )}
                  {availableSalaryLogs.map((log) => (
                    <SelectItem key={log.id} value={String(log.id)}>
                      {`${log.month} · 余额 ${currency.format(log.amount_unused)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-500">核销金额</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="请输入核销金额"
              />
              {selectedSalary && (
                <p className="text-xs text-slate-500">
                  回款余额：{currency.format(selectedSalary.amount_unused)}
                </p>
              )}
            </div>

            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={settleMutation.isPending}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={settleMutation.isPending}>
              {settleMutation.isPending ? "提交中..." : "确认核销"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
