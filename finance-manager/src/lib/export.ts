import type { Transaction } from "../types"
import { todayKey } from "./formHelpers"
import { transactionDate } from "./navigation"

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function csvCell(value: string | number) {
  const text = String(value)
  // Protect spreadsheet users from formula execution in user-entered titles.
  const safe = /^[=+@\-\t\r]/.test(text) && typeof value === "string" ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export function exportTransactionsCsv(transactions: Transaction[]) {
  const rows: Array<Array<string | number>> = [
    ["日期", "标题", "类型", "支出分类", "金额（人民币）", "已核销", "未结", "状态"],
  ]
  transactions.forEach((t) =>
    rows.push([
      transactionDate(t).slice(0, 10),
      t.title,
      t.category === "work" ? "工作垫付" : "个人支出",
      t.expense_category_name ?? "未分类",
      t.amount_out,
      t.amount_reimbursed,
      t.amount_out - t.amount_reimbursed,
      { pending: "待核销", partially_settled: "部分核销", settled: "已结清" }[t.status],
    ]),
  )
  downloadFile(
    `账单-${todayKey()}.csv`,
    "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  )
}
