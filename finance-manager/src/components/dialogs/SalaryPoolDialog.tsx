import { useState } from "react"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Skeleton } from "../ui/skeleton"
import { currency } from "../../lib/formatters"
import type { SalaryLog } from "../../types"

const sourceLabel: Record<SalaryLog["source"], string> = {
  salary: "工资",
  reimbursement: "报销",
  other: "其他",
}

export function SalaryPoolDialog({
  open,
  onOpenChange,
  data,
  isLoading,
  isError,
  onEdit,
  onDelete,
  isDeleting,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  data: SalaryLog[]
  isLoading: boolean
  isError: boolean
  onEdit: (log: SalaryLog) => void
  onDelete: (id: number) => void
  isDeleting: boolean
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  function handleDelete(id: number) {
    onDelete(id)
    setConfirmDeleteId(null)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setConfirmDeleteId(null); onOpenChange(v) }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>资金池明细</DialogTitle>
          <DialogDescription>查看、编辑或删除回款记录</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>月份</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>总金额</TableHead>
                <TableHead>已用</TableHead>
                <TableHead>剩余</TableHead>
                <TableHead>备注</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))}
              {isError && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-red-500">
                    无法加载回款明细，请稍后重试
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-400">
                    暂无回款记录
                  </TableCell>
                </TableRow>
              )}
              {data.map((log) => {
                const used = log.amount - log.amount_unused
                const hasSettlements = used > 0
                const isConfirming = confirmDeleteId === log.id
                return (
                  <TableRow key={log.id} className="group/row">
                    <TableCell className="tabular-nums text-slate-700">{log.month}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        log.source === "salary" ? "bg-emerald-50 text-emerald-700" :
                        log.source === "reimbursement" ? "bg-cyan-50 text-cyan-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {sourceLabel[log.source]}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums font-medium text-slate-900">{currency.format(log.amount)}</TableCell>
                    <TableCell className="tabular-nums text-slate-500">{currency.format(used)}</TableCell>
                    <TableCell className={`tabular-nums font-medium ${log.amount_unused > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {currency.format(log.amount_unused)}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-slate-500" title={log.remark || ""}>
                      {log.remark || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {isConfirming ? (
                        <div className="inline-flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => handleDelete(log.id)}
                          >
                            {isDeleting ? <Loader2 size={13} className="animate-spin" /> : "确认"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isDeleting}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            取消
                          </Button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-500 hover:text-slate-700"
                            onClick={() => onEdit(log)}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={hasSettlements
                              ? "cursor-not-allowed text-slate-300"
                              : "text-red-500 hover:text-red-600"
                            }
                            disabled={hasSettlements}
                            onClick={() => setConfirmDeleteId(log.id)}
                            title={hasSettlements ? "有核销记录，无法删除" : "删除此回款"}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
