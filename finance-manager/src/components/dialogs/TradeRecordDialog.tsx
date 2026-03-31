import { useMemo, useState, type ReactNode } from "react"

import { ErrorBox } from "../common"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Input } from "../ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  TRADE_EXECUTION_QUALITY_OPTIONS,
  TRADE_MARKET_OPTIONS,
  TRADE_MISTAKE_LABELS,
  TRADE_MISTAKE_OPTIONS,
  TRADE_OPTION_RIGHT_OPTIONS,
  TRADE_OPTION_STRUCTURE_OPTIONS,
  TRADE_PLAN_CLARITY_OPTIONS,
  TRADE_PREMIUM_TYPE_OPTIONS,
  TRADE_SIDE_OPTIONS,
} from "../../lib/tradeOptions"
import { currency } from "../../lib/formatters"
import type {
  TradeExecutionQuality,
  TradeMistakeType,
  TradeOptionRight,
  TradeOptionStructure,
  TradePlanClarity,
  TradePremiumType,
  TradeRecord,
  TradeRecordInput,
} from "../../types"

type BooleanSelectValue = "unknown" | "true" | "false"
type NullablePlanClarity = TradePlanClarity | "unknown"
type NullableExecutionQuality = TradeExecutionQuality | "unknown"
type NullableOptionRight = TradeOptionRight | "unknown"
type NullableOptionStructure = TradeOptionStructure | "unknown"
type NullablePremiumType = TradePremiumType | "unknown"

type TradeRecordFormValue = {
  symbol: string
  market: TradeRecordInput["market"]
  side: TradeRecordInput["side"]
  traded_at: string
  pnl: string
  setup: string
  note: string
  entry_at: string
  exit_at: string
  entry_price: string
  exit_price: string
  position_size: string
  thesis: string
  planned_stop: string
  planned_target: string
  actual_stop: string
  actual_target: string
  fees: string
  slippage: string
  followed_plan: BooleanSelectValue
  plan_clarity: NullablePlanClarity
  execution_quality: NullableExecutionQuality
  mistake_tags: TradeMistakeType[]
  lesson: string
  option_expiration: string
  option_strike: string
  option_right: NullableOptionRight
  option_structure: NullableOptionStructure
  option_premium_type: NullablePremiumType
  option_max_risk: string
  option_max_reward: string
  option_delta: string
}

const TEXTAREA_CLASS_NAME =
  "min-h-[110px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"

function getTodayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return ""
  }

  return value.slice(0, 16)
}

function toTextNumber(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `${value}` : ""
}

function getEmptyForm(): TradeRecordFormValue {
  return {
    symbol: "",
    market: "stock",
    side: "long",
    traded_at: getTodayKey(),
    pnl: "",
    setup: "",
    note: "",
    entry_at: "",
    exit_at: "",
    entry_price: "",
    exit_price: "",
    position_size: "",
    thesis: "",
    planned_stop: "",
    planned_target: "",
    actual_stop: "",
    actual_target: "",
    fees: "",
    slippage: "",
    followed_plan: "unknown",
    plan_clarity: "unknown",
    execution_quality: "unknown",
    mistake_tags: [],
    lesson: "",
    option_expiration: "",
    option_strike: "",
    option_right: "unknown",
    option_structure: "unknown",
    option_premium_type: "unknown",
    option_max_risk: "",
    option_max_reward: "",
    option_delta: "",
  }
}

