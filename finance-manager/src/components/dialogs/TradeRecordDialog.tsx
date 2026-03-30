import { useState } from "react"

import { ErrorBox } from "../common"
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
import { TRADE_MARKET_OPTIONS, TRADE_SIDE_OPTIONS } from "../../lib/tradeOptions"
import type { TradeRecord, TradeRecordInput } from "../../types"

function getTodayKey() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

function getEmptyForm(): TradeRecordInput {
  return {
    symbol: "",
    market: "stock",
    side: "long",
    traded_at: getTodayKey(),
    pnl: 0,
    setup: "",
    note: "",
  }
}

function toFormValue(record: TradeRecord | null) {
  if (!record) {
    return getEmptyForm()
  }

  return {
    symbol: record.symbol,
    market: record.market,
    side: record.side,
    traded_at: record.traded_at,
    pnl: record.pnl,
    setup: record.setup ?? "",
    note: record.note ?? "",
  } satisfies TradeRecordInput
}

export function TradeRecordDialog({
  open,
  onOpenChange,
  onSubmit,
  record,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: TradeRecordInput) => void
  record: TradeRecord | null
}) {
  const [form, setForm] = useState<TradeRecordInput>(() => toFormValue(record))
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!form.symbol.trim()) {
      setError("请输入标的名称或代码")
      return
    }

    if (!form.traded_at) {
      setError("请选择交易日期")
      return
    }

    if (Number.isNaN(form.pnl)) {
      setError("请输入有效的收益金额")
      return
    }

    setError(null)
    onSubmit({
      ...form,
      pnl: Number(form.pnl),
      symbol: form.symbol.trim(),
      setup: form.setup?.trim(),
      note: form.note?.trim() ? form.note.trim() : null,
    })
  }

  const isEdit = Boolean(record)

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setError(null)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑交易记录" : "新增交易记录"}</DialogTitle>
          <DialogDescription>
            记录一笔已经完成的交易，用来自动计算笔数、胜率和收益表现。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">标的</label>
            <Input
              autoFocus
              value={form.symbol}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, symbol: event.target.value }))
              }
              placeholder="例如：BTCUSDT / 510300 / IF 主连"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">交易日期</label>
            <Input
              type="date"
              value={form.traded_at}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, traded_at: event.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">方向</label>
            <Select
              value={form.side}
              onValueChange={(value) =>
                setForm((previous) => ({ ...previous, side: value as TradeRecordInput["side"] }))
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
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">市场</label>
            <Select
              value={form.market}
              onValueChange={(value) =>
                setForm((previous) => ({ ...previous, market: value as TradeRecordInput["market"] }))
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
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">净收益</label>
            <Input
              type="number"
              step="0.01"
              value={Number.isFinite(form.pnl) ? form.pnl : ""}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  pnl: event.target.value === "" ? Number.NaN : Number(event.target.value),
                }))
              }
              placeholder="正数表示盈利，负数表示亏损"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">策略标签</label>
            <Input
              value={form.setup ?? ""}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, setup: event.target.value }))
              }
              placeholder="例如：趋势突破 / 回撤接力"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-slate-500">备注</label>
            <textarea
              value={form.note ?? ""}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, note: event.target.value }))
              }
              placeholder="可记录复盘结论、错误点或执行亮点"
              className="min-h-[110px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
            />
          </div>
        </div>

        {error && <ErrorBox msg={error} />}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? "保存修改" : "确认新增"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
