import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Skeleton } from "../ui/skeleton"
import { currency, dateFormatter } from "../../lib/formatters"
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
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  data: SalaryLog[]
  isLoading: boolean
  isError: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>资金池明细</DialogTitle>
          <DialogDescription>查看所有回款的使用情况</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>到账日期</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>总金额</TableHead>
                <TableHead>已用</TableHead>
                <TableHead>剩余</TableHead>
                <TableHead>备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))}
              {isError && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-red-500">
                    无法加载回款明细，请稍后重试
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-400">
                    暂无回款记录
                  </TableCell>
                </TableRow>
              )}
              {data.map((log) => {
                const used = log.amount - log.amount_unused
                return (
                  <TableRow key={log.id}>
                    <TableCell className="tabular-nums">{dateFormatter.format(new Date(log.received_date))}</TableCell>
                    <TableCell>{sourceLabel[log.source]}</TableCell>
                    <TableCell className="tabular-nums">{currency.format(log.amount)}</TableCell>
                    <TableCell className="tabular-nums text-slate-500">{currency.format(used)}</TableCell>
                    <TableCell className={`tabular-nums font-medium ${log.amount_unused > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {currency.format(log.amount_unused)}
                    </TableCell>
                    <TableCell className="text-slate-500">{log.remark || ""}</TableCell>
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
