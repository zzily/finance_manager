import { useId, useState } from "react"

import { FieldGroup, FieldLabel } from "../ui/field"
import { todayKey, moneyError } from "../../lib/formHelpers"
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
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!transaction) return
    if (!form.title.trim()) {
      setError("请输入账单标题")
      return
    }
    const amount = Number(form.amount_out)
    const amountError = moneyError(amount)
    if (amountError) {
      setError(amountError)
      return
    }
    if (amount < transaction.amount_reimbursed) {
      setError("金额不能低于已核销金额")
      return
    }
    if (
      supportsOccurrenceDate &&
      (!form.occurred_at || form.occurred_at > todayKey())
    ) {
      setError("请选择不晚于今天的发生日期")
      return
    }
    setError(null)
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
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>编辑账单</DialogTitle>
        <DialogDescription>修改标题、金额或分类</DialogDescription>
      </DialogHeader>
      <FieldGroup className="min-h-0 gap-4 overflow-y-auto px-6">
        {supportsOccurrenceDate && (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${id}-date`}>发生日期</FieldLabel>
            <Input
              id={`${id}-date`}
              type="date"
              max={todayKey()}
              value={form.occurred_at ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, occurred_at: e.target.value }))
              }
            />
            {transaction?.occurred_at_inferred && (
              <p className="text-xs text-muted-foreground">
                旧账单日期暂按录入时间估算，可以在此修改。
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <FieldLabel htmlFor={`${id}-title`}>标题</FieldLabel>
          <Input
            id={`${id}-title`}
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="例如：给车加油"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor={`${id}-amount`}>金额（人民币）</FieldLabel>
          <Input
            id={`${id}-amount`}
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
        </div>
        <div className="space-y-1.5">
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
        </div>
        {supportsCategories && (
          <div className="space-y-1.5">
            <FieldLabel htmlFor={`${id}-expense-category`}>支出分类</FieldLabel>
            <select
              id={`${id}-expense-category`}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm"
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
            </select>
          </div>
        )}
        {error && <ErrorBox msg={error} />}
      </FieldGroup>
      <DialogFooter className="border-t px-6 pb-6 pt-3">
        <Button
          variant="secondary"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "保存中..." : "保存修改"}
        </Button>
      </DialogFooter>
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
