import { useState, useMemo, useId } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  FieldDescription,
  FieldError,
} from "../ui/field"
import { moneyError } from "../../lib/formHelpers"
import { currency } from "../../lib/formatters"
import type { Transaction, SalaryLog } from "../../types"

export function SettleDialog({
  open,
  onOpenChange,
  transaction,
  availableLogs,
  isLoadingLogs,
  isErrorLogs,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  transaction: Transaction | null
  availableLogs: SalaryLog[]
  isLoadingLogs: boolean
  isErrorLogs: boolean
  isPending: boolean
  onSubmit: (salaryLogId: number, amount: number) => void
}) {
  const [selectedSalaryId, setSelectedSalaryId] = useState("")
  const [amount, setAmount] = useState("")
  const id = useId()
  const [attempted, setAttempted] = useState(false)

  const remainingDebt = useMemo(
    () =>
      transaction ? transaction.amount_out - transaction.amount_reimbursed : 0,
    [transaction],
  )
  const selectedSalary = useMemo(
    () => availableLogs.find((i) => String(i.id) === selectedSalaryId),
    [availableLogs, selectedSalaryId],
  )

  function handleOpenChange(v: boolean) {
    if (v) {
      setSelectedSalaryId("")
      setAmount("")
      setAttempted(false)
    }
    onOpenChange(v)
  }

  const errors = {
    income: isErrorLogs
      ? "回款加载失败，请重试"
      : !selectedSalary
        ? "请选择一笔可用的回款"
        : null,
    amount:
      moneyError(amount) ??
      (Number(amount) > remainingDebt
        ? "核销金额不能超过未结清金额"
        : selectedSalary && Number(amount) > selectedSalary.amount_unused
          ? "核销金额不能超过回款余额"
          : null),
  }
  function handleSubmit() {
    setAttempted(true)
    if (
      !transaction ||
      isPending ||
      isLoadingLogs ||
      Object.values(errors).some(Boolean)
    )
      return
    const n = Number(amount)
    onSubmit(Number(selectedSalaryId), n)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="flex flex-col gap-5"
        >
          <DialogHeader>
            <DialogTitle>核销账单</DialogTitle>
            <DialogDescription>选择回款并输入本次核销金额</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field className="gap-1.5">
              <FieldTitle>账单</FieldTitle>
              <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
                {transaction
                  ? `${transaction.title}  未结清 ${currency.format(remainingDebt)}`
                  : ""}
              </div>
            </Field>
            <Field
              className="gap-1.5"
              data-invalid={attempted && Boolean(errors.income)}
            >
              <FieldLabel htmlFor={`${id}-income`}>选择回款</FieldLabel>
              <Select
                value={selectedSalaryId}
                onValueChange={setSelectedSalaryId}
              >
                <SelectTrigger
                  id={`${id}-income`}
                  disabled={isLoadingLogs || isErrorLogs}
                  aria-invalid={attempted && Boolean(errors.income)}
                  aria-describedby={
                    attempted && errors.income
                      ? `${id}-income-error`
                      : undefined
                  }
                >
                  <SelectValue placeholder="请选择可用回款" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingLogs && (
                    <SelectItem value="loading" disabled>
                      加载中
                    </SelectItem>
                  )}
                  {isErrorLogs && (
                    <SelectItem value="error" disabled>
                      回款加载失败
                    </SelectItem>
                  )}
                  {!isLoadingLogs && availableLogs.length === 0 && (
                    <SelectItem value="empty" disabled>
                      暂无可用回款
                    </SelectItem>
                  )}
                  {availableLogs.map((log) => (
                    <SelectItem key={log.id} value={String(log.id)}>
                      {`${log.month}  余额 ${currency.format(log.amount_unused)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {attempted && errors.income && (
                <FieldError id={`${id}-income-error`}>
                  {errors.income}
                </FieldError>
              )}
            </Field>
            <Field
              className="gap-1.5"
              data-invalid={attempted && Boolean(errors.amount)}
            >
              <FieldLabel htmlFor={`${id}-amount`}>核销金额</FieldLabel>
              <Input
                id={`${id}-amount`}
                aria-invalid={attempted && Boolean(errors.amount)}
                aria-describedby={
                  attempted && errors.amount ? `${id}-amount-error` : undefined
                }
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入核销金额"
                autoFocus
              />
              {attempted && errors.amount && (
                <FieldError id={`${id}-amount-error`}>
                  {errors.amount}
                </FieldError>
              )}
              {selectedSalary && (
                <FieldDescription className="text-xs">
                  回款余额：{currency.format(selectedSalary.amount_unused)}
                </FieldDescription>
              )}
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
              {isPending ? "提交中..." : "确认核销"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
