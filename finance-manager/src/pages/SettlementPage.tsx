import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "../lib/api"
import type {
  SalaryLog,
  SalaryLogCreate,
  SettleRequest,
  SummaryResponse,
  Transaction,
  TransactionCreate,
  TransactionUpdate,
} from "../types"
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

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

async function fetchTransactions() {
  const response = await api.get<Transaction[]>("/transactions/")
  return response.data
}

async function fetchSalaryLogsAvailable() {
  const response = await api.get<SalaryLog[]>("/salary_logs/", {
    params: { available_only: true },
  })
  return response.data
}

async function fetchSalaryLogsAll() {
  const response = await api.get<SalaryLog[]>("/salary_logs/")
  return response.data
}

async function fetchSummary() {
  const response = await api.get<SummaryResponse>("/summary")
  return response.data
}

async function createTransaction(payload: TransactionCreate) {
  const response = await api.post<Transaction>("/transactions/", payload)
  return response.data
}

async function createSalaryLog(payload: SalaryLogCreate) {
  const response = await api.post<SalaryLog>("/salary_logs/", payload)
  return response.data
}

async function settleDebt(payload: SettleRequest) {
  const response = await api.post("/settle", payload)
  return response.data
}

async function updateTransaction(id: number, payload: TransactionUpdate) {
  const response = await api.put<Transaction>(`/transactions/${id}`, payload)
  return response.data
}

async function deleteTransaction(id: number) {
  const response = await api.delete(`/transactions/${id}`)
  return response.data
}

