import { useMemo, useState, type ReactNode } from "react"

import {
  AlertTriangle,
  BarChart3,
  LineChart as LineChartIcon,
  PencilLine,
  Plus,
  Search,
  ShieldAlert,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import { PageHeader } from "../components/common/PageHeader"
import { QueryError, DataUpdated } from "../components/common/QueryState"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "../components/ui/empty"
import { ErrorBox } from "../components/common"
import { TradeDeleteDialog } from "../components/dialogs/TradeDeleteDialog"
import { TradeRecordDialog } from "../components/dialogs/TradeRecordDialog"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../components/ui/input-group"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ui/chart"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert"
import { Skeleton } from "../components/ui/skeleton"
import { useTradeJournal } from "../hooks/useTradeJournal"
import { currency } from "../lib/formatters"
import {
  filterTradeRecords,
  getOptionDaysToExpiration,
  getTradeAnalytics,
  getTradeHoldingLabel,
  getTradeMetricGroups,
  getTradeNetPnl,
  getTradeOutcome,
  getTradeSessionLabel,
  type TradeCalendarDay,
  type TradeOutcomeFilter,
} from "../lib/tradeMetrics"
import {
  TRADE_EXECUTION_QUALITY_LABELS,
  TRADE_MARKET_LABELS,
  TRADE_MISTAKE_LABELS,
  TRADE_OPTION_RIGHT_LABELS,
  TRADE_OPTION_STRUCTURE_LABELS,
  TRADE_OUTCOME_LABELS,
  TRADE_PLAN_CLARITY_LABELS,
  TRADE_PREMIUM_TYPE_LABELS,
  TRADE_SIDE_LABELS,
} from "../lib/tradeOptions"
import { cn } from "../lib/utils"
import type { TradeRecord, TradeRecordInput } from "../types"

const journalChartConfig = {
  equity: { label: "累计净收益", color: "hsl(var(--chart-1))" },
  netPnl: { label: "月度净收益", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig

const RESULT_FILTERS: Array<{ label: string; value: TradeOutcomeFilter }> = [
  { label: "全部结果", value: "all" },
  { label: "只看盈利", value: "win" },
  { label: "只看亏损", value: "loss" },
  { label: "只看保本", value: "flat" },
]

function formatSignedCurrency(value: number) {
  if (value > 0) {
    return `+${currency.format(value)}`
  }

  if (value < 0) {
    return `-${currency.format(Math.abs(value))}`
  }

  return currency.format(0)
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "未标记"
  }

  const rounded =
    value >= 100 || Number.isInteger(value)
      ? value.toFixed(0)
      : value.toFixed(1)
  return `${rounded}%`
}

function formatRatio(value: number | null) {
  if (value === null) {
    return "—"
  }

  return value.toFixed(2)
}

function formatMinutes(value: number | null) {
  if (value === null) {
    return "未标注"
  }

  if (value >= 24 * 60) {
    return `${(value / (24 * 60)).toFixed(1)} 天`
  }

  if (value >= 60) {
    return `${(value / 60).toFixed(1)} 小时`
  }

  return `${Math.round(value)} 分钟`
}

function getPnlTone(value: number) {
  if (value > 0) {
    return "text-income"
  }

  if (value < 0) {
    return "text-expense"
  }

  return "text-muted-foreground"
}

function getOutcomeBadgeVariant(record: TradeRecord) {
  const outcome = getTradeOutcome(getTradeNetPnl(record))

  if (outcome === "win") {
    return "success" as const
  }

  if (outcome === "loss") {
    return "destructive" as const
  }

  return "secondary" as const
}

function getRecordSortKey(record: TradeRecord) {
  return record.exit_at ?? record.entry_at ?? `${record.traded_at}T00:00`
}

function SectionCard({
  title,
  description,
  children,
  icon: Icon,
}: {
  title: string
  description: string
  children: ReactNode
  icon: typeof Target
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-2 leading-6">
            {description}
          </CardDescription>
        </div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-foreground">
          <Icon size={18} />
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function OverviewCard({
  title,
  description,
  valueFormatter,
  values,
  icon: Icon,
}: {
  title: string
  description: string
  valueFormatter: (value: number | null) => string
  values: {
    total: number | null
    month: number | null
    week: number | null
  }
  icon: typeof Target
}) {
  return (
    <SectionCard title={title} description={description} icon={Icon}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-muted px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">总</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {valueFormatter(values.total)}
          </p>
        </div>
        <div className="rounded-2xl bg-muted px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">近 30 天</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {valueFormatter(values.month)}
          </p>
        </div>
        <div className="rounded-2xl bg-muted px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">近 7 天</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {valueFormatter(values.week)}
          </p>
        </div>
      </div>
    </SectionCard>
  )
}

function MiniMetric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function BreakdownCard({
  title,
  rows,
}: {
  title: string
  rows: Array<{
    key: string
    label: string
    trades: number
    winRate: number
    netPnl: number
    expectancy: number
  }>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>暂无足够数据</EmptyTitle>
              <EmptyDescription>交易记录累计后显示分组统计。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="rounded-2xl bg-muted px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {row.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.trades} 笔 | 胜率 {formatPercent(row.winRate)}
                  </p>
                </div>
                <div
                  className={cn(
                    "text-right text-sm font-semibold",
                    getPnlTone(row.netPnl),
                  )}
                >
                  {formatSignedCurrency(row.netPnl)}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                单笔期望 {formatSignedCurrency(row.expectancy)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function buildHeatmapDays(calendar: TradeCalendarDay[]) {
  const map = new Map(calendar.map((item) => [item.date, item]))
  const today = new Date()
  const days: Array<TradeCalendarDay & { empty: boolean }> = []

  for (let offset = 55; offset >= 0; offset -= 1) {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - offset,
    )
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-")
    const existing = map.get(key)

    days.push(
      existing
        ? { ...existing, empty: false }
        : {
            date: key,
            label: key.slice(5),
            netPnl: 0,
            count: 0,
            empty: true,
          },
    )
  }

  return days
}

function getHeatmapTone(value: number, maxAbs: number) {
  if (value === 0 || maxAbs === 0) {
    return "bg-muted"
  }

  const ratio = Math.abs(value) / maxAbs

  if (value > 0) {
    if (ratio > 0.66) return "bg-income"
    if (ratio > 0.33) return "bg-income/60"
    return "bg-income/30"
  }

  if (ratio > 0.66) return "bg-destructive"
  if (ratio > 0.33) return "bg-destructive/60"
  return "bg-destructive/30"
}

export function TradingJournalPage() {
  const journal = useTradeJournal()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TradeRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<TradeRecord | null>(null)
  const [query, setQuery] = useState("")
  const [outcomeFilter, setOutcomeFilter] = useState<TradeOutcomeFilter>("all")

  const metrics = useMemo(
    () => getTradeMetricGroups(journal.records),
    [journal.records],
  )
  const analytics = useMemo(
    () => getTradeAnalytics(journal.records),
    [journal.records],
  )
  const filteredRecords = useMemo(
    () =>
      filterTradeRecords(journal.records, query, outcomeFilter).sort(
        (left, right) =>
          getRecordSortKey(right).localeCompare(getRecordSortKey(left)),
      ),
    [journal.records, outcomeFilter, query],
  )
  const filteredNetPnl = useMemo(
    () =>
      filteredRecords.reduce((sum, record) => sum + getTradeNetPnl(record), 0),
    [filteredRecords],
  )

  function handleCreate() {
    setEditingRecord(null)
    setDialogOpen(true)
  }

  function handleEdit(record: TradeRecord) {
    setEditingRecord(record)
    setDialogOpen(true)
  }

  function handleDelete(record: TradeRecord) {
    setDeletingRecord(record)
  }

  function handleSubmit(input: TradeRecordInput) {
    if (editingRecord) {
      journal.update.mutate(
        { id: editingRecord.id, payload: input },
        {
          onSuccess: () => {
            setDialogOpen(false)
            setEditingRecord(null)
          },
        },
      )
      return
    }

    journal.create.mutate(input, {
      onSuccess: () => {
        setDialogOpen(false)
        setEditingRecord(null)
      },
    })
  }

  function handleDeleteConfirm() {
    if (!deletingRecord) {
      return
    }

    journal.remove.mutate(deletingRecord.id, {
      onSuccess: () => {
        setDeletingRecord(null)
      },
    })
  }

  const heatmapDays = buildHeatmapDays(analytics.calendar)
  const heatmapAbsMax = Math.max(
    ...heatmapDays.map((item) => Math.abs(item.netPnl)),
    0,
  )

  return (
    <div className="space-y-5">
      <PageHeader title="交易记录" description="记录盈亏，按需补充复盘">
        <Button onClick={handleCreate} disabled={journal.create.isPending}>
          <Plus data-icon="inline-start" />
          记录交易
        </Button>
      </PageHeader>
      {journal.query.isError && (
        <QueryError
          title="无法刷新交易记录"
          hasData={Boolean(journal.query.data)}
          isFetching={journal.query.isFetching}
          onRetry={() => {
            void journal.query.refetch()
          }}
        />
      )}
      <DataUpdated timestamp={journal.query.dataUpdatedAt} />
      <Tabs defaultValue="records">
        <TabsList aria-label="交易视图">
          <TabsTrigger value="records">记录</TabsTrigger>
          <TabsTrigger value="analysis">分析与复盘</TabsTrigger>
        </TabsList>
        <TabsContent value="analysis" className="space-y-4">
          {journal.query.data ? (
            <>
              <section className="grid gap-4 xl:grid-cols-3">
                <OverviewCard
                  title="交易笔数"
                  description="先确认记录密度是否稳定，避免因为样本太少误判自己进步了。"
                  icon={Target}
                  valueFormatter={(value) => `${value ?? 0}`}
                  values={{
                    total: metrics.total.count,
                    month: metrics.month.count,
                    week: metrics.week.count,
                  }}
                />
                <OverviewCard
                  title="真实净收益"
                  description="交易盈亏会扣掉手续费和滑点，结果口径更接近你真实账户曲线。"
                  icon={TrendingUp}
                  valueFormatter={(value) => formatSignedCurrency(value ?? 0)}
                  values={{
                    total: metrics.total.netPnl,
                    month: metrics.month.netPnl,
                    week: metrics.week.netPnl,
                  }}
                />
                <OverviewCard
                  title="单笔期望"
                  description="单笔期望更适合判断系统是不是在稳步变好，而不是只看偶发大赚。"
                  icon={LineChartIcon}
                  valueFormatter={(value) => formatSignedCurrency(value ?? 0)}
                  values={{
                    total: metrics.total.expectancy,
                    month: metrics.month.expectancy,
                    week: metrics.week.expectancy,
                  }}
                />
              </section>

              <section className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4">
                <MiniMetric
                  label="胜率"
                  value={formatPercent(metrics.total.winRate)}
                  hint="盈利笔数 / 总笔数"
                />
                <MiniMetric
                  label="平均盈亏"
                  value={`${formatSignedCurrency(metrics.total.averageWin)} / -${currency.format(metrics.total.averageLoss)}`}
                  hint="观察是否出现赚小亏大"
                />
                <MiniMetric
                  label="盈亏比"
                  value={formatRatio(metrics.total.payoffRatio)}
                  hint="平均盈利 / 平均亏损"
                />
                <MiniMetric
                  label="盈利因子"
                  value={formatRatio(metrics.total.profitFactor)}
                  hint="总盈利 / 总亏损"
                />
                <MiniMetric
                  label="最大回撤"
                  value={formatSignedCurrency(-metrics.total.maxDrawdown)}
                  hint="从峰值回撤的最大幅度"
                />
                <MiniMetric
                  label="平均持仓"
                  value={formatMinutes(metrics.total.averageHoldingMinutes)}
                  hint="判断你更像短打还是波段"
                />
                <MiniMetric
                  label="计划执行率"
                  value={formatPercent(metrics.total.planAdherenceRate)}
                  hint="只统计已经标记过的记录"
                />
                <MiniMetric
                  label="最差单日"
                  value={formatSignedCurrency(metrics.total.worstDayPnl)}
                  hint="帮助设定日损限制"
                />
              </section>

              <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
                <SectionCard
                  title="Equity Curve"
                  description="先看问题是偶发大亏，还是一段时间持续失真。"
                  icon={LineChartIcon}
                >
                  {analytics.equityCurve.length === 0 ? (
                    <Empty className="h-[320px]">
                      <EmptyHeader>
                        <EmptyTitle>暂无分析数据</EmptyTitle>
                        <EmptyDescription>
                          录入交易后，这里会显示资金曲线和回撤变化。
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="h-[320px]">
                      <ChartContainer
                        config={journalChartConfig}
                        className="h-full w-full aspect-auto"
                      >
                        <AreaChart
                          accessibilityLayer
                          data={analytics.equityCurve}
                          margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="equityFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="var(--color-equity)"
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--color-equity)"
                                stopOpacity={0.04}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            stroke="hsl(var(--border))"
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="label"
                            tick={{
                              fontSize: 11,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{
                              fontSize: 11,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${Math.round(value)}`}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                valueFormatter={(value) =>
                                  currency.format(Number(value))
                                }
                              />
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="equity"
                            name="累计净收益"
                            stroke="var(--color-equity)"
                            fill="url(#equityFill)"
                            strokeWidth={2.5}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </div>
                  )}
                </SectionCard>

                <div className="space-y-4">
                  <SectionCard
                    title="Heatmap"
                    description="把每天结果摊开看，很快就能知道是偶发爆仓还是连亏成串。"
                    icon={BarChart3}
                  >
                    <div className="grid grid-cols-7 gap-2">
                      {heatmapDays.map((day) => (
                        <div
                          key={day.date}
                          title={`${day.date} · ${formatSignedCurrency(day.netPnl)} · ${day.count} 笔`}
                          className={cn(
                            "h-8 rounded-xl border border-background/70",
                            getHeatmapTone(day.netPnl, heatmapAbsMax),
                          )}
                        />
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>近 8 周</span>
                      <span>绿 = 盈利，红 = 亏损</span>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="Monthly"
                    description="看每个月是靠偶发好月拉起来，还是已经开始稳定赚钱。"
                    icon={TrendingUp}
                  >
                    {analytics.monthlyBars.length === 0 ? (
                      <Empty className="h-[180px]">
                        <EmptyHeader>
                          <EmptyTitle>暂无分析数据</EmptyTitle>
                          <EmptyDescription>暂无月度数据</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="h-[180px]">
                        <ChartContainer
                          config={journalChartConfig}
                          className="h-full w-full aspect-auto"
                        >
                          <BarChart
                            accessibilityLayer
                            data={analytics.monthlyBars}
                            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                          >
                            <CartesianGrid
                              stroke="hsl(var(--border))"
                              strokeDasharray="3 3"
                            />
                            <XAxis
                              dataKey="label"
                              tick={{
                                fontSize: 11,
                                fill: "hsl(var(--muted-foreground))",
                              }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              tick={{
                                fontSize: 11,
                                fill: "hsl(var(--muted-foreground))",
                              }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <ChartTooltip
                              content={
                                <ChartTooltipContent
                                  valueFormatter={(value) =>
                                    currency.format(Number(value))
                                  }
                                />
                              }
                            />
                            <Bar
                              dataKey="netPnl"
                              name="月度净收益"
                              fill="var(--color-netPnl)"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    )}
                  </SectionCard>
                </div>
              </section>

              <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
                <div className="grid gap-4 lg:grid-cols-2">
                  <BreakdownCard
                    title="按 Setup 拆解"
                    rows={analytics.breakouts.bySetup}
                  />
                  <BreakdownCard
                    title="按标的拆解"
                    rows={analytics.breakouts.bySymbol}
                  />
                  <BreakdownCard
                    title="按时段拆解"
                    rows={analytics.breakouts.bySession}
                  />
                  <BreakdownCard
                    title="按持仓风格拆解"
                    rows={analytics.breakouts.byHoldingStyle}
                  />
                </div>

                <div className="space-y-4">
                  <SectionCard
                    title="Review Loop"
                    description="用过程质量指标看最近到底该改什么，而不是只盯着结果。"
                    icon={ShieldAlert}
                  >
                    <div className="space-y-3">
                      <div className="rounded-2xl bg-muted px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          连续表现
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          最长连赢 {metrics.total.longestWinStreak} 笔，最长连亏{" "}
                          {metrics.total.longestLossStreak} 笔。
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          成本占比
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          手续费和滑点约占总盈利的{" "}
                          {formatPercent(metrics.total.feeRate)}。
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          本轮最该修正
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {analytics.mistakeStats[0]
                            ? `${TRADE_MISTAKE_LABELS[analytics.mistakeStats[0].type]} 出现 ${analytics.mistakeStats[0].count} 次，累计代价 ${currency.format(analytics.mistakeStats[0].lossImpact)}。`
                            : "还没有记录错误类型，建议开始给亏损单补上错误标签。"}
                        </p>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard
                    title="错误排行榜"
                    description="亏损不是重点，亏损里最贵的错误才是重点。"
                    icon={AlertTriangle}
                  >
                    <div className="space-y-3">
                      {analytics.mistakeStats.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                          先在单笔记录里标记错误类型，这里会自动累计最贵的错误。
                        </div>
                      ) : (
                        analytics.mistakeStats.slice(0, 5).map((item) => (
                          <div
                            key={item.type}
                            className="rounded-2xl bg-muted px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium text-foreground">
                                {TRADE_MISTAKE_LABELS[item.type]}
                              </p>
                              <Badge variant="warning">{item.count} 次</Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              关联亏损约 {currency.format(item.lossImpact)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </SectionCard>
                </div>
              </section>
            </>
          ) : (
            <p className="py-8 text-sm text-muted-foreground">
              {journal.query.isLoading
                ? "正在加载分析数据…"
                : "获取记录后展示分析"}
            </p>
          )}
        </TabsContent>
        <TabsContent value="records">
          <SectionCard
            title="交易明细"
            description="搜索标的、策略或复盘结论。"
            icon={BarChart3}
          >
            <div className="flex flex-col gap-4 rounded-3xl border border-border bg-muted/80 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <InputGroup className="flex-1">
                  <InputGroupInput
                    aria-label="搜索交易记录"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="搜索标的、setup、错误类型、开仓理由或复盘结论"
                  />
                  <InputGroupAddon>
                    <Search aria-hidden="true" />
                  </InputGroupAddon>
                </InputGroup>
                {journal.query.data && (
                  <div className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground">
                    共 {filteredRecords.length} 笔，筛选后净收益{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        getPnlTone(filteredNetPnl),
                      )}
                    >
                      {formatSignedCurrency(filteredNetPnl)}
                    </span>
                  </div>
                )}
              </div>

              <ToggleGroup
                type="single"
                aria-label="盈亏筛选"
                value={outcomeFilter}
                onValueChange={(v) => {
                  if (v) setOutcomeFilter(v as TradeOutcomeFilter)
                }}
                className="flex-wrap justify-start"
              >
                {RESULT_FILTERS.map((filter) => (
                  <ToggleGroupItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="mt-5 space-y-3">
              {journal.query.isLoading ? (
                <div
                  role="status"
                  aria-label="正在加载交易记录"
                  className="flex flex-col gap-3"
                >
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : journal.query.isError && !journal.query.data ? (
                <ErrorBox msg="交易记录加载失败，请检查后端服务后重试。" />
              ) : filteredRecords.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>
                      {query || outcomeFilter !== "all"
                        ? "没有符合条件的交易"
                        : "暂无交易记录"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {query || outcomeFilter !== "all"
                        ? "调整筛选后再试。"
                        : "先记录一笔交易，分析会随记录累计。"}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      onClick={
                        query || outcomeFilter !== "all"
                          ? () => {
                              setQuery("")
                              setOutcomeFilter("all")
                            }
                          : handleCreate
                      }
                    >
                      {query || outcomeFilter !== "all"
                        ? "清空筛选"
                        : "记录第一笔交易"}
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                filteredRecords.map((record) => {
                  const netPnl = getTradeNetPnl(record)
                  const optionOpenDte = getOptionDaysToExpiration(
                    record.option_expiration,
                    record.entry_at,
                  )
                  const optionCloseDte = getOptionDaysToExpiration(
                    record.option_expiration,
                    record.exit_at,
                  )

                  return (
                    <Card
                      key={record.id}
                      role="article"
                      className="transition-colors hover:border-input"
                    >
                      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-lg">
                              {record.symbol}
                            </CardTitle>
                            <Badge variant={getOutcomeBadgeVariant(record)}>
                              {TRADE_OUTCOME_LABELS[getTradeOutcome(netPnl)]}
                            </Badge>
                            <Badge variant="secondary">
                              {TRADE_SIDE_LABELS[record.side]}
                            </Badge>
                            <Badge variant="secondary">
                              {TRADE_MARKET_LABELS[record.market]}
                            </Badge>
                            {typeof record.followed_plan === "boolean" ? (
                              <Badge
                                variant={
                                  record.followed_plan ? "success" : "warning"
                                }
                              >
                                {record.followed_plan
                                  ? "按计划执行"
                                  : "偏离计划"}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {record.setup?.trim()
                              ? `Setup：${record.setup}`
                              : "未填写 setup"}
                          </p>
                          {record.thesis?.trim() ? (
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {record.thesis}
                            </p>
                          ) : null}
                        </div>

                        <div className="text-left lg:text-right">
                          <p
                            className={cn(
                              "text-2xl font-bold tracking-tight",
                              getPnlTone(netPnl),
                            )}
                          >
                            {formatSignedCurrency(netPnl)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {record.traded_at}
                          </p>
                          {(record.fees ?? 0) > 0 ||
                          (record.slippage ?? 0) > 0 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              毛 {formatSignedCurrency(record.pnl)} / 成本{" "}
                              {currency.format(
                                (record.fees ?? 0) + (record.slippage ?? 0),
                              )}
                            </p>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <details className="mt-4">
                          <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-muted-foreground">
                            查看交易与复盘详情
                          </summary>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl bg-muted px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                持仓结构
                              </p>
                              <p className="mt-2 text-sm text-foreground">
                                {getTradeHoldingLabel(record)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {getTradeSessionLabel(record)}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-muted px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                价格
                              </p>
                              <p className="mt-2 text-sm text-foreground">
                                入 {record.entry_price ?? "—"} / 出{" "}
                                {record.exit_price ?? "—"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                仓位 {record.position_size ?? "—"}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-muted px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                计划 / 执行
                              </p>
                              <p className="mt-2 text-sm text-foreground">
                                {record.plan_clarity
                                  ? TRADE_PLAN_CLARITY_LABELS[
                                      record.plan_clarity
                                    ]
                                  : "未评估计划"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {record.execution_quality
                                  ? TRADE_EXECUTION_QUALITY_LABELS[
                                      record.execution_quality
                                    ]
                                  : "未评估执行"}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-muted px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                止盈止损
                              </p>
                              <p className="mt-2 text-sm text-foreground">
                                计划 {record.planned_stop ?? "—"} /{" "}
                                {record.planned_target ?? "—"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                实际 {record.actual_stop ?? "—"} /{" "}
                                {record.actual_target ?? "—"}
                              </p>
                            </div>
                          </div>

                          {record.market === "options" ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {record.option_right ? (
                                <Badge variant="info">
                                  {
                                    TRADE_OPTION_RIGHT_LABELS[
                                      record.option_right
                                    ]
                                  }
                                </Badge>
                              ) : null}
                              {record.option_structure ? (
                                <Badge variant="info">
                                  {
                                    TRADE_OPTION_STRUCTURE_LABELS[
                                      record.option_structure
                                    ]
                                  }
                                </Badge>
                              ) : null}
                              {record.option_premium_type ? (
                                <Badge variant="info">
                                  {
                                    TRADE_PREMIUM_TYPE_LABELS[
                                      record.option_premium_type
                                    ]
                                  }
                                </Badge>
                              ) : null}
                              {record.option_expiration ? (
                                <Badge variant="secondary">
                                  到期 {record.option_expiration}
                                </Badge>
                              ) : null}
                              {typeof optionOpenDte === "number" ? (
                                <Badge variant="secondary">
                                  开仓 DTE {optionOpenDte}
                                </Badge>
                              ) : null}
                              {typeof optionCloseDte === "number" ? (
                                <Badge variant="secondary">
                                  平仓 DTE {optionCloseDte}
                                </Badge>
                              ) : null}
                            </div>
                          ) : null}

                          {record.mistake_tags.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {record.mistake_tags.map((tag) => (
                                <Badge key={tag} variant="warning">
                                  {TRADE_MISTAKE_LABELS[tag]}
                                </Badge>
                              ))}
                            </div>
                          ) : null}

                          {(record.lesson?.trim() || record.note?.trim()) && (
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              {record.lesson?.trim() ? (
                                <Alert variant="success">
                                  <AlertTitle>唯一结论</AlertTitle>
                                  <AlertDescription>
                                    {record.lesson}
                                  </AlertDescription>
                                </Alert>
                              ) : null}
                              {record.note?.trim() ? (
                                <div className="rounded-2xl bg-muted px-4 py-3 text-sm leading-6 text-muted-foreground">
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    备注
                                  </p>
                                  <p className="mt-2">{record.note}</p>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </details>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <PencilLine data-icon="inline-start" />
                            编辑
                          </Button>
                          <Button
                            variant="destructive-ghost"
                            size="sm"
                            onClick={() => handleDelete(record)}
                            disabled={journal.remove.isPending}
                          >
                            <Trash2 data-icon="inline-start" />
                            删除
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
      <TradeRecordDialog
        key={`${editingRecord?.id ?? "new"}-${dialogOpen ? "open" : "closed"}`}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingRecord(null)
          }
        }}
        onSubmit={handleSubmit}
        record={editingRecord}
        isPending={journal.create.isPending || journal.update.isPending}
      />

      <TradeDeleteDialog
        open={Boolean(deletingRecord)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRecord(null)
          }
        }}
        onConfirm={handleDeleteConfirm}
        record={deletingRecord}
        isPending={journal.remove.isPending}
      />
    </div>
  )
}
