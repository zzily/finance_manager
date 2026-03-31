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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ErrorBox } from "../components/common"
import { TradeDeleteDialog } from "../components/dialogs/TradeDeleteDialog"
import { TradeRecordDialog } from "../components/dialogs/TradeRecordDialog"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
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

  const rounded = value >= 100 || Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
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
    return "text-emerald-600"
  }

  if (value < 0) {
    return "text-red-600"
  }

  return "text-slate-600"
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
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
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
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">总</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {valueFormatter(values.total)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">近 30 天</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {valueFormatter(values.month)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">近 7 天</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
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
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey?: string; value?: number; color?: string; name?: string }>
  label?: string
}) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((item) => (
          <div key={`${item.dataKey}-${item.name}`} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span
                className="inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color ?? "#0f172a" }}
              />
              <span>{item.name}</span>
            </div>
            <span className="font-semibold text-slate-900">
              {currency.format(Number(item.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            暂无足够数据
          </div>
        ) : (
          rows.map((row) => (
            <div key={row.key} className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{row.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.trades} 笔 | 胜率 {formatPercent(row.winRate)}
                  </p>
                </div>
                <div className={cn("text-right text-sm font-semibold", getPnlTone(row.netPnl))}>
                  {formatSignedCurrency(row.netPnl)}
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Expectancy {formatSignedCurrency(row.expectancy)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function buildHeatmapDays(calendar: TradeCalendarDay[]) {
  const map = new Map(calendar.map((item) => [item.date, item]))
  const today = new Date()
  const days: Array<TradeCalendarDay & { empty: boolean }> = []

  for (let offset = 55; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
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
    return "bg-slate-100"
  }

  const ratio = Math.abs(value) / maxAbs

  if (value > 0) {
    if (ratio > 0.66) return "bg-emerald-600"
    if (ratio > 0.33) return "bg-emerald-400"
    return "bg-emerald-200"
  }

  if (ratio > 0.66) return "bg-red-600"
  if (ratio > 0.33) return "bg-red-400"
  return "bg-red-200"
}

export function TradingJournalPage() {
  const journal = useTradeJournal()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TradeRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<TradeRecord | null>(null)
  const [query, setQuery] = useState("")
  const [outcomeFilter, setOutcomeFilter] = useState<TradeOutcomeFilter>("all")

  const metrics = useMemo(() => getTradeMetricGroups(journal.records), [journal.records])
  const analytics = useMemo(() => getTradeAnalytics(journal.records), [journal.records])
  const filteredRecords = useMemo(
    () =>
      filterTradeRecords(journal.records, query, outcomeFilter).sort((left, right) =>
        getRecordSortKey(right).localeCompare(getRecordSortKey(left)),
      ),
    [journal.records, outcomeFilter, query],
  )
  const filteredNetPnl = useMemo(
    () => filteredRecords.reduce((sum, record) => sum + getTradeNetPnl(record), 0),
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
  const heatmapAbsMax = Math.max(...heatmapDays.map((item) => Math.abs(item.netPnl)), 0)

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-card">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.09),_transparent_28%),linear-gradient(135deg,#ffffff,#f8fafc)] px-6 py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Trading journal
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                把每笔交易记完整，再把复盘真正做成训练闭环
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                现在这页不只看交易笔数、胜率和结果，还会把计划、执行、错误类型、成本和时间结构一起纳入分析，帮你看清系统在什么 setup、什么时段、什么持仓风格下更容易失真。
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <Badge variant="warning" className="px-3 py-1 text-xs">
                扩展字段当前保存在本机浏览器
              </Badge>
              <Button onClick={handleCreate} disabled={journal.create.isPending}>
                <Plus size={15} />
                新增结构化交易
              </Button>
            </div>
          </div>
        </div>
      </section>

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
          title="Expectancy"
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
          label="Profit Factor"
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
            <div className="flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              录入交易后，这里会显示资金曲线和回撤变化。
            </div>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.equityCurve} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round(value)}`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    name="累计净收益"
                    stroke="#059669"
                    fill="url(#equityFill)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
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
                    "h-8 rounded-xl border border-white/70",
                    getHeatmapTone(day.netPnl, heatmapAbsMax),
                  )}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
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
              <div className="flex h-[180px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                暂无月度数据
              </div>
            ) : (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.monthlyBars} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="netPnl" name="月度净收益" fill="#0f172a" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard title="按 Setup 拆解" rows={analytics.breakouts.bySetup} />
          <BreakdownCard title="按标的拆解" rows={analytics.breakouts.bySymbol} />
          <BreakdownCard title="按时段拆解" rows={analytics.breakouts.bySession} />
          <BreakdownCard title="按持仓风格拆解" rows={analytics.breakouts.byHoldingStyle} />
        </div>

        <div className="space-y-4">
          <SectionCard
            title="Review Loop"
            description="用过程质量指标看最近到底该改什么，而不是只盯着结果。"
            icon={ShieldAlert}
          >
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">连续表现</p>
                <p className="mt-2 text-sm text-slate-600">
                  最长连赢 {metrics.total.longestWinStreak} 笔，最长连亏{" "}
                  {metrics.total.longestLossStreak} 笔。
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">成本占比</p>
                <p className="mt-2 text-sm text-slate-600">
                  手续费和滑点约占总盈利的 {formatPercent(metrics.total.feeRate)}。
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">本轮最该修正</p>
                <p className="mt-2 text-sm text-slate-600">
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
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  先在单笔记录里标记错误类型，这里会自动累计最贵的错误。
                </div>
              ) : (
                analytics.mistakeStats.slice(0, 5).map((item) => (
                  <div key={item.type} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">{TRADE_MISTAKE_LABELS[item.type]}</p>
                      <Badge variant="warning">{item.count} 次</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      关联亏损约 {currency.format(item.lossImpact)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </section>

      <SectionCard
        title="Trade Records"
        description="支持按标的、setup、错误类型和复盘结论搜索，筛到最后就是你最该复盘的那一类交易。"
        icon={BarChart3}
      >
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标的、setup、错误类型、开仓理由或复盘结论"
                className="pl-9"
              />
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
              共 {filteredRecords.length} 笔，筛选后净收益{" "}
              <span className={cn("font-semibold", getPnlTone(filteredNetPnl))}>
                {formatSignedCurrency(filteredNetPnl)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {RESULT_FILTERS.map((filter) => {
              const isActive = filter.value === outcomeFilter

              return (
                <Button
                  key={filter.value}
                  variant={isActive ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setOutcomeFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              )
            })}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {journal.query.isLoading ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              正在加载交易记录...
            </div>
          ) : journal.query.isError ? (
            <ErrorBox msg="交易记录加载失败，请检查后端服务后重试。" />
          ) : filteredRecords.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <BarChart3 size={24} />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-slate-900">还没有可展示的交易记录</h4>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                先录入一笔结构化交易，资金曲线、错误排行榜和维度拆解就会开始累计。
              </p>
              <Button className="mt-5" onClick={handleCreate} disabled={journal.create.isPending}>
                <Plus size={15} />
                新增第一笔交易
              </Button>
            </div>
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
                <article
                  key={record.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-slate-950">{record.symbol}</h4>
                        <Badge variant={getOutcomeBadgeVariant(record)}>
                          {TRADE_OUTCOME_LABELS[getTradeOutcome(netPnl)]}
                        </Badge>
                        <Badge variant="secondary">{TRADE_SIDE_LABELS[record.side]}</Badge>
                        <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                          {TRADE_MARKET_LABELS[record.market]}
                        </Badge>
                        {typeof record.followed_plan === "boolean" ? (
                          <Badge variant={record.followed_plan ? "success" : "warning"}>
                            {record.followed_plan ? "按计划执行" : "偏离计划"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {record.setup?.trim() ? `Setup：${record.setup}` : "未填写 setup"}
                      </p>
                      {record.thesis?.trim() ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">{record.thesis}</p>
                      ) : null}
                    </div>

                    <div className="text-left lg:text-right">
                      <p className={cn("text-2xl font-bold tracking-tight", getPnlTone(netPnl))}>
                        {formatSignedCurrency(netPnl)}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">{record.traded_at}</p>
                      {(record.fees ?? 0) > 0 || (record.slippage ?? 0) > 0 ? (
                        <p className="mt-1 text-xs text-slate-400">
                          毛 {formatSignedCurrency(record.pnl)} / 成本{" "}
                          {currency.format((record.fees ?? 0) + (record.slippage ?? 0))}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">持仓结构</p>
                      <p className="mt-2 text-sm text-slate-700">{getTradeHoldingLabel(record)}</p>
                      <p className="mt-1 text-xs text-slate-500">{getTradeSessionLabel(record)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">价格</p>
                      <p className="mt-2 text-sm text-slate-700">
                        入 {record.entry_price ?? "—"} / 出 {record.exit_price ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        仓位 {record.position_size ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">计划 / 执行</p>
                      <p className="mt-2 text-sm text-slate-700">
                        {record.plan_clarity
                          ? TRADE_PLAN_CLARITY_LABELS[record.plan_clarity]
                          : "未评估计划"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {record.execution_quality
                          ? TRADE_EXECUTION_QUALITY_LABELS[record.execution_quality]
                          : "未评估执行"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">止盈止损</p>
                      <p className="mt-2 text-sm text-slate-700">
                        计划 {record.planned_stop ?? "—"} / {record.planned_target ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        实际 {record.actual_stop ?? "—"} / {record.actual_target ?? "—"}
                      </p>
                    </div>
                  </div>

                  {record.market === "options" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {record.option_right ? (
                        <Badge variant="info">{TRADE_OPTION_RIGHT_LABELS[record.option_right]}</Badge>
                      ) : null}
                      {record.option_structure ? (
                        <Badge variant="info">
                          {TRADE_OPTION_STRUCTURE_LABELS[record.option_structure]}
                        </Badge>
                      ) : null}
                      {record.option_premium_type ? (
                        <Badge variant="info">
                          {TRADE_PREMIUM_TYPE_LABELS[record.option_premium_type]}
                        </Badge>
                      ) : null}
                      {record.option_expiration ? (
                        <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                          到期 {record.option_expiration}
                        </Badge>
                      ) : null}
                      {typeof optionOpenDte === "number" ? (
                        <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                          开仓 DTE {optionOpenDte}
                        </Badge>
                      ) : null}
                      {typeof optionCloseDte === "number" ? (
                        <Badge className="border-slate-200 bg-slate-100 text-slate-700">
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
                        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                            唯一结论
                          </p>
                          <p className="mt-2">{record.lesson}</p>
                        </div>
                      ) : null}
                      {record.note?.trim() ? (
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            备注
                          </p>
                          <p className="mt-2">{record.note}</p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                      <PencilLine size={14} />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record)}
                      disabled={journal.remove.isPending}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                      删除
                    </Button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </SectionCard>

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
