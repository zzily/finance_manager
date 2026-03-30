import { useMemo, useState } from "react"

import {
  BarChart3,
  NotebookPen,
  PencilLine,
  Plus,
  Search,
  Target,
  Trash2,
  Wallet,
} from "lucide-react"

import { ErrorBox } from "../components/common"
import { TradeDeleteDialog } from "../components/dialogs/TradeDeleteDialog"
import { TradeRecordDialog } from "../components/dialogs/TradeRecordDialog"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useTradeJournal } from "../hooks/useTradeJournal"
import { currency } from "../lib/formatters"
import { filterTradeRecords, getTradeMetricGroups, getTradeOutcome, type TradeOutcomeFilter } from "../lib/tradeMetrics"
import {
  TRADE_MARKET_LABELS,
  TRADE_OUTCOME_LABELS,
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

function formatPercent(value: number) {
  const rounded = value >= 100 || Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
  return `${rounded}%`
}

function getOutcomeBadgeVariant(record: TradeRecord) {
  const outcome = getTradeOutcome(record.pnl)

  if (outcome === "win") {
    return "success" as const
  }

  if (outcome === "loss") {
    return "destructive" as const
  }

  return "secondary" as const
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

function StatCard({
  description,
  icon: Icon,
  title,
  valueFormatter,
  values,
}: {
  description: string
  icon: typeof NotebookPen
  title: string
  valueFormatter: (value: number) => string
  values: {
    total: number
    month: number
    week: number
  }
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
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

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
    </div>
  )
}

export function TradingJournalPage() {
  const journal = useTradeJournal()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TradeRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<TradeRecord | null>(null)
  const [query, setQuery] = useState("")
  const [outcomeFilter, setOutcomeFilter] = useState<TradeOutcomeFilter>("all")

  const metrics = useMemo(() => getTradeMetricGroups(journal.records), [journal.records])
  const filteredRecords = useMemo(
    () => filterTradeRecords(journal.records, query, outcomeFilter),
    [journal.records, outcomeFilter, query],
  )
  const filteredProfit = useMemo(
    () => filteredRecords.reduce((sum, record) => sum + record.pnl, 0),
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
      journal.update(editingRecord.id, input)
    } else {
      journal.create(input)
    }

    setDialogOpen(false)
    setEditingRecord(null)
  }

  function handleDeleteConfirm() {
    if (!deletingRecord) {
      return
    }

    journal.remove(deletingRecord.id)
    setDeletingRecord(null)
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Trading journal
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              用统一口径记录每一笔交易，再看胜率和收益是不是在变好
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              这页会自动统计总交易笔数、近 30 天和近 7 天的胜率与净收益。首版数据先保存在当前浏览器里，适合你先把记录习惯养起来。
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:min-w-[280px] sm:items-end">
            <Badge variant="info" className="px-3 py-1 text-xs">
              数据当前保存在本地浏览器
            </Badge>
            <Button onClick={handleCreate}>
              <Plus size={15} />
              新增交易记录
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <StatCard
          title="交易笔数"
          description="所有记录都会进入笔数统计，方便你看执行密度是否稳定。"
          icon={NotebookPen}
          valueFormatter={(value) => `${value}`}
          values={{
            total: metrics.total.count,
            month: metrics.month.count,
            week: metrics.week.count,
          }}
        />
        <StatCard
          title="胜率"
          description="胜率按盈利笔数 / 总笔数计算，帮助你观察最近执行质量。"
          icon={Target}
          valueFormatter={formatPercent}
          values={{
            total: metrics.total.winRate,
            month: metrics.month.winRate,
            week: metrics.week.winRate,
          }}
        />
        <StatCard
          title="净收益"
          description="收益使用每笔记录的净盈亏汇总，正负都会原样纳入统计。"
          icon={Wallet}
          valueFormatter={formatSignedCurrency}
          values={{
            total: metrics.total.profit,
            month: metrics.month.profit,
            week: metrics.week.profit,
          }}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Trade records
              </p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                交易日志列表
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                支持搜索标的、策略标签和备注；你可以先用结果筛选收窄范围，再编辑或删除。
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <p className="font-medium text-slate-900">当前筛选结果</p>
              <p className="mt-1">
                共 {filteredRecords.length} 笔，净收益{" "}
                <span className={cn("font-semibold", getPnlTone(filteredProfit))}>
                  {formatSignedCurrency(filteredProfit)}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标的、策略标签或备注"
                className="pl-9"
              />
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
            {filteredRecords.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <BarChart3 size={24} />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-slate-900">
                  还没有可展示的交易记录
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  先录入一笔完整交易，这里就会开始累计你的笔数、胜率和收益表现。
                </p>
                <Button className="mt-5" onClick={handleCreate}>
                  <Plus size={15} />
                  新增第一笔交易
                </Button>
              </div>
            ) : (
              filteredRecords.map((record) => {
                const outcome = getTradeOutcome(record.pnl)

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
                            {TRADE_OUTCOME_LABELS[outcome]}
                          </Badge>
                          <Badge variant="secondary">{TRADE_SIDE_LABELS[record.side]}</Badge>
                          <Badge className="border-slate-200 bg-slate-100 text-slate-700">
                            {TRADE_MARKET_LABELS[record.market]}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {record.setup?.trim() ? `策略：${record.setup}` : "未填写策略标签"}
                        </p>
                      </div>

                      <div className="text-left lg:text-right">
                        <p
                          className={cn(
                            "text-2xl font-bold tracking-tight",
                            getPnlTone(record.pnl),
                          )}
                        >
                          {formatSignedCurrency(record.pnl)}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">{record.traded_at}</p>
                      </div>
                    </div>

                    {record.note?.trim() && (
                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        {record.note}
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
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Design note
            </p>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              这版先只保留最关键的三组指标
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              先养成稳定记录的习惯，比一开始就塞进太多高阶指标更重要。所以当前只保留笔数、胜率、净收益，以及最必要的 CRUD。
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold text-slate-900">下一步最值得加</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
              <li>1. 标签和策略维度汇总，看看哪些 setup 胜率更稳定。</li>
              <li>2. 手续费字段，让净收益口径更接近真实结果。</li>
              <li>3. 导出 CSV，方便你长期备份和外部复盘。</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-card">
            <p className="text-sm font-semibold text-amber-900">建议先别加</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
              <li>1. 先不要做太多复杂指标，比如 MFE/MAE、夏普、盈亏比矩阵。</li>
              <li>2. 如果你还没稳定记录，暂时也别拆太多账户和多资金曲线。</li>
              <li>3. 先别把页面做成大而全的量化平台，容易让输入成本高过复盘收益。</li>
            </ul>
          </div>

          {journal.records.length === 0 && (
            <ErrorBox msg="当前还没有任何交易记录，顶部按钮新增后会开始自动累计统计。" />
          )}
        </div>
      </section>

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
      />
    </div>
  )
}
