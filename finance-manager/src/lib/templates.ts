import type { TransactionCreate } from "../types"
import { API_ENDPOINTS, getCurrentApiIndex } from "./api"
import { todayKey } from "./formHelpers"

export type BillTemplate = TransactionCreate & {
  expenseCategoryName?: string
  repeatMonthly?: boolean
  lastRecordedMonth?: string
}
const storageKey = () => `finance-templates-${API_ENDPOINTS[getCurrentApiIndex()].key}`
export const TEMPLATE_EVENT = "finance-templates-changed"

export function parseTemplates(value: unknown): BillTemplate[] {
  if (!Array.isArray(value)) throw new Error("常用记录格式不正确")
  if (value.length > 20) throw new Error("最多导入 20 条常用记录")
  return value.map((t) => {
    if (
      !t ||
      typeof t.title !== "string" ||
      !t.title.trim() ||
      !Number.isFinite(t.amount_out) ||
      t.amount_out <= 0 ||
      !["work", "personal"].includes(t.category)
    )
      throw new Error("常用记录包含无效的标题、金额或类型")
    return {
      title: t.title.trim(),
      amount_out: t.amount_out,
      category: t.category,
      repeatMonthly: t.repeatMonthly === true,
      ...(typeof t.expenseCategoryName === "string" ? { expenseCategoryName: t.expenseCategoryName.slice(0,50) } : {}),
      ...(Number.isInteger(t.expense_category_id) && t.expense_category_id > 0 ? { expense_category_id: t.expense_category_id } : {}),
      ...(typeof t.lastRecordedMonth === "string" && /^\d{4}-\d{2}$/.test(t.lastRecordedMonth)
        ? { lastRecordedMonth: t.lastRecordedMonth }
        : {}),
    }
  })
}
export function loadTemplates(): BillTemplate[] {
  try {
    return parseTemplates(JSON.parse(localStorage.getItem(storageKey()) || "[]"))
  } catch {
    return []
  }
}
export function saveTemplates(templates: BillTemplate[]) {
  localStorage.setItem(storageKey(), JSON.stringify(parseTemplates(templates)))
  window.dispatchEvent(new Event(TEMPLATE_EVENT))
}
export function rememberTemplate(template: BillTemplate) {
  const existing = loadTemplates()
  saveTemplates([template, ...existing.filter((t) => t.title !== template.title)].slice(0, 20))
}
export function markTemplateRecorded(payload: TransactionCreate) {
  const templates = loadTemplates()
  if (!templates.some((t) => t.title === payload.title)) return
  try {
    saveTemplates(
      templates.map((t) =>
        t.title === payload.title && t.category === payload.category
          ? { ...t, lastRecordedMonth: (payload.occurred_at ?? todayKey()).slice(0, 7) }
          : t,
      ),
    )
  } catch {
    /* A storage failure must not turn a successful ledger write into an error. */
  }
}