export default function SettlementPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [transactionOpen, setTransactionOpen] = useState(false)
  const [salaryOpen, setSalaryOpen] = useState(false)
  const [salaryListOpen, setSalaryListOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedSalaryId, setSelectedSalaryId] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [formError, setFormError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending")
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<TransactionUpdate>({
    title: "",
    amount_out: 0,
  })
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)
  const [transactionForm, setTransactionForm] = useState<TransactionCreate>({
    title: "",
    amount_out: 0,
    category: "work",
  })
  const [salaryForm, setSalaryForm] = useState<SalaryLogCreate>({
    amount: 0,
    month: "",
    source: "salary",
    remark: "",
  })
  const [entryError, setEntryError] = useState<string | null>(null)

  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  })

  const salaryLogsQuery = useQuery({
    queryKey: ["salary_logs", "available"],
    queryFn: fetchSalaryLogsAvailable,
  })

  const salaryLogsAllQuery = useQuery({
    queryKey: ["salary_logs", "all"],
    queryFn: fetchSalaryLogsAll,
  })

  const summaryQuery = useQuery({
    queryKey: ["summary"],
    queryFn: fetchSummary,
  })

  const settleMutation = useMutation({
    mutationFn: settleDebt,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["salary_logs"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
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

  const transactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
      ])
      setTransactionForm({ title: "", amount_out: 0, category: "work" })
      setEntryError(null)
      setTransactionOpen(false)
    },
    onError: () => {
      setEntryError("新增垫付失败，请稍后重试")
    },
  })

  const salaryMutation = useMutation({
    mutationFn: createSalaryLog,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["salary_logs"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
      ])
      setSalaryForm({ amount: 0, month: "", source: "salary", remark: "" })
      setEntryError(null)
      setSalaryOpen(false)
    },
    onError: () => {
      setEntryError("新增回款失败，请稍后重试")
    },
  })

  const unsettledTransactions = useMemo(() => {
    const list = transactionsQuery.data ?? []
    return list.filter((item) => item.status !== "settled")
  }, [transactionsQuery.data])

  const displayTransactions = useMemo(() => {
    if (activeTab === "pending") return unsettledTransactions
    return transactionsQuery.data ?? []
  }, [activeTab, transactionsQuery.data, unsettledTransactions])

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

  function openTransactionDialog() {
    setEntryError(null)
    setTransactionOpen(true)
  }

  function openSalaryDialog() {
    setEntryError(null)
    setSalaryOpen(true)
  }

  function openSalaryList() {
    setSalaryListOpen(true)
  }

  function openEditDialog(transaction: Transaction) {
    setEditingTransaction(transaction)
    setEditForm({ title: transaction.title, amount_out: transaction.amount_out })
    setEditError(null)
    setEditOpen(true)
  }

  function openDeleteDialog(transaction: Transaction) {
    setDeletingTransaction(transaction)
    setDeleteError(null)
    setDeleteOpen(true)
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

  function handleCreateTransaction() {
    const numericAmount = Number(transactionForm.amount_out)
    if (!transactionForm.title.trim()) {
      setEntryError("请输入垫付标题")
      return
    }
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setEntryError("请输入有效的垫付金额")
      return
    }
    setEntryError(null)
    transactionMutation.mutate({
      ...transactionForm,
      amount_out: numericAmount,
    })
  }

  function handleCreateSalaryLog() {
    const numericAmount = Number(salaryForm.amount)
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setEntryError("请输入有效的回款金额")
      return
    }
    if (!salaryForm.month) {
      setEntryError("请选择回款月份")
      return
    }
    setEntryError(null)
    salaryMutation.mutate({
      ...salaryForm,
      amount: numericAmount,
      remark: salaryForm.remark?.trim() || null,
    })
  }

  function handleUpdateTransaction() {
    if (!editingTransaction) return
    if (!editForm.title.trim()) {
      setEditError("请输入账单标题")
      return
    }
    const numericAmount = Number(editForm.amount_out)
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setEditError("请输入有效的账单金额")
      return
    }
    setEditError(null)
    updateMutation.mutate({
      id: editingTransaction.id,
      payload: { title: editForm.title.trim(), amount_out: numericAmount },
    })
  }

  function handleDeleteTransaction() {
    if (!deletingTransaction) return
    deleteMutation.mutate(deletingTransaction.id)
  }

  const summary = summaryQuery.data
  const availableBalance = summary?.operational_status.cash_waiting_allocation ?? 0
  const netDebt = summary?.financial_status.current_net_debt ?? 0

  useEffect(() => {
    if (menuOpenId === null) return
    const handler = () => setMenuOpenId(null)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [menuOpenId])

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TransactionUpdate }) =>
      updateTransaction(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
      ])
      setEditOpen(false)
    },
    onError: () => {
      setEditError("修改失败，请稍后重试")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
      ])
      setDeleteOpen(false)
    },
    onError: () => {
      setDeleteError("删除失败，请稍后重试")
    },
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">核销页面</h1>
          <p className="text-sm text-slate-500">请选择未结清账单进行核销操作</p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div
            className="cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
            role="button"
            tabIndex={0}
            onClick={openSalaryList}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                openSalaryList()
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">资金池余额</h2>
                <p className="text-xs text-slate-500">可用于核销的未分配回款</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation()
                  openSalaryDialog()
                }}
              >
                父亲回款了
              </Button>
            </div>
            <div className="mt-4 text-2xl font-semibold text-slate-900">
              {currency.format(availableBalance)}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {summary?.operational_status.action_needed ?? "正在加载资金池数据"}
            </p>
            <p className="mt-3 text-xs text-slate-400">点击卡片查看资金池明细</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">记账入口</h2>
                <p className="text-xs text-slate-500">录入你的垫付与回款</p>
              </div>
              <Button variant="outline" size="sm" onClick={openTransactionDialog}>
                我垫付了
              </Button>
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-500">
              <p>垫付会形成新的债权账单</p>
              <p>回款会进入资金池，待分配后核销</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">总垫付金额</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {currency.format(summary?.financial_status.total_lent_by_you ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">总回血金额</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {currency.format(summary?.financial_status.total_received_back ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">当前净欠款</p>
            <p
              className={`mt-2 text-xl font-semibold ${
                netDebt > 0 ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {currency.format(netDebt)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {summary?.financial_status.status ?? "正在计算"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <button
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeTab === "pending"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                onClick={() => setActiveTab("pending")}
              >
                待核销
              </button>
              <button
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeTab === "history"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                onClick={() => setActiveTab("history")}
              >
                全部/历史记录
              </button>
            </div>
            <span className="text-xs text-slate-500">
              {activeTab === "pending" ? "仅显示未结清账单" : "展示全部账单记录"}
            </span>
          </div>
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
              {!transactionsQuery.isLoading && displayTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    {activeTab === "pending" ? "暂无未结清账单" : "暂无账单记录"}
                  </TableCell>
                </TableRow>
              )}
              {displayTransactions.map((item) => {
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
                      <div className="relative inline-flex items-center justify-end gap-2">
                        {item.status !== "settled" && (
                          <Button onClick={() => openDialog(item)}>核销</Button>
                        )}
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                          onClick={(event) => {
                            event.stopPropagation()
                            setMenuOpenId((prev) => (prev === item.id ? null : item.id))
                          }}
                        >
                          ...
                        </button>
                        {menuOpenId === item.id && (
                          <div
                            className="absolute right-0 top-11 z-10 w-32 rounded-md border border-slate-200 bg-white py-1 text-left shadow-md"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                setMenuOpenId(null)
                                openEditDialog(item)
                              }}
                            >
                              编辑
                            </button>
                            <button
                              className="block w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setMenuOpenId(null)
                                openDeleteDialog(item)
                              }}
                            >
                              删除
                            </button>
                          </div>
                        )}
                      </div>
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

      <Dialog open={transactionOpen} onOpenChange={setTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>我垫付了</DialogTitle>
            <DialogDescription>新增一笔垫付账单</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-500">标题</label>
              <Input
                value={transactionForm.title}
                onChange={(event) =>
                  setTransactionForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                placeholder="例如：给车加油"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-500">金额</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={transactionForm.amount_out || ""}
                onChange={(event) =>
                  setTransactionForm((prev) => ({
                    ...prev,
                    amount_out: Number(event.target.value),
                  }))
                }
                placeholder="请输入垫付金额"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-500">分类</label>
              <Select
                value={transactionForm.category}
                onValueChange={(value) =>
                  setTransactionForm((prev) => ({
                    ...prev,
                    category: value as TransactionCreate["category"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">工作</SelectItem>
                  <SelectItem value="personal">个人</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {entryError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {entryError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setTransactionOpen(false)}
              disabled={transactionMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateTransaction}
              disabled={transactionMutation.isPending}
            >
              {transactionMutation.isPending ? "提交中..." : "确认录入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={salaryOpen} onOpenChange={setSalaryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>父亲回款了</DialogTitle>
            <DialogDescription>新增一笔回款进入资金池</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-500">金额</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={salaryForm.amount || ""}
                onChange={(event) =>
                  setSalaryForm((prev) => ({
                    ...prev,
                    amount: Number(event.target.value),
                  }))
                }
                placeholder="例如：5000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-500">回款月份</label>
              <Input
                type="month"
                value={salaryForm.month}
                onChange={(event) =>
                  setSalaryForm((prev) => ({
                    ...prev,
                    month: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-500">来源</label>
              <Select
                value={salaryForm.source}
                onValueChange={(value) =>
                  setSalaryForm((prev) => ({
                    ...prev,
                    source: value as SalaryLogCreate["source"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">工资</SelectItem>
                  <SelectItem value="reimbursement">报销</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-500">备注</label>
              <Input
                value={salaryForm.remark ?? ""}
                onChange={(event) =>
                  setSalaryForm((prev) => ({
                    ...prev,
                    remark: event.target.value,
                  }))
                }
                placeholder="例如：收到工资转账"
              />
            </div>
            {entryError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {entryError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setSalaryOpen(false)}
              disabled={salaryMutation.isPending}
            >
              取消
            </Button>
            <Button onClick={handleCreateSalaryLog} disabled={salaryMutation.isPending}>
              {salaryMutation.isPending ? "提交中..." : "确认录入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={salaryListOpen} onOpenChange={setSalaryListOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>资金池明细</DialogTitle>
            <DialogDescription>查看所有回款的使用情况</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>到账日期</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>已用</TableHead>
                  <TableHead>剩余</TableHead>
                  <TableHead>备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryLogsAllQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500">
                      加载中...
                    </TableCell>
                  </TableRow>
                )}
                {salaryLogsAllQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-red-600">
                      无法加载回款明细，请稍后重试
                    </TableCell>
                  </TableRow>
                )}
                {!salaryLogsAllQuery.isLoading &&
                  (salaryLogsAllQuery.data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500">
                        暂无回款记录
                      </TableCell>
                    </TableRow>
                  )}
                {(salaryLogsAllQuery.data ?? []).map((log) => {
                  const usedAmount = log.amount - log.amount_unused
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        {dateFormatter.format(new Date(log.received_date))}
                      </TableCell>
                      <TableCell>{log.source}</TableCell>
                      <TableCell>{currency.format(log.amount)}</TableCell>
                      <TableCell>{currency.format(usedAmount)}</TableCell>
                      <TableCell>{currency.format(log.amount_unused)}</TableCell>
                      <TableCell>{log.remark || "-"}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSalaryListOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑账单</DialogTitle>
            <DialogDescription>修改标题或金额</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-500">标题</label>
              <Input
                value={editForm.title}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                placeholder="例如：给车加油"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-500">金额</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editForm.amount_out || ""}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    amount_out: Number(event.target.value),
                  }))
                }
                placeholder="请输入账单金额"
              />
            </div>
            {editError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEditOpen(false)}
              disabled={updateMutation.isPending}
            >
              取消
            </Button>
            <Button onClick={handleUpdateTransaction} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "保存中..." : "保存修改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除账单</DialogTitle>
            <DialogDescription>
              删除后无法恢复，请确认是否删除该账单。
            </DialogDescription>
          </DialogHeader>
          {deletingTransaction && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {deletingTransaction.title} · {currency.format(deletingTransaction.amount_out)}
            </div>
          )}
          {deleteError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTransaction}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
