import { useBackendCapabilities } from "../../hooks/useBackendCapabilities"
import { fetchAllPages } from "../../lib/pagination"
import { ExpenseCategorySettings } from "./ExpenseCategorySettings"
import { LedgerRestoreSettings } from "./LedgerRestoreSettings"
import { useState } from "react"
import { useIsMutating } from "@tanstack/react-query"
import { Download, Settings, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import {
  API_ENDPOINTS,
  api,
  apiBaseUrl,
  getApiErrorMessage,
  setApiEndpoint,
  unwrapResponseData,
} from "../../lib/api"
import { downloadFile } from "../../lib/export"
import { todayKey } from "../../lib/formHelpers"
import { loadTemplates, parseTemplates, saveTemplates } from "../../lib/templates"
import { useApiEndpoint } from "../../hooks/useApiEndpoint"
import { useTemplates } from "../../hooks/useTemplates"
import type {
  ApiResponse,
  SalaryLog,
  SettlementDetail,
  TradeRecord,
  Transaction,
} from "../../types"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Field, FieldLabel, FieldDescription } from "../ui/field"
import { Alert, AlertDescription } from "../ui/alert"

function SettingsBody() {
  const { capabilities } = useBackendCapabilities()
  const endpoint = useApiEndpoint()
  const current = API_ENDPOINTS.find((e) => e.key === endpoint)!
  const mutations = useIsMutating()
  const templates = useTemplates()
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function exportAll() {
    setExporting(true)
    setError(null)
    const exportTemplates = loadTemplates()
    const config = { baseURL: apiBaseUrl(endpoint) }
    try {
      if (capabilities.backups) {
        const snapshot = await unwrapResponseData(api.get<ApiResponse<Record<string, unknown>>>("/ledger/backup", config))
        downloadFile(`家庭账本-${todayKey()}.json`, JSON.stringify({ ...snapshot, endpoint, templates: exportTemplates }, null, 2), "application/json;charset=utf-8")
        toast.success("完整备份已导出")
        return
      }
      const [transactions, salaryLogs, tradeRecords] = await Promise.all([
        fetchAllPages<Transaction>("/transactions/", endpoint),
        fetchAllPages<SalaryLog>("/salary_logs/", endpoint),
        fetchAllPages<TradeRecord>("/trade_records/", endpoint),
      ])
      const settlements = await Promise.all(
        transactions
          .filter((t) => t.amount_reimbursed > 0)
          .map(async (t) => ({
            transactionId: t.id,
            records: await unwrapResponseData(
              api.get<ApiResponse<SettlementDetail[]>>(`/transactions/${t.id}/settlements`, config),
            ),
          })),
      )
      downloadFile(
        `家庭账本-${todayKey()}.json`,
        JSON.stringify(
          {
            version: 1,
            exportedAt: new Date().toISOString(),
            endpoint,
            transactions,
            salaryLogs,
            tradeRecords,
            settlements,
            templates: exportTemplates,
          },
          null,
          2,
        ),
        "application/json;charset=utf-8",
      )
      toast.success("完整记录已导出")
    } catch (e) {
      setError(getApiErrorMessage(e, "导出失败，请重试"))
    } finally {
      setExporting(false)
    }
  }
  return (
    <div className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="ledger-source">账本连接</FieldLabel>
        <select
          id="ledger-source"
          className="h-11 w-full rounded-md border bg-background px-3 text-sm"
          value={endpoint}
          disabled={mutations > 0 || exporting}
          onChange={(e) => setApiEndpoint(API_ENDPOINTS.findIndex((v) => v.key === e.target.value))}
        >
          <option value="remote">线上账本</option>
          <option value="local">本地账本</option>
        </select>
        <FieldDescription>
          当前：{current.url}。两个连接的数据彼此独立；正在保存时无法切换。
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel>数据导出</FieldLabel>
        <FieldDescription>
          {capabilities.backups ? "导出同一时刻的完整账本，包含原始字段、核销关系、分类和常用记录，可用于空账本恢复。" : "导出账单、收入、交易、核销历史和常用记录。当前连接使用旧版后端，导出记录不能完整恢复服务器账本。"}
        </FieldDescription>
        <Button
          variant="outline"
          onClick={() => {
            void exportAll()
          }}
          disabled={exporting || mutations > 0}
        >
          <Download data-icon="inline-start" />
          {exporting ? "正在导出…" : capabilities.backups ? "导出完整备份（JSON）" : "导出完整记录（JSON）"}
        </Button>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </Field>
      {capabilities.restore && <LedgerRestoreSettings />}
      {capabilities.expenseCategories && <ExpenseCategorySettings />}
      <Field>
        <FieldLabel htmlFor="template-import">常用记录 · {templates.length} 条</FieldLabel>
        <FieldDescription>保存在此设备。导入会按标题合并，同名记录使用导入版本。</FieldDescription>
        <label
          htmlFor="template-import"
          className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
        >
          <Upload className="size-4" aria-hidden="true" />
          导入常用记录
        </label>
        <input
          id="template-import"
          type="file"
          accept=".json,application/json"
          className="sr-only"
          disabled={exporting || mutations > 0}
          onChange={async (e) => {
            const file = e.currentTarget.files?.[0]
            e.currentTarget.value = ""
            if (!file) return
            try {
              if (file.size > 10 * 1024 * 1024) throw new Error("文件不能超过 10 MB")
              const data = JSON.parse(await file.text())
              const incoming = parseTemplates(Array.isArray(data) ? data : data.templates)
              const merged = [
                ...incoming,
                ...loadTemplates().filter((t) => !incoming.some((v) => v.title === t.title)),
              ]
              saveTemplates(merged)
              toast.success(`已导入 ${incoming.length} 条常用记录`)
            } catch (err) {
              toast.error(getApiErrorMessage(err, "导入失败"))
            }
          }}
        />
        <div className="flex max-h-52 flex-col divide-y overflow-y-auto">
          {templates.map((t) => (
            <div key={t.title} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate text-sm">
                {t.title}
                {t.repeatMonthly ? " · 每月提醒" : ""}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`删除常用记录：${t.title}`}
                disabled={mutations > 0}
                onClick={() => {
                  try {
                    saveTemplates(templates.filter((v) => v.title !== t.title))
                  } catch {
                    toast.error("删除失败")
                  }
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </Field>
    </div>
  )
}
export function ApiSwitcher() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="icon" aria-label="账本设置" onClick={() => setOpen(true)}>
        <Settings className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>账本设置</DialogTitle>
            <DialogDescription>管理连接、常用记录与数据导出。</DialogDescription>
          </DialogHeader>
          {open && <div className="min-h-0 overflow-y-auto px-6"><SettingsBody /></div>}
          <DialogFooter className="border-t px-6 pb-6 pt-3">
            <DialogClose asChild>
              <Button variant="secondary">关闭设置</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
