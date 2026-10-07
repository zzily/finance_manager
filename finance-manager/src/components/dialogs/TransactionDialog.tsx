import { NativeSelect } from "../ui/native-select"
import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
  FieldSet,
  FieldLegend,
} from "../ui/field"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Checkbox } from "../ui/checkbox"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { todayKey, moneyError } from "../../lib/formHelpers"
import {
  loadTemplates,
  rememberTemplate,
  type BillTemplate,
} from "../../lib/templates"
import { currency } from "../../lib/formatters"
import type { ExpenseCategory, SalaryLog, TransactionCreate } from "../../types"
type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  isPending: boolean
  onSubmit: (v: TransactionCreate) => void
  supportsOccurrenceDate?: boolean
  categories?: ExpenseCategory[]
  supportsCategories?: boolean
  categoriesError?: boolean
  supportsImmediatePayment?: boolean
  availableLogs?: SalaryLog[]
  incomeError?: boolean
  incomeLoading?: boolean
  initialTemplate?: BillTemplate
}
function Body({
  onOpenChange,
  isPending,
  onSubmit,
  initialTemplate,
  supportsOccurrenceDate,
  categories = [],
  supportsCategories,
  categoriesError,
  supportsImmediatePayment,
  availableLogs = [],
  incomeError,
  incomeLoading,
}: Props) {
  const [title, setTitle] = useState(initialTemplate?.title ?? ""),
    [amount, setAmount] = useState(
      initialTemplate ? String(initialTemplate.amount_out) : "",
    ),
    [category, setCategory] = useState<TransactionCreate["category"]>(
      initialTemplate?.category ?? "personal",
    )
  const [attempted, setAttempted] = useState(false),
    [saveTemplate, setSaveTemplate] = useState(false),
    [monthly, setMonthly] = useState(Boolean(initialTemplate?.repeatMonthly))
  function templateCategory(t?: BillTemplate) {
    return (
      categories.find(
        (c) =>
          !c.archived &&
          c.kind === t?.category &&
          (t.expenseCategoryName
            ? c.name === t.expenseCategoryName
            : c.id === t.expense_category_id),
      )?.id ?? null
    )
  }
  const [expenseCategoryId, setExpenseCategoryId] = useState<number | null>(
    () => templateCategory(initialTemplate),
  )
  const [paymentMode, setPaymentMode] = useState("later")
  const [incomeId, setIncomeId] = useState("")
  const chosenIncome = availableLogs.find((i) => i.id === Number(incomeId))
  const quickPayment =
    supportsImmediatePayment &&
    category === "personal" &&
    paymentMode === "paid"
  const paymentError = quickPayment
    ? incomeError
      ? "收入加载失败，请重试后再支付"
      : !chosenIncome
        ? "请选择已到账收入"
        : Math.round(Number(amount) * 100) >
            Math.round(chosenIncome.amount_unused * 100)
          ? "消费金额超过这笔收入的可用余额"
          : null
    : null
  const [date, setDate] = useState(todayKey)
  const dateError =
    supportsOccurrenceDate && (!date || date > todayKey())
      ? "请选择不晚于今天的发生日期"
      : null
  const [templates] = useState(loadTemplates)
  const amountError = moneyError(amount),
    titleError = title.trim() ? null : "请输入账单标题"
  function submit() {
    setAttempted(true)
    if (
      amountError ||
      titleError ||
      dateError ||
      paymentError ||
      (incomeLoading && quickPayment) ||
      isPending
    )
      return
    const form = {
      title: title.trim(),
      amount_out: Number(amount),
      category,
      ...(supportsOccurrenceDate ? { occurred_at: date } : {}),
      ...(supportsCategories ? { expense_category_id: expenseCategoryId } : {}),
      ...(quickPayment ? { payment_salary_log_id: Number(incomeId) } : {}),
    }
    if (saveTemplate) {
      try {
        rememberTemplate({
          title: form.title,
          amount_out: form.amount_out,
          category: form.category,
          expense_category_id: expenseCategoryId,
          expenseCategoryName: categories.find(
            (c) => c.id === expenseCategoryId,
          )?.name,
          repeatMonthly: monthly,
        })
      } catch {
        toast.error("常用模板未保存，账单仍会提交")
      }
    }
    onSubmit(form)
  }
  function apply(t: BillTemplate) {
    setTitle(t.title)
    setAmount(String(t.amount_out))
    setCategory(t.category)
    setExpenseCategoryId(templateCategory(t))
    setPaymentMode("later")
    setIncomeId("")
    setMonthly(Boolean(t.repeatMonthly))
    setSaveTemplate(false)
    setAttempted(false)
  }
  return (
    <DialogContent className="flex overflow-hidden p-0">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex max-h-[90dvh] min-h-0 w-full flex-col gap-5"
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>记录账单</DialogTitle>
          <DialogDescription>
            记录一笔个人支出或工作垫付，金额统一使用人民币。
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6">
          {templates.length > 0 && (
            <Field>
              <FieldLabel htmlFor="bill-template">使用常用记录</FieldLabel>
              <NativeSelect
                id="bill-template"
                defaultValue=""
                onChange={(e) => {
                  const t = templates[Number(e.target.value)]
                  if (t) apply(t)
                }}
              >
                <option value="" disabled>
                  选择模板
                </option>
                {templates.map((t, i) => (
                  <option key={t.title} value={i}>
                    {t.title}
                    {t.repeatMonthly ? " · 每月重复" : ""}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}
          <FieldGroup className="gap-4">
            <Field data-invalid={attempted && Boolean(titleError)}>
              <FieldLabel htmlFor="bill-title">标题</FieldLabel>
              <Input
                id="bill-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：房租、采购、差旅"
                autoFocus
                aria-invalid={attempted && Boolean(titleError)}
                aria-describedby={
                  attempted && titleError ? "bill-title-error" : undefined
                }
              />
              {attempted && titleError && (
                <FieldError id="bill-title-error">{titleError}</FieldError>
              )}
            </Field>
            {supportsOccurrenceDate && (
              <Field data-invalid={attempted && Boolean(dateError)}>
                <FieldLabel htmlFor="bill-date">发生日期</FieldLabel>
                <Input
                  id="bill-date"
                  type="date"
                  max={todayKey()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-invalid={attempted && Boolean(dateError)}
                  aria-describedby={
                    attempted && dateError ? "bill-date-error" : undefined
                  }
                />
                {attempted && dateError && (
                  <FieldError id="bill-date-error">{dateError}</FieldError>
                )}
              </Field>
            )}

            <Field data-invalid={attempted && Boolean(amountError)}>
              <FieldLabel htmlFor="bill-amount">金额（人民币）</FieldLabel>
              <Input
                id="bill-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                aria-invalid={attempted && Boolean(amountError)}
                aria-describedby={
                  attempted && amountError ? "bill-amount-error" : undefined
                }
              />
              {attempted && amountError && (
                <FieldError id="bill-amount-error">{amountError}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel id="bill-category-label">账单类型</FieldLabel>
              <ToggleGroup
                type="single"
                value={category}
                onValueChange={(v) => {
                  if (v) {
                    setCategory(v as TransactionCreate["category"])
                    setExpenseCategoryId(null)
                    setPaymentMode("later")
                    setIncomeId("")
                  }
                }}
                aria-labelledby="bill-category-label"
                className="justify-start"
              >
                <ToggleGroupItem value="personal">个人支出</ToggleGroupItem>
                <ToggleGroupItem value="work">工作垫付</ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>
                账单保存后，可在核销页关联已到账收入。
              </FieldDescription>
            </Field>
            {supportsCategories && (
              <Field>
                <FieldLabel htmlFor="bill-expense-category">
                  支出分类
                </FieldLabel>
                <NativeSelect
                  id="bill-expense-category"
                  value={expenseCategoryId ?? ""}
                  onChange={(e) =>
                    setExpenseCategoryId(
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                >
                  <option value="">未分类</option>
                  {categories
                    .filter((c) => c.kind === category && !c.archived)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </NativeSelect>
                {categoriesError && (
                  <FieldDescription>
                    分类加载失败，可以先记为未分类；稍后在编辑中补充。
                  </FieldDescription>
                )}
              </Field>
            )}
            {supportsImmediatePayment && category === "personal" && (
              <Field data-invalid={attempted && Boolean(paymentError)}>
                <FieldLabel id="bill-payment-label">支付记录</FieldLabel>
                <ToggleGroup
                  type="single"
                  value={paymentMode}
                  onValueChange={(v) => {
                    if (v) setPaymentMode(v)
                  }}
                  aria-labelledby="bill-payment-label"
                  className="justify-start"
                >
                  <ToggleGroupItem value="later">稍后关联收入</ToggleGroupItem>
                  <ToggleGroupItem value="paid">
                    已支付，一次记录
                  </ToggleGroupItem>
                </ToggleGroup>
                {quickPayment && (
                  <>
                    <FieldLabel htmlFor="bill-payment-income">
                      使用已到账收入
                    </FieldLabel>
                    <NativeSelect
                      id="bill-payment-income"
                      aria-invalid={attempted && Boolean(paymentError)}
                      aria-describedby={
                        attempted && paymentError
                          ? "bill-payment-error"
                          : undefined
                      }
                      value={incomeId}
                      onChange={(e) => setIncomeId(e.target.value)}
                      disabled={incomeLoading || incomeError}
                    >
                      <option value="">
                        {incomeLoading
                          ? "正在加载收入…"
                          : incomeError
                            ? "收入加载失败"
                            : availableLogs.length
                              ? "选择收入"
                              : "暂无可用收入，请先记录到账收入"}
                      </option>
                      {availableLogs.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.month} ·{" "}
                          {i.source === "salary"
                            ? "工资"
                            : i.source === "reimbursement"
                              ? "报销"
                              : "其他收入"}{" "}
                          · 可用 {currency.format(i.amount_unused)}
                        </option>
                      ))}
                    </NativeSelect>
                    <FieldDescription>
                      保存消费并全额关联这笔收入；两步同时成功后才会入账。
                    </FieldDescription>
                    {attempted && paymentError && (
                      <FieldError id="bill-payment-error">
                        {paymentError}
                      </FieldError>
                    )}
                  </>
                )}
              </Field>
            )}
            <FieldSet className="gap-3">
              <FieldLegend variant="label">常用记录</FieldLegend>
              <Field orientation="horizontal" className="min-h-10">
                <Checkbox
                  id="bill-save-template"
                  checked={saveTemplate}
                  onCheckedChange={(checked) =>
                    setSaveTemplate(checked === true)
                  }
                />
                <FieldLabel htmlFor="bill-save-template">
                  保存为常用记录
                </FieldLabel>
              </Field>
              {saveTemplate && (
                <>
                  <Field orientation="horizontal" className="min-h-10">
                    <Checkbox
                      id="bill-monthly"
                      checked={monthly}
                      onCheckedChange={(checked) =>
                        setMonthly(checked === true)
                      }
                    />
                    <FieldLabel htmlFor="bill-monthly">每月重复提醒</FieldLabel>
                  </Field>
                  <FieldDescription>
                    模板保存在此设备；重复账单需你确认后才录入。
                  </FieldDescription>
                </>
              )}
            </FieldSet>
          </FieldGroup>
        </div>
        <DialogFooter className="border-t px-6 pb-6 pt-3">
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
export function TransactionDialog(props: Props) {
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
