import { NativeSelect } from "../ui/native-select"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Field, FieldGroup, FieldLabel, FieldError } from "../ui/field"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { moneyError, todayKey } from "../../lib/formHelpers"
import type { SalaryLogCreate } from "../../types"
type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  isPending: boolean
  onSubmit: (v: SalaryLogCreate) => void
}
function Body({ onOpenChange, isPending, onSubmit }: Props) {
  const [amount, setAmount] = useState(""),
    [month, setMonth] = useState(todayKey().slice(0, 7)),
    [date, setDate] = useState(todayKey()),
    [source, setSource] = useState<SalaryLogCreate["source"]>("salary"),
    [remark, setRemark] = useState("")
  const [attempted, setAttempted] = useState(false)
  const error = moneyError(amount)
  function submit() {
    setAttempted(true)
    if (error || !month || !date || isPending || date > todayKey()) return
    onSubmit({
      amount: Number(amount),
      month,
      source,
      remark: remark.trim() || null,
      received_date: new Date(`${date}T12:00:00`).toISOString(),
    })
  }
  return (
    <DialogContent>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex flex-col gap-5"
      >
        <DialogHeader>
          <DialogTitle>录入收入</DialogTitle>
          <DialogDescription>
            工资、报销或其他到账收入，金额统一使用人民币。
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <Field data-invalid={attempted && Boolean(error)}>
            <FieldLabel htmlFor="income-amount">金额（人民币）</FieldLabel>
            <Input
              id="income-amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              aria-invalid={attempted && Boolean(error)}
              aria-describedby={
                attempted && error ? "income-amount-error" : undefined
              }
            />
            {attempted && error && (
              <FieldError id="income-amount-error">{error}</FieldError>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={attempted && (!date || date > todayKey())}>
              <FieldLabel htmlFor="income-date">到账日期</FieldLabel>
              <Input
                id="income-date"
                type="date"
                value={date}
                max={todayKey()}
                onChange={(e) => setDate(e.target.value)}
                required
                aria-invalid={attempted && (!date || date > todayKey())}
                aria-describedby={
                  attempted && (!date || date > todayKey())
                    ? "income-date-error"
                    : undefined
                }
              />
              {attempted && (!date || date > todayKey()) && (
                <FieldError id="income-date-error">
                  请选择不晚于今天的到账日期
                </FieldError>
              )}
            </Field>
            <Field data-invalid={attempted && !month}>
              <FieldLabel htmlFor="income-month">归属月份</FieldLabel>
              <Input
                id="income-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                aria-invalid={attempted && !month}
                aria-describedby={
                  attempted && !month ? "income-month-error" : undefined
                }
              />
              {attempted && !month && (
                <FieldError id="income-month-error">请选择归属月份</FieldError>
              )}
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="income-source">收入来源</FieldLabel>
            <NativeSelect
              id="income-source"
              value={source}
              onChange={(e) =>
                setSource(e.target.value as SalaryLogCreate["source"])
              }
            >
              <option value="salary">工资</option>
              <option value="reimbursement">报销</option>
              <option value="other">其他收入</option>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="income-remark">备注（可选）</FieldLabel>
            <Input
              id="income-remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="例如：九月出差报销"
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
            {isPending ? "提交中…" : "确认录入"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
export function SalaryLogDialog(props: Props) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={(v) => {
        if (!props.isPending) props.onOpenChange(v)
      }}
    >
      <Body key={props.open ? "open" : "closed"} {...props} />
    </Dialog>
  )
}
