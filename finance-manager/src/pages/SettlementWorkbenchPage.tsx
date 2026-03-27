import { useMemo, useState } from "react"

import { ArrowDownCircle, ArrowRight, Plus, Sparkles } from "lucide-react"

import { CategoryBadge, ErrorBox, StatusBadge } from "../components/common"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { getApiErrorMessage } from "../lib/api"
import { currency } from "../lib/formatters"
import { useSalaryLogs } from "../hooks/useSalaryLogs"
import { useTransactions } from "../hooks/useTransactions"
import type { AppView } from "../layouts/appShell.types"
import type { SalaryLog, Transaction } from "../types"
import { SettlementDialogs } from "./SettlementDialogs"
import { useSettlementPageState } from "./useSettlementPageState"

function getRemainingDebt(transaction: Transaction) {
  return transaction.amount_out - transaction.amount_reimbursed
}

function getRecommendedSalaryLog(
  transaction: Transaction | null,
  availableLogs: SalaryLog[],
) {
  if (!transaction || availableLogs.length === 0) {
    return null
  }

  const remainingDebt = getRemainingDebt(transaction)
  const sufficientLogs = [...availableLogs]
    .filter((log) => log.amount_unused >= remainingDebt)
    .sort((left, right) => left.amount_unused - right.amount_unused)

  if (sufficientLogs.length > 0) {
    return sufficientLogs[0]
  }

  return [...availableLogs].sort((left, right) => right.amount_unused - left.amount_unused)[0]
}

