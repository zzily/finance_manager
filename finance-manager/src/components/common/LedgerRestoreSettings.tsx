import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  api,
  apiBaseUrl,
  getApiErrorMessage,
  unwrapResponseData,
} from "../../lib/api"
import { useApiEndpoint } from "../../hooks/useApiEndpoint"
import {
  parseTemplates,
  saveTemplates,
  type BillTemplate,
} from "../../lib/templates"
import type { ApiResponse } from "../../types"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Field, FieldLabel, FieldDescription } from "../ui/field"
import { Alert, AlertDescription } from "../ui/alert"

type BackupFile = {
  version: 2
  checksum: string
  ledger: { expense_categories: Array<{ id: number; name: string }> }
}
type Preview = {
  counts: Record<string, number>
  existing_counts: Record<string, number>
  can_restore: boolean
  already_restored: boolean
}
export function LedgerRestoreSettings() {
  const endpoint = useApiEndpoint()
  const client = useQueryClient()
  const [key, setKey] = useState("")
  const [backup, setBackup] = useState<BackupFile | null>(null)
  const [templates, setTemplates] = useState<BillTemplate[]>([])
  const [error, setError] = useState<string | null>(null)
  const config = {
    baseURL: apiBaseUrl(endpoint),
    headers: { "x-ledger-restore-key": key },
  }
  const preview = useMutation({
    mutationFn: () =>
      unwrapResponseData(
        api.post<ApiResponse<Preview>>(
          "/ledger/restore/preview",
          backup,
          config,
        ),
      ),
    onError: (e) => setError(getApiErrorMessage(e, "备份校验失败")),
  })
  const restore = useMutation({
    mutationFn: () =>
      unwrapResponseData(
        api.post<ApiResponse<{ already_restored: boolean }>>(
          "/ledger/restore",
          backup,
          config,
        ),
      ),
    onError: (e) => setError(getApiErrorMessage(e, "恢复失败，请重试")),
    onSuccess: async (result) => {
      await client.invalidateQueries({
        predicate: (q) => q.queryKey[1] === endpoint,
      })
      if (!result.already_restored && templates.length) {
        try {
          saveTemplates(templates)
        } catch {
          toast.error("账本已恢复，常用记录未能保存到此设备，请单独导入")
        }
      }
      toast.success(
        result.already_restored ? "此备份已恢复，无需重复导入" : "账本已恢复",
      )
      setKey("")
      setBackup(null)
      preview.reset()
    },
  })
  const pending = preview.isPending || restore.isPending
  function resetPreview() {
    preview.reset()
    setError(null)
  }
  return (
    <Field>
      <FieldLabel htmlFor="restore-file">从备份恢复</FieldLabel>
      <FieldDescription>
        将版本 2 备份恢复到当前{endpoint === "local" ? "本地" : "线上"}
        账本。仅接受空账本，重复导入不会新增记录。
      </FieldDescription>
      <Input
        id="restore-file"
        type="file"
        accept=".json,application/json"
        disabled={pending}
        onChange={async (e) => {
          const file = e.currentTarget.files?.[0]
          resetPreview()
          setBackup(null)
          if (!file) return
          try {
            if (file.size > 10 * 1024 * 1024)
              throw new Error("备份不能超过 10 MB")
            const data = JSON.parse(await file.text())
            if (
              data.version !== 2 ||
              !data.ledger ||
              !Array.isArray(data.ledger.expense_categories) ||
              typeof data.checksum !== "string"
            )
              throw new Error(
                "请选择版本 2 的完整账本备份；旧版导出文件只能导入常用记录",
              )
            const incoming = data.templates
              ? parseTemplates(data.templates)
              : []
            setTemplates(
              incoming.map((t) => ({
                ...t,
                expense_category_id: undefined,
                expenseCategoryName:
                  t.expenseCategoryName ??
                  data.ledger.expense_categories.find(
                    (c: { id: number }) => c.id === t.expense_category_id,
                  )?.name,
              })),
            )
            setBackup(data)
          } catch (err) {
            setError(getApiErrorMessage(err, "备份读取失败"))
          }
        }}
      />
      <FieldLabel htmlFor="restore-key">恢复密钥</FieldLabel>
      <Input
        id="restore-key"
        type="password"
        autoComplete="off"
        value={key}
        disabled={pending}
        onChange={(e) => {
          setKey(e.target.value)
          resetPreview()
        }}
        placeholder="输入此账本的恢复密钥"
      />
      <Button
        variant="outline"
        disabled={!backup || !key || pending}
        onClick={() => {
          setError(null)
          preview.mutate()
        }}
      >
        {preview.isPending ? "正在校验…" : "校验备份"}
      </Button>
      {preview.data && (
        <Alert>
          <AlertDescription>
            {preview.data.already_restored
              ? "此备份已经恢复过，再次确认不会重复写入。"
              : !preview.data.can_restore
                ? "当前账本已有记录，无法恢复；现有数据将保留。"
                : `将恢复 ${preview.data.counts.transactions ?? 0} 条账单、${preview.data.counts.salary_logs ?? 0} 条收入、${preview.data.counts.trade_records ?? 0} 条交易和 ${preview.data.counts.settlements ?? 0} 条核销。`}
          </AlertDescription>
        </Alert>
      )}
      {preview.data?.can_restore && (
        <Button
          disabled={pending}
          onClick={() => {
            setError(null)
            restore.mutate()
          }}
        >
          {restore.isPending ? "正在恢复…" : "确认恢复到账本"}
        </Button>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </Field>
  )
}
