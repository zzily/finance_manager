import { useState } from "react"
import { useTemplates } from "../hooks/useTemplates"
import { todayKey } from "../lib/formHelpers"
import type { BillTemplate } from "../lib/templates"
import { ArrowDownCircle, ArrowRight, Plus } from "lucide-react"
import { BalanceCard, UnsettledBillsCard } from "../components/dashboard/MetricCards"
import { DashboardAlertsSection } from "../components/dashboard/DashboardAlertsSection"
import { RecentActivityFeed } from "../components/dashboard/RecentActivityFeed"
import { CategoryBadge, StatusBadge } from "../components/common"
import { QueryError, DataUpdated } from "../components/common/QueryState"
import { PageHeader } from "../components/common/PageHeader"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Skeleton } from "../components/ui/skeleton"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "../components/ui/empty"
import { useActivityFeed } from "../hooks/useActivityFeed"
import { useDashboardAlerts } from "../hooks/useDashboardAlerts"
import { useSalaryLogs } from "../hooks/useSalaryLogs"
import { useSummary } from "../hooks/useSummary"
import { useTransactions } from "../hooks/useTransactions"
import { currency } from "../lib/formatters"
import type { AppNavigate } from "../lib/navigation"
import { SettlementDialogs } from "./SettlementDialogs"
import { useSettlementPageState } from "./useSettlementPageState"

export function DashboardPage({ onNavigate }: { onNavigate: AppNavigate }) {
  const templates = useTemplates()
  const [initialTemplate, setInitialTemplate] = useState<BillTemplate | undefined>()
  const recurring = templates.filter(
    (t) => t.repeatMonthly && t.lastRecordedMonth !== todayKey().slice(0, 7),
  )
  const transactions = useTransactions()
  const salary = useSalaryLogs()
  const summary = useSummary()
  const pageState = useSettlementPageState(transactions.all, transactions.unsettled)
  const alerts = useDashboardAlerts({
    availableBalance: summary.availableBalance,
    netSavings: summary.netSavings,
    personalSpending: summary.personalSpending,
    unsettledTransactions: transactions.unsettled,
  })
  const recentActivities = useActivityFeed({
    transactions: transactions.all,
    salaryLogs: salary.allLogs,
  })
  const pendingPreview = [...transactions.unsettled]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .slice(0, 4)
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="财务总览" description="查看资金与待处理账单">
        <Button variant="outline" onClick={() => pageState.setSalaryDialogOpen(true)}>
          <ArrowDownCircle data-icon="inline-start" />
          录入收入
        </Button>
        <Button
          onClick={() => {
            setInitialTemplate(undefined)
            pageState.setTxnDialogOpen(true)
          }}
        >
          <Plus data-icon="inline-start" />
          记录账单
        </Button>
      </PageHeader>
      {summary.isError && (
        <QueryError
          title="无法刷新资金概况"
          hasData={summary.hasData}
          onRetry={() => {
            void summary.query.refetch()
          }}
          isFetching={summary.query.isFetching}
        />
      )}
      {(summary.hasData || summary.isLoading) && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <BalanceCard
            isLoading={summary.isLoading}
            balance={summary.availableBalance}
            onClick={() => pageState.setPoolOpen(true)}
          />
          <UnsettledBillsCard isLoading={summary.isLoading} amount={summary.billsPending} />
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>累计净结余</CardTitle>
              <CardDescription>工资收入 − 个人支出</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p
                  className={
                    summary.netSavings >= 0
                      ? "text-2xl font-semibold tabular-nums text-income"
                      : "text-2xl font-semibold tabular-nums text-expense"
                  }
                >
                  {currency.format(summary.netSavings)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <DataUpdated timestamp={summary.query.dataUpdatedAt} />
      {!summary.isError &&
        !transactions.query.isError &&
        summary.hasData &&
        transactions.query.isSuccess &&
        transactions.all.length > 0 && (
          <DashboardAlertsSection alerts={alerts} isLoading={false} onNavigate={onNavigate} />
        )}
      {recurring.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>本月常用账单待确认 · {recurring.length} 笔</CardTitle>
            <CardDescription>确认实际金额后录入，本月已记录的模板不再提醒。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {recurring.map((t) => (
              <Button
                key={t.title}
                className="max-w-full"
                variant="outline"
                onClick={() => {
                  setInitialTemplate(t)
                  pageState.setTxnDialogOpen(true)
                }}
              >
                <span className="min-w-0 truncate">{t.title}</span><span className="shrink-0">· {currency.format(t.amount_out)}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle>待处理账单</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("transactions", { status: "open" })}
            >
              查看全部
              <ArrowRight data-icon="inline-end" />
            </Button>
          </CardHeader>
          <CardContent>
            {transactions.query.isLoading && (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-16 w-full" />
                ))}
              </div>
            )}
            {transactions.query.isError && (
              <QueryError
                title="无法刷新账单"
                hasData={Boolean(transactions.query.data)}
                onRetry={() => {
                  void transactions.query.refetch()
                }}
              />
            )}
            {!transactions.query.isLoading &&
              !transactions.query.isError &&
              pendingPreview.length === 0 && (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>
                      {transactions.all.length ? "账单已全部处理" : "记录你的第一笔账单"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {transactions.all.length
                        ? "当前没有待处理账单。"
                        : "日常支出与工作垫付都可以在这里记录。"}
                    </EmptyDescription>
                  </EmptyHeader>
                  {!transactions.all.length && (
                    <EmptyContent>
                      <Button
                        onClick={() => {
                          setInitialTemplate(undefined)
                          pageState.setTxnDialogOpen(true)
                        }}
                      >
                        记录账单
                      </Button>
                    </EmptyContent>
                  )}
                </Empty>
              )}
            <div className="flex flex-col divide-y">
              {pendingPreview.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onNavigate("workbench", { transactionId: t.id })}
                  className="flex min-h-20 w-full items-center justify-between gap-3 py-3 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <CategoryBadge category={t.category} />
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums text-expense">
                    {currency.format(t.amount_out - t.amount_reimbursed)}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        {!transactions.query.isError && !salary.allQuery.isError ? (
          <RecentActivityFeed
            items={recentActivities.slice(0, 5)}
            isLoading={transactions.query.isLoading || salary.allQuery.isLoading}
            onNavigate={onNavigate}
          />
        ) : (
          <QueryError
            title="最近记录尚未完整获取"
            onRetry={() => {
              void transactions.query.refetch()
              void salary.allQuery.refetch()
            }}
          />
        )}
      </div>
      <SettlementDialogs
        initialTemplate={initialTemplate}
        pageState={pageState}
        salary={salary}
        transactions={transactions}
      />
    </div>
  )
}
