import { useMemo, useState } from "react"
import { ArrowRight } from "lucide-react"
import { CategoryPieChart, MonthlyTrendChart } from "../components/dashboard/Charts"
import { PageHeader } from "../components/common/PageHeader"
import { QueryError, DataUpdated } from "../components/common/QueryState"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "../components/ui/empty"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Skeleton } from "../components/ui/skeleton"
import { Field, FieldLabel } from "../components/ui/field"
import { useSalaryLogs } from "../hooks/useSalaryLogs"
import { useSummary } from "../hooks/useSummary"
import { useTransactions } from "../hooks/useTransactions"
import { todayKey } from "../lib/formHelpers"
import { transactionDate, type AppNavigate } from "../lib/navigation"
import { currency } from "../lib/formatters"
import { cn } from "../lib/utils"
export function MonthlyReviewPage({ onNavigate }: { onNavigate: AppNavigate }) {
  const transactions = useTransactions(),
    salary = useSalaryLogs()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    try {
      return sessionStorage.getItem("finance-review-month") || todayKey().slice(0, 7)
    } catch {
      return todayKey().slice(0, 7)
    }
  })
  const months = useMemo(
    () =>
      Array.from(
        new Set([
          ...transactions.all.map((t) => transactionDate(t).slice(0, 7)),
          ...salary.allLogs.map((l) => l.month),
        ]),
      )
        .sort()
        .reverse(),
    [transactions.all, salary.allLogs],
  )
  const summary = useSummary(selectedMonth),
    trend = useSummary()
  const [year, month] = selectedMonth.split("-")
  const hasRows =
    transactions.all.some((t) => transactionDate(t).startsWith(selectedMonth)) ||
    salary.allLogs.some((l) => l.month === selectedMonth)
  function select(value: string) {
    if (!value) return
    setSelectedMonth(value)
    try {
      sessionStorage.setItem("finance-review-month", value)
    } catch {
      /* Current month still works. */
    }
  }
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="月度复盘" description={`${year} 年 ${Number(month)} 月 · 人民币`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate("transactions", { month: selectedMonth, status: "all" })}
        >
          查看本月账单
          <ArrowRight data-icon="inline-end" />
        </Button>
      </PageHeader>
      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-44">
          <FieldLabel htmlFor="review-month">复盘月份</FieldLabel>
          <Input
            id="review-month"
            type="month"
            value={selectedMonth}
            onChange={(e) => select(e.target.value)}
          />
        </Field>
        <Button variant="ghost" size="sm" onClick={() => select(todayKey().slice(0, 7))}>
          本月
        </Button>
        {months
          .filter((m) => m !== selectedMonth)
          .slice(0, 3)
          .map((m) => (
            <Button key={m} variant="outline" size="sm" onClick={() => select(m)}>
              {m}
            </Button>
          ))}
      </div>
      {summary.isError && (
        <QueryError
          title="无法刷新月度汇总"
          hasData={summary.hasData}
          onRetry={() => {
            void summary.query.refetch()
          }}
          isFetching={summary.query.isFetching}
        />
      )}
      {summary.isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-28 w-full" />
          ))}
        </div>
      )}
      {summary.hasData && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "工资收入",
                value: summary.familyLoop?.gross_income ?? 0,
                hint: "归属本月的工资到账",
                tone: "text-income",
              },
              {
                label: "个人支出",
                value: summary.personalSpending,
                hint: "本月个人消费",
                tone: "text-expense",
              },
              {
                label: "净结余",
                value: summary.netSavings,
                hint: "工资收入 − 个人支出",
                tone: summary.netSavings >= 0 ? "text-income" : "text-expense",
              },
              {
                label: "工作账单未结",
                value: summary.businessDebt,
                hint: "本月工作账单当前未关联金额",
                tone: "text-foreground",
              },
            ].map((m) => (
              <Card key={m.label}>
                <CardHeader>
                  <CardTitle>{m.label}</CardTitle>
                  <CardDescription>{m.hint}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className={cn("text-xl font-semibold tabular-nums", m.tone)}>
                    {currency.format(m.value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <DataUpdated timestamp={summary.query.dataUpdatedAt} />
          {!transactions.query.isLoading &&
            !salary.allQuery.isLoading &&
            !transactions.query.isError &&
            !salary.allQuery.isError &&
            !hasRows && (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>这个月还没有记录</EmptyTitle>
                  <EmptyDescription>可切换其他月份查看，或开始记录账单。</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          <Card>
            <CardHeader>
              <CardTitle>本月收支</CardTitle>
              <CardDescription>
                工资 {currency.format(summary.familyLoop?.gross_income ?? 0)}
                ，个人支出 {currency.format(summary.personalSpending)}
                。工作垫付与报销单独统计。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() =>
                  onNavigate("transactions", {
                    month: selectedMonth,
                    category: "personal",
                    status: "all",
                  })
                }
              >
                查看个人支出明细
              </Button>
            </CardContent>
          </Card>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {trend.isError ? (
              <QueryError
                title="无法刷新收支趋势"
                hasData={trend.hasData}
                onRetry={() => {
                  void trend.query.refetch()
                }}
              />
            ) : (
              <MonthlyTrendChart
                data={
                  trend.chartData
                    ? {
                        ...trend.chartData,
                        monthly_timeline: trend.chartData.monthly_timeline.slice(-6),
                      }
                    : null
                }
                isLoading={trend.isLoading}
              />
            )}
            <CategoryPieChart data={summary.chartData} isLoading={summary.isLoading} />
          </div>
        </>
      )}
    </div>
  )
}
