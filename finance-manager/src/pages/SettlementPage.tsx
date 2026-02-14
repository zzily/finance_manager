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
import { Badge } from "../components/ui/badge"
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

const statusLabels: Record<
  Transaction["status"],
  "待核销" | "部分核销" | "已结清"
> = {
  pending: "待核销",
  partially_settled: "部分核销",
  settled: "已结清",
}

const sourceLabels: Record<SalaryLog["source"], "工资" | "报销" | "其他"> = {
  salary: "工资",
  reimbursement: "报销",
  other: "其他",
}

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
  const [toast, setToast] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)
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
    category: "work",
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

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type })
  }

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
      showToast("核销成功")
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
      showToast("垫付已记录")
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
      showToast("回款已入账")
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
    setEditForm({
      title: transaction.title,
      amount_out: transaction.amount_out,
      category: transaction.category,
    })
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
      payload: {
        title: editForm.title.trim(),
        amount_out: numericAmount,
        category: editForm.category,
      },
    })
  }

  function handleDeleteTransaction() {
    if (!deletingTransaction) return
    deleteMutation.mutate(deletingTransaction.id)
  }

  const summary = summaryQuery.data
  const availableBalance = summary?.operational_status.cash_waiting_allocation ?? 0
  const businessLoop = summary?.financial_status.business_loop
  const familyLoop = summary?.financial_status.family_loop
  const businessDebt = businessLoop?.current_debt ?? 0
  const personalSpending = familyLoop?.personal_spending ?? 0
  const netSavings = familyLoop?.net_savings ?? 0
  const totalAssets = summary?.financial_status.total_assets ?? 0
  const billsPending = summary?.operational_status.bills_pending_settlement ?? 0

  useEffect(() => {
    if (menuOpenId === null) return
    const handler = () => setMenuOpenId(null)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [menuOpenId])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TransactionUpdate }) =>
      updateTransaction(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
      ])
      setEditOpen(false)
      showToast("账单已更新")
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
      showToast("账单已删除")
    },
    onError: () => {
      setDeleteError("删除失败，请稍后重试")
    },
  })

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6">
      {toast && (
        <div className="fixed left-3 right-3 top-3 z-50 sm:left-auto sm:right-6 sm:top-6">
          <div
            className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg transition ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
            role="status"
            aria-live="polite"
          >
            <span className="font-medium">{toast.message}</span>
            <button
              type="button"
              className={`text-xs transition ${
                toast.type === "success"
                  ? "text-emerald-700/70 hover:text-emerald-700"
                  : "text-red-700/70 hover:text-red-700"
              }`}
              onClick={() => setToast(null)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">核销页面</h1>
          <p className="text-sm text-slate-500">请选择未结清账单进行核销操作</p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div
            className="cursor-pointer rounded-[20px] border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-5 shadow-sm transition hover:border-blue-300 hover:bg-white/80 hover:backdrop-blur-sm hover:ring-1 hover:ring-white/70 hover:shadow-[0_12px_30px_-20px_rgba(148,163,184,0.7)]"
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
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  主KPI
                </p>
                <h2 className="text-base font-semibold text-slate-900">资金池余额</h2>
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
                我回款了
              </Button>
            </div>
            <div className="mt-4 text-3xl font-semibold text-slate-900">
              {currency.format(availableBalance)}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {summary?.operational_status.action_needed ?? "正在加载资金池数据"}
            </p>
            <p className="mt-3 text-xs text-slate-400">点击卡片查看资金池明细</p>
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-white/80 hover:backdrop-blur-sm hover:ring-1 hover:ring-white/70 hover:shadow-[0_12px_30px_-20px_rgba(148,163,184,0.7)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white p-5 shadow-sm transition hover:border-rose-300 hover:bg-white/80 hover:backdrop-blur-sm hover:ring-1 hover:ring-white/70 hover:shadow-[0_12px_30px_-20px_rgba(148,163,184,0.7)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  主KPI
                </p>
                <h2 className="text-base font-semibold text-slate-900">公司往来</h2>
                <p className="text-xs text-slate-500">目标：归零</p>
              </div>
              <span
                className={`text-xs font-medium ${
                  businessDebt > 0 ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {businessDebt > 0 ? "盯着老板要" : "已平账"}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">垫付总额</span>
                <span className="font-medium text-slate-900">
                  {currency.format(businessLoop?.total_lent ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">报销回款</span>
                <span className="font-medium text-slate-900">
                  {currency.format(businessLoop?.total_reimbursed ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">待回款</span>
                <span
                  className={`text-2xl font-bold ${
                    businessDebt > 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {currency.format(businessDebt)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {businessLoop?.status ?? "正在计算"}
            </p>
          </div>

          <div className="rounded-[20px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-white/80 hover:backdrop-blur-sm hover:ring-1 hover:ring-white/70 hover:shadow-[0_12px_30px_-20px_rgba(148,163,184,0.7)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  主KPI
                </p>
                <h2 className="text-base font-semibold text-slate-900">家庭储蓄</h2>
                <p className="text-xs text-slate-500">目标：持续增长</p>
              </div>
              <span
                className={`text-xs font-medium ${
                  netSavings >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {netSavings >= 0 ? "资产增值中" : "入不敷出"}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">工资收入</span>
                <span className="font-medium text-slate-900">
                  {currency.format(familyLoop?.gross_income ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">个人消费</span>
                <span className="font-medium text-orange-600">
                  -{currency.format(Math.abs(personalSpending))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">净储蓄</span>
                <span
                  className={`text-2xl font-bold ${
                    netSavings >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {currency.format(netSavings)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              {familyLoop?.status ?? "正在计算"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-white/80 hover:backdrop-blur-sm hover:ring-1 hover:ring-white/70 hover:shadow-[0_12px_30px_-20px_rgba(148,163,184,0.7)]">
            <p className="text-xs text-slate-500">总资产</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {currency.format(totalAssets)}
            </p>
            <p className="mt-1 text-xs text-slate-500">现金 + 待回款</p>
          </div>
          <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-white/80 hover:backdrop-blur-sm hover:ring-1 hover:ring-white/70 hover:shadow-[0_12px_30px_-20px_rgba(148,163,184,0.7)]">
            <p className="text-xs text-slate-500">操作概览</p>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>待核销账单</span>
                <span className="font-medium text-slate-900">
                  {currency.format(billsPending)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>未分配现金</span>
                <span className="font-medium text-slate-900">
                  {currency.format(availableBalance)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {summary?.operational_status.action_needed ?? "正在计算"}
            </p>
          </div>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm">
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
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>
                {activeTab === "pending" ? "仅显示未结清账单" : "展示全部账单记录"}
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-400"
                disabled
                aria-disabled="true"
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M3 4h14v2H3V4zm2 5h10v2H5V9zm2 5h6v2H7v-2z" />
                </svg>
                筛选(开发中)
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-400"
                disabled
                aria-disabled="true"
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6 4h8v2H6V4zm-2 5h12v2H4V9zm2 5h8v2H6v-2z" />
                </svg>
                排序(开发中)
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead className="text-right">账单金额(元)</TableHead>
                <TableHead className="text-right">已还(元)</TableHead>
                <TableHead className="text-right">未结清(元)</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsQuery.isLoading &&
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`loading-${index}`} className="animate-pulse">
                    <TableCell colSpan={5}>
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-28 rounded bg-slate-200" />
                        <div className="h-4 w-20 rounded bg-slate-200" />
                        <div className="h-4 flex-1 rounded bg-slate-200" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {transactionsQuery.isError && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-red-600">
                    无法加载账单，请稍后重试
                  </TableCell>
                </TableRow>
              )}
              {!transactionsQuery.isLoading && displayTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-6 py-6">
                      <p className="text-sm font-medium text-slate-600">
                        {activeTab === "pending"
                          ? "暂无未结清账单"
                          : "暂无账单记录"}
                      </p>
                      <p className="text-xs text-slate-400">
                        先记录一笔垫付，账单才会出现在这里
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openTransactionDialog}
                      >
                        新增垫付
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {displayTransactions.map((item) => {
                const due = item.amount_out - item.amount_reimbursed
                return (
                  <TableRow key={item.id}>
                    <TableCell className="min-w-[220px]">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-900">
                          {item.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {item.category === "work" ? (
                            <Badge className="border border-blue-200 bg-blue-50 text-blue-700">
                              工作
                            </Badge>
                          ) : (
                            <Badge className="border border-orange-200 bg-orange-50 text-orange-700">
                              个人
                            </Badge>
                          )}
                          <span className="text-slate-300">·</span>
                          <span>{statusLabels[item.status]}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          创建于 {dateFormatter.format(new Date(item.created_at))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {currency.format(item.amount_out)}
                    </TableCell>
                    <TableCell className="text-right">
                      {currency.format(item.amount_reimbursed)}
                    </TableCell>
                    <TableCell className="text-right">{currency.format(due)}</TableCell>
                    <TableCell className="text-right">
                      <div className="relative inline-flex items-center justify-end gap-2">
                        {item.status !== "settled" && (
                          <Button size="sm" onClick={() => openDialog(item)}>
                            去核销
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3"
                          onClick={(event) => {
                            event.stopPropagation()
                            setMenuOpenId((prev) => (prev === item.id ? null : item.id))
                          }}
                          aria-haspopup="menu"
                          aria-expanded={menuOpenId === item.id}
                        >
                          更多
                          <svg
                            className="ml-1 h-3 w-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M5.25 7.5 10 12.25 14.75 7.5" />
                          </svg>
                        </Button>
                        {menuOpenId === item.id && (
                          <div
                            className="absolute right-0 top-11 z-10 w-40 rounded-md border border-slate-200 bg-white py-2 text-left shadow-lg"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                              更多操作
                            </div>
                            <div className="my-1 h-px bg-slate-100" />
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                setMenuOpenId(null)
                                openEditDialog(item)
                              }}
                            >
                              <svg
                                className="h-4 w-4 text-slate-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.9 8.9-3.3.47.47-3.3 8.9-8.9z" />
                              </svg>
                              编辑账单
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setMenuOpenId(null)
                                openDeleteDialog(item)
                              }}
                            >
                              <svg
                                className="h-4 w-4 text-red-500"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M6 7a1 1 0 0 1 1 1v7a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1zm4 1a1 1 0 0 1 2 0v7a1 1 0 1 1-2 0V8z" />
                                <path d="M4 5h12v1H4zM8 3h4a1 1 0 0 1 1 1v1H7V4a1 1 0 0 1 1-1z" />
                              </svg>
                              删除账单
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
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>核销账单</DialogTitle>
            <DialogDescription>
              选择回款并输入本次核销金额
            </DialogDescription>
          </DialogHeader>
          <div className="h-px bg-slate-200/70" />
          <div className="space-y-4 rounded-[16px] border border-slate-200/70 bg-white/80 p-5">
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

          <DialogFooter className="border-t border-slate-200/70 pt-5">
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
          <div className="h-px bg-slate-200/70" />
          <div className="space-y-4 rounded-[16px] border border-slate-200/70 bg-white/80 p-5">
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
          <DialogFooter className="border-t border-slate-200/70 pt-5">
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
            <DialogTitle>我回款了</DialogTitle>
            <DialogDescription>新增一笔回款进入资金池</DialogDescription>
          </DialogHeader>
          <div className="h-px bg-slate-200/70" />
          <div className="space-y-4 rounded-[16px] border border-slate-200/70 bg-white/80 p-5">
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
          <DialogFooter className="border-t border-slate-200/70 pt-5">
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
          <div className="h-px bg-slate-200/70" />
          <div className="rounded-[16px] border border-slate-200/70 bg-white/80 p-5">
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>到账日期</TableHead>
                    <TableHead>来源</TableHead>
                    <TableHead className="text-right">总金额(元)</TableHead>
                    <TableHead className="text-right">已用(元)</TableHead>
                    <TableHead className="text-right">剩余(元)</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryLogsAllQuery.isLoading &&
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={`salary-loading-${index}`} className="animate-pulse">
                        <TableCell colSpan={6}>
                          <div className="flex items-center gap-3">
                            <div className="h-4 w-24 rounded bg-slate-200" />
                            <div className="h-4 w-16 rounded bg-slate-200" />
                            <div className="h-4 flex-1 rounded bg-slate-200" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                          <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-6 py-6">
                            <p className="text-sm font-medium text-slate-600">
                              暂无回款记录
                            </p>
                            <p className="text-xs text-slate-400">
                              录入回款后，会显示在资金池明细中
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSalaryListOpen(false)
                                openSalaryDialog()
                              }}
                            >
                              新增回款
                            </Button>
                          </div>
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
                        <TableCell>{sourceLabels[log.source]}</TableCell>
                        <TableCell className="text-right">
                          {currency.format(log.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency.format(usedAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {currency.format(log.amount_unused)}
                        </TableCell>
                        <TableCell>{log.remark || "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="border-t border-slate-200/70 pt-5">
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
          <div className="h-px bg-slate-200/70" />
          <div className="space-y-4 rounded-[16px] border border-slate-200/70 bg-white/80 p-5">
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
            <div className="space-y-2">
              <label className="text-sm text-slate-500">分类</label>
              <Select
                value={editForm.category}
                onValueChange={(value) =>
                  setEditForm((prev) => ({
                    ...prev,
                    category: value as TransactionUpdate["category"],
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
            {editError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {editError}
              </div>
            )}
          </div>
          <DialogFooter className="border-t border-slate-200/70 pt-5">
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
          <div className="h-px bg-slate-200/70" />
          <div className="space-y-3 rounded-[16px] border border-slate-200/70 bg-white/80 p-5">
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
          </div>
          <DialogFooter className="border-t border-slate-200/70 pt-5">
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
