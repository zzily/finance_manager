import { transactionDate } from "../lib/navigation"
import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Plus } from "lucide-react"
import { CategoryBadge, StatusBadge } from "../components/common"
import { QueryError } from "../components/common/QueryState"
import { PageHeader } from "../components/common/PageHeader"
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { ScrollArea } from "../components/ui/scroll-area"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Field, FieldLabel, FieldError, FieldDescription } from "../components/ui/field"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "../components/ui/empty"
import { moneyError } from "../lib/formHelpers"
import { getApiErrorMessage } from "../lib/api"
import { currency } from "../lib/formatters"
import { cn } from "../lib/utils"
import { useSalaryLogs } from "../hooks/useSalaryLogs"
import { useTransactions } from "../hooks/useTransactions"
import type { AppNavigate } from "../lib/navigation"
import type { SalaryLog, Transaction } from "../types"
import { SettlementDialogs } from "./SettlementDialogs"
import { useSettlementPageState } from "./useSettlementPageState"
const due = (t: Transaction) => Math.max(0, t.amount_out - t.amount_reimbursed)
const sourceLabel = {
  salary: "工资",
  reimbursement: "报销",
  other: "其他收入",
}
function recommendSalary(transaction: Transaction | null, logs: SalaryLog[]) {
  if (!transaction) return null
  const matching = logs.filter(
    (l) => l.source === (transaction.category === "work" ? "reimbursement" : "salary"),
  )
  const candidates = matching.length ? matching : logs
  return (
    [...candidates].sort((a, b) => {
      const enoughA = a.amount_unused >= due(transaction),
        enoughB = b.amount_unused >= due(transaction)
      if (enoughA !== enoughB) return enoughA ? -1 : 1
      return enoughA ? a.amount_unused - b.amount_unused : b.amount_unused - a.amount_unused
    })[0] ?? null
  )
}
export function SettlementWorkbenchPage({
  onNavigate,
  initialTransactionId,
}: {
  onNavigate: AppNavigate
  initialTransactionId?: number
}) {
  const transactions = useTransactions(),
    salary = useSalaryLogs()
  const pageState = useSettlementPageState(transactions.all, transactions.unsettled)
  const queue = useMemo(
    () => [...transactions.unsettled].sort((a, b) => transactionDate(a).localeCompare(transactionDate(b))),
    [transactions.unsettled],
  )
  const [transactionId, setTransactionId] = useState<number | null>(initialTransactionId ?? null)
  const [salaryId, setSalaryId] = useState<number | null>(null)
  const [amount, setAmount] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [step, setStep] = useState(initialTransactionId ? 2 : 1)
  const selected =
    transactionId === null
      ? (queue[0] ?? null)
      : (queue.find((t) => t.id === transactionId) ?? null)
  const recommended = recommendSalary(selected, salary.available)
  const funds = salary.available.find((l) => l.id === salaryId) ?? recommended
  const maximum = selected && funds ? Math.min(due(selected), funds.amount_unused) : 0
  const value = amount ?? (maximum > 0 ? maximum.toFixed(2) : "")
  const numeric = Number(value)
  const invalid =
    moneyError(value) ??
    (numeric > maximum
      ? `最多可核销 ${currency.format(maximum)}，当前超出 ${currency.format(numeric - maximum)}`
      : null)
  const missingRequested =
    Boolean(initialTransactionId) &&
    !transactions.query.isLoading &&
    !transactions.query.isError &&
    !selected
  function submit() {
    if (!selected || !funds || invalid || salary.settle.isPending) return
    const billName = selected.title
    salary.settle.mutate(
      { transaction_id: selected.id, salary_log_id: funds.id, amount: numeric },
      {
        onSuccess: () => {
          setSuccess(`已为「${billName}」核销 ${currency.format(numeric)}`)
          setAmount(null)
          setSalaryId(null)
          setTransactionId(null)
          setStep(1)
          setError(null)
        },
        onError: (e) => setError(getApiErrorMessage(e, "核销失败，请核对记录后重试")),
      },
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="核销账单" description="将已到账收入关联到账单，不会发起实际转账">
        <Button variant="outline" size="sm" onClick={() => onNavigate("transactions")}>
          <ArrowLeft data-icon="inline-start" />
          账单
        </Button>
      </PageHeader>
      {success && (
        <Alert>
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>{success}</AlertTitle>
          <AlertDescription>账单与可用收入已同步更新，可继续处理下一笔。</AlertDescription>
        </Alert>
      )}
      {transactions.query.isError && (
        <QueryError
          title="无法获取待处理账单"
          hasData={Boolean(transactions.query.data)}
          onRetry={() => {
            void transactions.query.refetch()
          }}
        />
      )}
      {salary.availableQuery.isError && (
        <QueryError
          title="无法获取可用收入"
          hasData={Boolean(salary.availableQuery.data)}
          onRetry={() => {
            void salary.availableQuery.refetch()
          }}
        />
      )}
      {missingRequested && (
        <Alert variant="destructive">
          <AlertTitle>这笔账单已结清或不存在</AlertTitle>
          <AlertDescription>请从账单列表重新选择，当前不会自动改为处理其他账单。</AlertDescription>
        </Alert>
      )}
      <nav aria-label="核销步骤" className="grid grid-cols-3 gap-2 lg:hidden">
        {["选账单", "选收入", "确认金额"].map((label, i) => (
          <Button
            key={label}
            variant={step === i + 1 ? "default" : "outline"}
            size="sm"
            disabled={(i > 0 && !selected) || (i > 1 && !funds)}
            aria-current={step === i + 1 ? "step" : undefined}
            onClick={() => setStep(i + 1)}
          >
            {i + 1}. {label}
          </Button>
        ))}
      </nav>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Card className={cn(step !== 1 && "hidden lg:block")}>
          <CardHeader>
            <CardTitle>待处理账单 · {queue.length} 笔</CardTitle>
            <CardDescription>按时间先后处理</CardDescription>
          </CardHeader>
          <CardContent>
            {!transactions.query.isLoading && !transactions.query.isError && !queue.length && (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>当前没有待处理账单</EmptyTitle>
                  <EmptyDescription>可记录新账单或查看已结清记录。</EmptyDescription>
                </EmptyHeader>
                <Button onClick={() => pageState.setTxnDialogOpen(true)}>
                  <Plus data-icon="inline-start" />
                  记录账单
                </Button>
              </Empty>
            )}
            {transactions.query.isLoading && <p role="status">正在加载账单…</p>}
            <ScrollArea className="h-[min(55dvh,32rem)]">
              <div className="flex flex-col gap-2 pr-3">
                {queue.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={salary.settle.isPending}
                    aria-pressed={selected?.id === t.id}
                    onClick={() => {
                      setTransactionId(t.id)
                      setSalaryId(null)
                      setAmount(null)
                      setError(null)
                      setSuccess(null)
                      setStep(2)
                    }}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring",
                      selected?.id === t.id ? "border-primary bg-accent" : "hover:bg-muted",
                    )}
                  >
                    <p className="font-medium">{t.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <CategoryBadge category={t.category} />
                      <StatusBadge status={t.status} />
                      <span className="ml-auto font-semibold tabular-nums">
                        {currency.format(due(t))}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className={cn(step !== 2 && "hidden lg:block")}>
          <CardHeader>
            <CardTitle>选择到账收入</CardTitle>
            <CardDescription>
              {selected ? `账单：${selected.title}` : "请先选择账单"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!salary.availableQuery.isLoading &&
              !salary.availableQuery.isError &&
              !salary.available.length && (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>暂无可用收入</EmptyTitle>
                    <EmptyDescription>先录入工资或报销到账，再关联账单。</EmptyDescription>
                  </EmptyHeader>
                  <Button onClick={() => pageState.setSalaryDialogOpen(true)}>录入收入</Button>
                </Empty>
              )}
            {salary.availableQuery.isLoading && <p role="status">正在加载收入…</p>}
            <ScrollArea className="h-[min(50dvh,32rem)]">
              <div className="flex flex-col gap-2 pr-3">
                {salary.available.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    disabled={!selected || salary.settle.isPending}
                    aria-pressed={funds?.id === l.id}
                    onClick={() => {
                      setSalaryId(l.id)
                      setAmount(null)
                      setError(null)
                      setStep(3)
                    }}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring",
                      funds?.id === l.id ? "border-primary bg-accent" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">
                        {sourceLabel[l.source]} · {l.month}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {currency.format(l.amount_unused)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{l.remark || "未填写备注"}</p>
                    {recommended?.id === l.id && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        推荐：
                        {selected?.category === "work" && l.source === "reimbursement"
                          ? "优先使用报销收入"
                          : selected?.category === "personal" && l.source === "salary"
                            ? "优先使用工资收入"
                            : "按可用余额匹配"}
                        ，
                        {selected && l.amount_unused >= due(selected)
                          ? "可全额结清"
                          : "可先部分核销"}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
            {selected && funds && (
              <Button className="mt-3 w-full lg:hidden" onClick={() => setStep(3)}>
                使用所选收入
                <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </CardContent>
        </Card>
        <Card className={cn("lg:sticky lg:top-4", step !== 3 && "hidden lg:block")}>
          <CardHeader>
            <CardTitle>确认本次核销</CardTitle>
            <CardDescription>核对账单、来源和剩余金额</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">账单</dt>
              <dd className="text-right font-medium">{selected?.title ?? "尚未选择"}</dd>
              <dt className="text-muted-foreground">未结金额</dt>
              <dd className="text-right tabular-nums">
                {selected ? currency.format(due(selected)) : "—"}
              </dd>
              <dt className="text-muted-foreground">到账收入</dt>
              <dd className="text-right">
                {funds ? `${sourceLabel[funds.source]} · ${funds.month}` : "尚未选择"}
              </dd>
              <dt className="text-muted-foreground">可用金额</dt>
              <dd className="text-right tabular-nums">
                {funds ? currency.format(funds.amount_unused) : "—"}
              </dd>
            </dl>
            <Field data-invalid={Boolean(amount !== null && invalid)}>
              <FieldLabel htmlFor="settle-amount">本次核销金额（人民币）</FieldLabel>
              <Input
                id="settle-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                max={maximum}
                value={value}
                disabled={!selected || !funds || salary.settle.isPending}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={Boolean(amount !== null && invalid)}
                aria-describedby={
                  invalid && amount !== null
                    ? "settle-amount-help settle-amount-error"
                    : "settle-amount-help"
                }
                placeholder="输入核销金额"
              />
              <FieldDescription id="settle-amount-help">
                {selected && funds ? `本次最多 ${currency.format(maximum)}` : "选择账单与收入后显示限额"}
              </FieldDescription>
              {amount !== null && invalid && (
                <FieldError id="settle-amount-error">{invalid}</FieldError>
              )}
            </Field>
            <Button
              variant="outline"
              disabled={maximum <= 0 || salary.settle.isPending}
              onClick={() => setAmount(maximum.toFixed(2))}
            >
              {selected && funds && funds.amount_unused < due(selected)
                ? "使用这笔收入的全部余额"
                : "全额结清当前账单"}
            </Button>
            {!invalid && selected && funds && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p>核销后账单剩余：{currency.format(due(selected) - numeric)}</p>
                <p className="mt-2">
                  核销后收入剩余：
                  {currency.format(funds.amount_unused - numeric)}
                </p>
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-20 rounded-md bg-card p-1 lg:static lg:p-0">
              <Button
                className="w-full"
                onClick={submit}
                disabled={
                  Boolean(invalid) ||
                  !selected ||
                  !funds ||
                  salary.settle.isPending ||
                  transactions.query.isError ||
                  salary.availableQuery.isError
                }
              >
                {salary.settle.isPending ? "核销中…" : "确认本次核销"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <SettlementDialogs pageState={pageState} salary={salary} transactions={transactions} />
    </div>
  )
}
