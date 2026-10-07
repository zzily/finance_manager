import { NativeSelect } from "../ui/native-select"
import { useId, useState } from "react"

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "../ui/field"
import { todayKey, moneyError } from "../../lib/formHelpers"
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
import type {
  ExpenseCategory,
  Transaction,
  TransactionUpdate,
} from "../../types"

const DEFAULT_TRANSACTION_FORM: TransactionUpdate = {
  title: "",
  amount_out: 0,
  category: "work",
}

function createTransactionForm(
  transaction: Transaction | null,
): TransactionUpdate {
  if (!transaction) {
    return { ...DEFAULT_TRANSACTION_FORM }
  }
  return {
    title: transaction.title,
    amount_out: transaction.amount_out,
    category: transaction.category,
    expense_category_id: transaction.expense_category_id ?? null,
    occurred_at: transaction.occurred_at ?? transaction.created_at.slice(0, 10),
  }
}

function EditTransactionDialogBody({
  isPending,
  onOpenChange,
  onSubmit,
  transaction,
  supportsOccurrenceDate,
  supportsCategories,
  categories = [],
}: {
  isPending: boolean
  onOpenChange: (value: boolean) => void
  onSubmit: (id: number, form: TransactionUpdate) => void
  transaction: Transaction | null
  supportsCategories?: boolean
  categories?: ExpenseCategory[]
  supportsOccurrenceDate?: boolean
}) {
  const id = useId()
  const [form, setForm] = useState<TransactionUpdate>(() =>
    createTransactionForm(transaction),
  )
  const [attempted, setAttempted] = useState(false)
  const errors = {
    title: form.title.trim() ? null : "请输入账单标题",
    amount:
      moneyError(form.amount_out) ??
      (transaction && Number(form.amount_out) < transaction.amount_reimbursed
        ? "金额不能低于已核销金额"
        : null),
    date:
      supportsOccurrenceDate &&
      (!form.occurred_at || form.occurred_at > todayKey())
        ? "请选择不晚于今天的发生日期"
        : null,
  }

  function handleSubmit() {
    setAttempted(true)
    if (!transaction || isPending || Object.values(errors).some(Boolean)) return
    const amount = Number(form.amount_out)
    onSubmit(transaction.id, {
      title: form.title.trim(),
      amount_out: amount,
      category: form.category,
      ...(supportsOccurrenceDate ? { occurred_at: form.occurred_at } : {}),
      ...(supportsCategories
        ? { expense_category_id: form.expense_category_id ?? null }
        : {}),
    })
  }

  return (
    <DialogContent className="flex flex-col overflow-hidden p-0">
      <form
        id={`${id}-form`}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="flex min-h-0 flex-col gap-5"
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>编辑账单</DialogTitle>
          <DialogDescription>修改标题、金额或分类</DialogDescription>
        </DialogHeader>
        <FieldGroup className="min-h-0 gap-4 overflow-y-auto px-6">
          {supportsOccurrenceDate && (
            <Field
              className="gap-1.5"
              data-invalid={attempted && Boolean(errors.date)}
            >
              <FieldLabel htmlFor={`${id}-date`}>发生日期</FieldLabel>
              <Input
                id={`${id}-date`}
                aria-invalid={attempted && Boolean(errors.date)}
                aria-describedby={
                  attempted && errors.date ? `${id}-date-error` : undefined
                }
                type="date"
                max={todayKey()}
                value={form.occurred_at ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, occurred_at: e.target.value }))
                }
              />
              {transaction?.occurred_at_inferred && (
                <FieldDescription className="text-xs">
                  旧账单日期暂按录入时间估算，可以在此修改。
                </FieldDescription>
              )}
              {attempted && errors.date && (
                <FieldError id={`${id}-date-error`}>{errors.date}</FieldError>
              )}
            </Field>
          )}

          <Field
            className="gap-1.5"
            data-invalid={attempted && Boolean(errors.title)}
          >
            <FieldLabel htmlFor={`${id}-title`}>标题</FieldLabel>
            <Input
              id={`${id}-title`}
              aria-invalid={attempted && Boolean(errors.title)}
              aria-describedby={
                attempted && errors.title ? `${id}-title-error` : undefined
              }
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="例如：给车加油"
              autoFocus
            />
            {attempted && errors.title && (
              <FieldError id={`${id}-title-error`}>{errors.title}</FieldError>
            )}
          </Field>
          <Field
            className="gap-1.5"
            data-invalid={attempted && Boolean(errors.amount)}
          >
            <FieldLabel htmlFor={`${id}-amount`}>金额（人民币）</FieldLabel>
            <Input
              id={`${id}-amount`}
              aria-invalid={attempted && Boolean(errors.amount)}
              aria-describedby={
                attempted && errors.amount ? `${id}-amount-error` : undefined
              }
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              value={form.amount_out || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  amount_out: Number(e.target.value),
                }))
              }
              placeholder="请输入账单金额"
            />
            {attempted && errors.amount && (
              <FieldError id={`${id}-amount-error`}>{errors.amount}</FieldError>
            )}
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor={`${id}-category`}>分类</FieldLabel>
            <Select
              value={form.category}
              onValueChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  category: value as TransactionUpdate["category"],
                  expense_category_id: null,
                }))
              }}
            >
              <SelectTrigger id={`${id}-category`}>
                <SelectValue placeholder="请选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work">工作</SelectItem>
                <SelectItem value="personal">个人</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {supportsCategories && (
            <Field className="gap-1.5">
              <FieldLabel htmlFor={`${id}-expense-category`}>
                支出分类
              </FieldLabel>
              <NativeSelect
                id={`${id}-expense-category`}
                value={form.expense_category_id ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    expense_category_id: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
              >
                <option value="">未分类</option>
                {categories
                  .filter(
                    (c) =>
                      c.kind === form.category &&
                      (!c.archived || c.id === form.expense_category_id),
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.archived ? "（已停用）" : ""}
                    </option>
                  ))}
              </NativeSelect>
            </Field>
          )}
        </FieldGroup>
        <DialogFooter className="border-t px-6 pb-6 pt-3">
          <Button
            variant="secondary"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            取消
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "保存中..." : "保存修改"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  supportsOccurrenceDate,
  supportsCategories,
  categories,
  isPending,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  transaction: Transaction | null
  supportsCategories?: boolean
  categories?: ExpenseCategory[]
  supportsOccurrenceDate?: boolean
  isPending: boolean
  onSubmit: (id: number, form: TransactionUpdate) => void
}) {
  const dialogKey = `${transaction?.id ?? "empty"}:${open ? "open" : "closed"}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <EditTransactionDialogBody
        key={dialogKey}
        transaction={transaction}
        supportsOccurrenceDate={supportsOccurrenceDate}
        supportsCategories={supportsCategories}
        categories={categories}
        isPending={isPending}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    </Dialog>
  )
}
