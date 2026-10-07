import { useId, useState } from "react"

import { Spinner } from "../ui/spinner"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "../ui/field"
import { dateInputValue, todayKey, moneyError } from "../../lib/formHelpers"
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
import { MonthPicker } from "../ui/month-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { currency } from "../../lib/formatters"
import type { SalaryLog, SalaryLogUpdate } from "../../types"

const DEFAULT_SALARY_FORM: SalaryLogUpdate = {
  amount: 0,
  source: "salary",
  month: "",
  remark: "",
}

function createSalaryLogForm(salaryLog: SalaryLog | null): SalaryLogUpdate {
  if (!salaryLog) {
    return { ...DEFAULT_SALARY_FORM }
  }
  return {
    amount: salaryLog.amount,
    source: salaryLog.source,
    month: salaryLog.month,
    remark: salaryLog.remark ?? "",
    received_date: salaryLog.received_date,
  }
}

function EditSalaryLogDialogBody({
  isPending,
  onOpenChange,
  onSubmit,
  salaryLog,
}: {
  isPending: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (id: number, payload: SalaryLogUpdate) => void
  salaryLog: SalaryLog | null
}) {
  const id = useId()
  const [form, setForm] = useState<SalaryLogUpdate>(() =>
    createSalaryLogForm(salaryLog),
  )
  const [attempted, setAttempted] = useState(false)

  const amountUsed = salaryLog ? salaryLog.amount - salaryLog.amount_unused : 0

  const errors = {
    amount:
      moneyError(form.amount) ??
      (Number(form.amount) < amountUsed
        ? `金额不能低于已核销的 ${currency.format(amountUsed)}`
        : null),
    date:
      !form.received_date ||
      !dateInputValue(form.received_date) ||
      dateInputValue(form.received_date) > todayKey()
        ? "请选择不晚于今天的到账日期"
        : null,
    month: !form.month.trim() ? "请选择归属月份" : null,
  }
  function handleSubmit() {
    setAttempted(true)
    if (!salaryLog || isPending || Object.values(errors).some(Boolean)) return
    const amount = Number(form.amount)
    onSubmit(salaryLog.id, { ...form, amount })
  }

  return (
    <DialogContent className="flex flex-col overflow-hidden">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex min-h-0 flex-col gap-5"
      >
        <DialogHeader>
          <DialogTitle>编辑收入记录</DialogTitle>
          <DialogDescription>
            {salaryLog && amountUsed > 0
              ? `该笔资金已核销 ${currency.format(amountUsed)}，金额不可低于此值`
              : "修改金额、来源、到账日期或归属月份"}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="min-h-0 gap-4 overflow-y-auto">
          <Field
            className="gap-1.5"
            data-invalid={attempted && Boolean(errors.amount)}
          >
            <FieldLabel
              htmlFor={`${id}-amount`}
              className="text-sm font-medium"
            >
              金额
            </FieldLabel>
            <Input
              id={`${id}-amount`}
              aria-invalid={attempted && Boolean(errors.amount)}
              aria-describedby={
                attempted && errors.amount ? `${id}-amount-error` : undefined
              }
              inputMode="decimal"
              type="number"
              min={amountUsed}
              step="0.01"
              value={form.amount || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))
              }
              placeholder="请输入回款金额"
              autoFocus
            />
            {amountUsed > 0 && (
              <FieldDescription className="text-xs text-warning">
                已核销 {currency.format(amountUsed)}，最低不能小于此值
              </FieldDescription>
            )}
            {attempted && errors.amount && (
              <FieldError id={`${id}-amount-error`}>{errors.amount}</FieldError>
            )}
          </Field>
          <Field className="gap-1.5">
            <FieldLabel
              htmlFor={`${id}-source`}
              className="text-sm font-medium"
            >
              来源
            </FieldLabel>
            <Select
              value={form.source}
              onValueChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  source: value as SalaryLogUpdate["source"],
                }))
              }}
            >
              <SelectTrigger id={`${id}-source`}>
                <SelectValue placeholder="请选择来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">工资</SelectItem>
                <SelectItem value="reimbursement">报销</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field
            className="gap-1.5"
            data-invalid={attempted && Boolean(errors.date)}
          >
            <FieldLabel htmlFor={`${id}-date`} className="text-sm font-medium">
              到账日期
            </FieldLabel>
            <Input
              id={`${id}-date`}
              aria-invalid={attempted && Boolean(errors.date)}
              aria-describedby={
                attempted && errors.date ? `${id}-date-error` : undefined
              }
              type="date"
              max={todayKey()}
              value={dateInputValue(form.received_date)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  received_date: e.target.value
                    ? new Date(`${e.target.value}T12:00:00`).toISOString()
                    : null,
                }))
              }
            />
            {attempted && errors.date && (
              <FieldError id={`${id}-date-error`}>{errors.date}</FieldError>
            )}
          </Field>
          <Field
            className="gap-1.5"
            data-invalid={attempted && Boolean(errors.month)}
          >
            <FieldLabel htmlFor={`${id}-month`} className="text-sm font-medium">
              归属月份
            </FieldLabel>
            <MonthPicker
              id={`${id}-month`}
              aria-invalid={attempted && Boolean(errors.month)}
              aria-describedby={
                attempted && errors.month ? `${id}-month-error` : undefined
              }
              value={form.month}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, month: value }))
              }
              placeholder="选择归属月份"
            />
            {attempted && errors.month && (
              <FieldError id={`${id}-month-error`}>{errors.month}</FieldError>
            )}
          </Field>
          <Field className="gap-1.5">
            <FieldLabel
              htmlFor={`${id}-remark`}
              className="text-sm font-medium"
            >
              备注
            </FieldLabel>
            <Input
              id={`${id}-remark`}
              value={form.remark ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, remark: e.target.value }))
              }
              placeholder="可选备注"
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            取消
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner />}
            {isPending ? "保存中..." : "保存修改"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

export function EditSalaryLogDialog({
  open,
  onOpenChange,
  salaryLog,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  salaryLog: SalaryLog | null
  isPending: boolean
  onSubmit: (id: number, payload: SalaryLogUpdate) => void
}) {
  const dialogKey = `${salaryLog?.id ?? "empty"}:${open ? "open" : "closed"}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditSalaryLogDialogBody
        key={dialogKey}
        salaryLog={salaryLog}
        isPending={isPending}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    </Dialog>
  )
}
