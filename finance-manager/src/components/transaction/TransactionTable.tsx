import { Zap, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { currency } from "../../lib/formatters"
import { StatusBadge, CategoryBadge, TableRowSkeleton, EmptyState } from "../common"
import type { Transaction } from "../../types"

export function TransactionTable({
  data,
  isLoading,
  isError,
  activeTab,
  onSettle,
  onEdit,
  onDelete,
  onAdd,
}: {
  data: Transaction[]
  isLoading: boolean
  isError: boolean
  activeTab: "pending" | "history"
  onSettle: (t: Transaction) => void
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onAdd: () => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>标题</TableHead>
          <TableHead>类型</TableHead>
          <TableHead>账单金额</TableHead>
          <TableHead>已还</TableHead>
          <TableHead>未结清</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)}
        {isError && (
          <TableRow>
            <TableCell colSpan={7} className="py-10 text-center text-sm text-red-500">
              无法加载账单，请稍后重试
            </TableCell>
          </TableRow>
        )}
        {!isLoading && data.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="p-0">
              <EmptyState tab={activeTab} onAdd={onAdd} />
            </TableCell>
          </TableRow>
        )}
        {data.map((item) => {
          const due = item.amount_out - item.amount_reimbursed
          return (
            <TableRow key={item.id} className="group/row">
              <TableCell className="font-medium text-slate-900">{item.title}</TableCell>
              <TableCell><CategoryBadge category={item.category} /></TableCell>
              <TableCell className="tabular-nums text-slate-700">{currency.format(item.amount_out)}</TableCell>
              <TableCell className="tabular-nums text-slate-500">{currency.format(item.amount_reimbursed)}</TableCell>
              <TableCell className={`tabular-nums font-medium ${due > 0 ? "text-red-600" : "text-emerald-600"}`}>{currency.format(due)}</TableCell>
              <TableCell><StatusBadge status={item.status} /></TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center justify-end gap-1.5">
                  {item.status !== "settled" && (
                    <Button size="sm" variant="outline" onClick={() => onSettle(item)}>
                      <Zap size={13} />核销
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1">
                        <MoreHorizontal size={15} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Pencil size={14} className="text-slate-500" />编辑
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => onDelete(item)}>
                        <Trash2 size={14} />删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