function toFormValue(record: TradeRecord | null): TradeRecordFormValue {
  if (!record) {
    return getEmptyForm()
  }

  return {
    symbol: record.symbol,
    market: record.market,
    side: record.side,
    traded_at: record.traded_at,
    pnl: `${record.pnl}`,
    setup: record.setup ?? "",
    note: record.note ?? "",
    entry_at: toDateTimeLocalValue(record.entry_at),
    exit_at: toDateTimeLocalValue(record.exit_at),
    entry_price: toTextNumber(record.entry_price),
    exit_price: toTextNumber(record.exit_price),
    position_size: toTextNumber(record.position_size),
    thesis: record.thesis ?? "",
    planned_stop: toTextNumber(record.planned_stop),
    planned_target: toTextNumber(record.planned_target),
    actual_stop: toTextNumber(record.actual_stop),
    actual_target: toTextNumber(record.actual_target),
    fees: toTextNumber(record.fees),
    slippage: toTextNumber(record.slippage),
    followed_plan:
      typeof record.followed_plan === "boolean" ? `${record.followed_plan}` : "unknown",
    plan_clarity: record.plan_clarity ?? "unknown",
    execution_quality: record.execution_quality ?? "unknown",
    mistake_tags: record.mistake_tags,
    lesson: record.lesson ?? "",
    option_expiration: record.option_expiration ?? "",
    option_strike: toTextNumber(record.option_strike),
    option_right: record.option_right ?? "unknown",
    option_structure: record.option_structure ?? "unknown",
    option_premium_type: record.option_premium_type ?? "unknown",
    option_max_risk: toTextNumber(record.option_max_risk),
    option_max_reward: toTextNumber(record.option_max_reward),
    option_delta: toTextNumber(record.option_delta),
  }
}

function parseOptionalNumber(value: string, label: string) {
  if (!value.trim()) {
    return { value: null, error: null }
  }

  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return { value: null, error: `${label}需要是有效数字` }
  }

  return { value: parsed, error: null }
}

function parseRequiredNumber(value: string, label: string) {
  const parsed = Number(value)
  if (!value.trim() || Number.isNaN(parsed)) {
    return { value: null, error: `${label}需要是有效数字` }
  }

  return { value: parsed, error: null }
}