export function SettlementWorkbenchPage({
  onNavigate,
}: {
  onNavigate: (view: AppView) => void
}) {
  const transactions = useTransactions()
  const salary = useSalaryLogs()
  const pageState = useSettlementPageState(transactions.all, transactions.unsettled)

  const queue = useMemo(
    () =>
      [...transactions.unsettled].sort(
        (left, right) => getRemainingDebt(right) - getRemainingDebt(left),
      ),
    [transactions.unsettled],
  )
  const availableLogs = useMemo(
    () => [...salary.available].sort((left, right) => right.amount_unused - left.amount_unused),
    [salary.available],
  )

  const [preferredTransactionId, setPreferredTransactionId] = useState<number | null>(null)
  const [preferredSalaryId, setPreferredSalaryId] = useState<number | null>(null)
  const [amount, setAmount] = useState("")
  const [error, setError] = useState<string | null>(null)

  const selectedTransaction = useMemo(
    () => queue.find((transaction) => transaction.id === preferredTransactionId) ?? queue[0] ?? null,
    [preferredTransactionId, queue],
  )
  const recommendedSalaryLog = useMemo(
    () => getRecommendedSalaryLog(selectedTransaction, availableLogs),
    [availableLogs, selectedTransaction],
  )
  const selectedSalaryLog = useMemo(
    () =>
      availableLogs.find((log) => log.id === preferredSalaryId) ??
      recommendedSalaryLog ??
      availableLogs[0] ??
      null,
    [availableLogs, preferredSalaryId, recommendedSalaryLog],
  )
  const recommendedAmount = useMemo(() => {
    if (!selectedTransaction || !selectedSalaryLog) {
      return 0
    }

    return Math.min(getRemainingDebt(selectedTransaction), selectedSalaryLog.amount_unused)
  }, [selectedSalaryLog, selectedTransaction])

  function applySuggestedAmount() {
    if (recommendedAmount > 0) {
      setAmount(String(recommendedAmount))
      setError(null)
    }
  }

  function submitSettlement() {
    if (!selectedTransaction) {
      setError("请先选择一笔待核销账单")
      return
    }
    if (!selectedSalaryLog) {
      setError("请先选择一笔可用回款")
      return
    }

    const numericAmount = Number(amount)
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError("请输入有效的核销金额")
      return
    }
    if (numericAmount > getRemainingDebt(selectedTransaction)) {
      setError("核销金额不能超过账单剩余欠款")
      return
    }
    if (numericAmount > selectedSalaryLog.amount_unused) {
      setError("核销金额不能超过回款剩余金额")
      return
    }

    setError(null)
    salary.settle.mutate(
      {
        amount: numericAmount,
        salary_log_id: selectedSalaryLog.id,
        transaction_id: selectedTransaction.id,
      },
      {
        onError: (mutationError) => {
          setError(getApiErrorMessage(mutationError, "核销失败，请稍后重试"))
        },
        onSuccess: () => {
          setAmount("")
          setError(null)
        },
      },
    )
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-card lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Settlement workbench
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            带着推荐直接核销，不再来回试金额
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            左侧先选欠款最多的账单，中间看可用回款和推荐项，右侧直接确认本次核销金额。后续可以继续迭代成更完整的自动推荐策略。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => pageState.setTxnDialogOpen(true)}>
            <Plus size={15} />
            去记录账单
          </Button>
          <Button variant="outline" onClick={() => pageState.setSalaryDialogOpen(true)}>
            <ArrowDownCircle size={15} />
            去录入回款
          </Button>
          <Button onClick={() => onNavigate("transactions")}>
            去账单中心
            <ArrowRight size={15} />
          </Button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_0.95fr_1.15fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Queue
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                待核销账单
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {queue.length} 笔
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {transactions.query.isLoading && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                正在加载待核销账单...
              </div>
            )}

            {!transactions.query.isLoading && queue.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                当前没有待核销账单，可以先去录入新账单。
              </div>
            )}

            {queue.map((transaction) => {
              const remainingDebt = getRemainingDebt(transaction)
              const isActive = transaction.id === selectedTransaction?.id

              return (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() => {
                    setPreferredTransactionId(transaction.id)
                    setPreferredSalaryId(null)
                    setAmount("")
                    setError(null)
                  }}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${isActive ? "text-white" : "text-slate-950"}`}>
                        {transaction.title}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <CategoryBadge category={transaction.category} />
                        <StatusBadge status={transaction.status} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold tabular-nums ${isActive ? "text-white" : "text-red-600"}`}>
                        {currency.format(remainingDebt)}
                      </p>
                      <p className={`mt-1 text-xs ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                        剩余欠款
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Funds
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                可用回款池
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {availableLogs.length} 笔
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {salary.availableQuery.isLoading && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                正在加载可用回款...
              </div>
            )}

            {!salary.availableQuery.isLoading && availableLogs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                当前没有可用回款，先录入一笔回款再来核销。
              </div>
            )}

            {availableLogs.map((log) => {
              const isActive = log.id === selectedSalaryLog?.id
              const isRecommended = log.id === recommendedSalaryLog?.id

              return (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => {
                    setPreferredSalaryId(log.id)
                    setAmount("")
                    setError(null)
                  }}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                      : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-950"}`}>
                          {log.month}
                        </p>
                        {isRecommended && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isActive ? "bg-white/10 text-white" : "bg-blue-50 text-blue-700"
                          }`}>
                            推荐
                          </span>
                        )}
                      </div>
                      <p className={`mt-2 text-xs ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                        {log.source} · {log.remark || "未填写备注"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold tabular-nums ${isActive ? "text-white" : "text-emerald-600"}`}>
                        {currency.format(log.amount_unused)}
                      </p>
                      <p className={`mt-1 text-xs ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                        可用余额
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Preview
              </p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                本次核销预览
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
              <Sparkles size={12} />
              推荐驱动
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-medium text-slate-500">当前账单</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {selectedTransaction?.title ?? "未选择账单"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                剩余欠款：{currency.format(selectedTransaction ? getRemainingDebt(selectedTransaction) : 0)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-medium text-slate-500">当前回款</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {selectedSalaryLog ? `${selectedSalaryLog.month} · ${selectedSalaryLog.source}` : "未选择回款"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                可用余额：{currency.format(selectedSalaryLog?.amount_unused ?? 0)}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-4">
              <p className="text-xs font-medium text-blue-600">建议金额</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-blue-900">
                {currency.format(recommendedAmount)}
              </p>
              <p className="mt-2 text-sm text-blue-700">
                这是当前账单与当前回款的安全交集金额，可直接填入。
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">本次核销金额</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="输入本次要核销的金额"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={applySuggestedAmount} disabled={recommendedAmount <= 0}>
                按建议金额填入
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedTransaction) {
                    setAmount(String(getRemainingDebt(selectedTransaction)))
                    setError(null)
                  }
                }}
                disabled={!selectedTransaction}
              >
                全额核销当前账单
              </Button>
            </div>

            {error && <ErrorBox msg={error} />}

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              <p>核销后账单剩余：{currency.format(Math.max(0, (selectedTransaction ? getRemainingDebt(selectedTransaction) : 0) - (Number(amount) || 0)))}</p>
              <p className="mt-2">核销后回款剩余：{currency.format(Math.max(0, (selectedSalaryLog?.amount_unused ?? 0) - (Number(amount) || 0)))}</p>
            </div>

            <Button className="w-full" onClick={submitSettlement} disabled={salary.settle.isPending}>
              {salary.settle.isPending ? "提交中..." : "确认本次核销"}
            </Button>
          </div>
        </div>
      </section>

      <SettlementDialogs pageState={pageState} salary={salary} transactions={transactions} />
    </div>
  )
}