function normalizeDateTime(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function Field({
  children,
  label,
  hint,
}: {
  children: ReactNode
  label: string
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-slate-500">{label}</label>
        {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function TradeRecordDialog({
  open,
  onOpenChange,
  onSubmit,
  record,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: TradeRecordInput) => void
  record: TradeRecord | null
  isPending: boolean
}) {
  const [form, setForm] = useState<TradeRecordFormValue>(() => toFormValue(record))
  const [error, setError] = useState<string | null>(null)

  const netPreview = useMemo(() => {
    const gross = Number(form.pnl || "0")
    const fees = Number(form.fees || "0")
    const slippage = Number(form.slippage || "0")

    if ([gross, fees, slippage].some((item) => Number.isNaN(item))) {
      return null
    }

    return gross - fees - slippage
  }, [form.fees, form.pnl, form.slippage])

  function toggleMistakeTag(value: TradeMistakeType) {
    setForm((previous) => ({
      ...previous,
      mistake_tags: previous.mistake_tags.includes(value)
        ? previous.mistake_tags.filter((item) => item !== value)
        : [...previous.mistake_tags, value],
    }))
  }

  function handleSubmit() {
    if (!form.symbol.trim()) {
      setError("请输入标的名称或代码")
      return
    }

    if (!form.traded_at) {
      setError("请选择交易日期")
      return
    }

    const requiredPnl = parseRequiredNumber(form.pnl, "交易盈亏")
    if (requiredPnl.error) {
      setError(requiredPnl.error)
      return
    }

    const numericFields = [
      parseOptionalNumber(form.entry_price, "入场价"),
      parseOptionalNumber(form.exit_price, "出场价"),
      parseOptionalNumber(form.position_size, "仓位大小"),
      parseOptionalNumber(form.planned_stop, "计划止损"),
      parseOptionalNumber(form.planned_target, "计划止盈"),
      parseOptionalNumber(form.actual_stop, "实际止损"),
      parseOptionalNumber(form.actual_target, "实际止盈"),
      parseOptionalNumber(form.fees, "手续费"),
      parseOptionalNumber(form.slippage, "滑点"),
      parseOptionalNumber(form.option_strike, "行权价"),
      parseOptionalNumber(form.option_max_risk, "最大风险"),
      parseOptionalNumber(form.option_max_reward, "最大收益"),
      parseOptionalNumber(form.option_delta, "Delta"),
    ]

    const invalidField = numericFields.find((item) => item.error)
    if (invalidField?.error) {
      setError(invalidField.error)
      return
    }

    const entryAt = normalizeDateTime(form.entry_at)
    const exitAt = normalizeDateTime(form.exit_at)
    if (entryAt && exitAt && new Date(exitAt).getTime() <= new Date(entryAt).getTime()) {
      setError("出场时间需要晚于入场时间")
      return
    }

    setError(null)
    onSubmit({
      symbol: form.symbol.trim(),
      market: form.market,
      side: form.side,
      traded_at: form.traded_at,
      pnl: requiredPnl.value ?? 0,
      setup: form.setup.trim(),
      note: form.note.trim() ? form.note.trim() : null,
      entry_at: entryAt,
      exit_at: exitAt,
      entry_price: parseOptionalNumber(form.entry_price, "入场价").value,
      exit_price: parseOptionalNumber(form.exit_price, "出场价").value,
      position_size: parseOptionalNumber(form.position_size, "仓位大小").value,
      thesis: form.thesis.trim() ? form.thesis.trim() : null,
      planned_stop: parseOptionalNumber(form.planned_stop, "计划止损").value,
      planned_target: parseOptionalNumber(form.planned_target, "计划止盈").value,
      actual_stop: parseOptionalNumber(form.actual_stop, "实际止损").value,
      actual_target: parseOptionalNumber(form.actual_target, "实际止盈").value,
      fees: parseOptionalNumber(form.fees, "手续费").value,
      slippage: parseOptionalNumber(form.slippage, "滑点").value,
      followed_plan:
        form.followed_plan === "unknown" ? null : form.followed_plan === "true",
      plan_clarity: form.plan_clarity === "unknown" ? null : form.plan_clarity,
      execution_quality:
        form.execution_quality === "unknown" ? null : form.execution_quality,
      mistake_tags: form.mistake_tags,
      lesson: form.lesson.trim() ? form.lesson.trim() : null,
      option_expiration:
        form.market === "options" && form.option_expiration ? form.option_expiration : null,
      option_strike:
        form.market === "options"
          ? parseOptionalNumber(form.option_strike, "行权价").value
          : null,
      option_right:
        form.market === "options" && form.option_right !== "unknown" ? form.option_right : null,
      option_structure:
        form.market === "options" && form.option_structure !== "unknown"
          ? form.option_structure
          : null,
      option_premium_type:
        form.market === "options" && form.option_premium_type !== "unknown"
          ? form.option_premium_type
          : null,
      option_max_risk:
        form.market === "options"
          ? parseOptionalNumber(form.option_max_risk, "最大风险").value
          : null,
      option_max_reward:
        form.market === "options"
          ? parseOptionalNumber(form.option_max_reward, "最大收益").value
          : null,
      option_delta:
        form.market === "options"
          ? parseOptionalNumber(form.option_delta, "Delta").value
          : null,
    })
  }

  const isEdit = Boolean(record)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-[28px] p-0">
        <div className="border-b border-slate-200 bg-white px-6 py-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "编辑交易记录" : "新增交易记录"}</DialogTitle>
            <DialogDescription>
              把执行数据、计划和复盘一次记全，页面会自动计算 Expectancy、Profit Factor、最大回撤和按场景拆解结果。
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 bg-white px-6 py-5">
          <Section
            title="基本信息"
            description="先把交易对象、市场和策略标签定下来，后面才能按 setup / 标的 / 品种拆解表现。"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="标的">
                <Input
                  autoFocus
                  value={form.symbol}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, symbol: event.target.value }))
                  }
                  placeholder="例如：SPY / NVDA / BTCUSDT"
                />
              </Field>

              <Field label="交易日期">
                <Input
                  type="date"
                  value={form.traded_at}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, traded_at: event.target.value }))
                  }
                />
              </Field>

              <Field label="方向">
                <Select
                  value={form.side}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      side: value as TradeRecordInput["side"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择方向" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_SIDE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="市场">
                <Select
                  value={form.market}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      market: value as TradeRecordInput["market"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择市场" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_MARKET_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="策略 / setup" hint="用于统计">
                <Input
                  value={form.setup}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, setup: event.target.value }))
                  }
                  placeholder="例如：Opening range breakout"
                />
              </Field>

              <div className="md:col-span-2 xl:col-span-3">
                <Field label="开仓理由" hint="交易逻辑">
                  <textarea
                    value={form.thesis}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, thesis: event.target.value }))
                    }
                    placeholder="入场触发条件、市场背景、预期路径"
                    className={TEXTAREA_CLASS_NAME}
                  />
                </Field>
              </div>
            </div>
          </Section>

          <Section
            title="执行数据"
            description="记录进出场、仓位和成本，统计才不会只剩下一个结果数字。"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="入场时间" hint="可精确到分钟">
                <Input
                  type="datetime-local"
                  value={form.entry_at}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, entry_at: event.target.value }))
                  }
                />
              </Field>

              <Field label="出场时间" hint="可留空">
                <Input
                  type="datetime-local"
                  value={form.exit_at}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, exit_at: event.target.value }))
                  }
                />
              </Field>

              <Field label="入场价">
                <Input
                  type="number"
                  step="0.0001"
                  value={form.entry_price}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, entry_price: event.target.value }))
                  }
                  placeholder="例如：518.2"
                />
              </Field>

              <Field label="出场价">
                <Input
                  type="number"
                  step="0.0001"
                  value={form.exit_price}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, exit_price: event.target.value }))
                  }
                  placeholder="例如：521.6"
                />
              </Field>

              <Field label="仓位大小" hint="股数 / 合约数">
                <Input
                  type="number"
                  step="0.01"
                  value={form.position_size}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, position_size: event.target.value }))
                  }
                  placeholder="例如：2 / 100"
                />
              </Field>

              <Field label="交易盈亏" hint="未扣费用">
                <Input
                  type="number"
                  step="0.01"
                  value={form.pnl}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, pnl: event.target.value }))
                  }
                  placeholder="正数盈利，负数亏损"
                />
              </Field>

              <Field label="手续费">
                <Input
                  type="number"
                  step="0.01"
                  value={form.fees}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, fees: event.target.value }))
                  }
                  placeholder="例如：5.6"
                />
              </Field>

              <Field label="滑点">
                <Input
                  type="number"
                  step="0.01"
                  value={form.slippage}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, slippage: event.target.value }))
                  }
                  placeholder="例如：2.4"
                />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <Badge variant="info">自动净结果</Badge>
              <span className="text-slate-500">交易盈亏 - 手续费 - 滑点</span>
              <span className="font-semibold text-slate-900">
                {netPreview === null ? "请输入有效数字" : currency.format(netPreview)}
              </span>
            </div>
          </Section>

          <Section
            title="交易计划"
            description="把计划止损、计划止盈和实际执行写下来，后面才能判断亏损是系统问题还是执行问题。"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="计划止损">
                <Input
                  type="number"
                  step="0.0001"
                  value={form.planned_stop}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, planned_stop: event.target.value }))
                  }
                  placeholder="预设止损位"
                />
              </Field>

              <Field label="计划止盈">
                <Input
                  type="number"
                  step="0.0001"
                  value={form.planned_target}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, planned_target: event.target.value }))
                  }
                  placeholder="预设止盈位"
                />
              </Field>

              <Field label="实际止损">
                <Input
                  type="number"
                  step="0.0001"
                  value={form.actual_stop}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, actual_stop: event.target.value }))
                  }
                  placeholder="实际离场止损"
                />
              </Field>

              <Field label="实际止盈">
                <Input
                  type="number"
                  step="0.0001"
                  value={form.actual_target}
                  onChange={(event) =>
                    setForm((previous) => ({ ...previous, actual_target: event.target.value }))
                  }
                  placeholder="实际离场止盈"
                />
              </Field>

              <Field label="是否按计划执行">
                <Select
                  value={form.followed_plan}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      followed_plan: value as BooleanSelectValue,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">暂不标记</SelectItem>
                    <SelectItem value="true">基本按计划</SelectItem>
                    <SelectItem value="false">明显偏离</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="计划是否清晰">
                <Select
                  value={form.plan_clarity}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      plan_clarity: value as NullablePlanClarity,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">暂不标记</SelectItem>
                    {TRADE_PLAN_CLARITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="执行是否合规">
                <Select
                  value={form.execution_quality}
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      execution_quality: value as NullableExecutionQuality,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">暂不标记</SelectItem>
                    {TRADE_EXECUTION_QUALITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section
            title="复盘结论"
            description="不要只写亏了还是赚了，而是写出错误类型和这笔交易唯一值得记住的结论。"
          >
            <div className="grid gap-4">
              <Field label="错误类型" hint="可多选">
                <div className="flex flex-wrap gap-2">
                  {TRADE_MISTAKE_OPTIONS.map((option) => {
                    const selected = form.mistake_tags.includes(option.value)

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={selected ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleMistakeTag(option.value)}
                      >
                        {option.label}
                      </Button>
                    )
                  })}
                </div>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="唯一结论">
                  <textarea
                    value={form.lesson}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, lesson: event.target.value }))
                    }
                    placeholder="例如：突破失败时不该在第二次回抽继续追多"
                    className={TEXTAREA_CLASS_NAME}
                  />
                </Field>

                <Field label="补充备注">
                  <textarea
                    value={form.note}
                    onChange={(event) =>
                      setForm((previous) => ({ ...previous, note: event.target.value }))
                    }
                    placeholder="可继续写当天情绪、执行亮点或遗漏信息"
                    className={TEXTAREA_CLASS_NAME}
                  />
                </Field>
              </div>

              {form.mistake_tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.mistake_tags.map((tag) => (
                    <Badge key={tag} variant="warning">
                      {TRADE_MISTAKE_LABELS[tag]}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </Section>

          {form.market === "options" ? (
            <Section
              title="期权字段"
              description="至少先支持裸买、卖 put/call、价差和铁鹰，避免期权交易后面无法拆解。"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="到期日">
                  <Input
                    type="date"
                    value={form.option_expiration}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        option_expiration: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field label="行权价">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.option_strike}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        option_strike: event.target.value,
                      }))
                    }
                    placeholder="例如：520"
                  />
                </Field>

                <Field label="Call / Put">
                  <Select
                    value={form.option_right}
                    onValueChange={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        option_right: value as NullableOptionRight,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">暂不标记</SelectItem>
                      {TRADE_OPTION_RIGHT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="结构">
                  <Select
                    value={form.option_structure}
                    onValueChange={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        option_structure: value as NullableOptionStructure,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">暂不标记</SelectItem>
                      {TRADE_OPTION_STRUCTURE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="借记 / 贷记">
                  <Select
                    value={form.option_premium_type}
                    onValueChange={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        option_premium_type: value as NullablePremiumType,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">暂不标记</SelectItem>
                      {TRADE_PREMIUM_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="最大风险">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.option_max_risk}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        option_max_risk: event.target.value,
                      }))
                    }
                    placeholder="例如：350"
                  />
                </Field>

                <Field label="最大收益">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.option_max_reward}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        option_max_reward: event.target.value,
                      }))
                    }
                    placeholder="例如：150"
                  />
                </Field>

                <Field label="Delta">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.option_delta}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        option_delta: event.target.value,
                      }))
                    }
                    placeholder="例如：0.32"
                  />
                </Field>
              </div>
            </Section>
          ) : null}

          {error && <ErrorBox msg={error} />}
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4">
          <DialogFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isPending}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "提交中..." : isEdit ? "保存修改" : "确认新增"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
