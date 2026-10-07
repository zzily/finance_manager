import { cn } from "../../lib/utils"
import { Zap, MoreHorizontal, Pencil, Trash2, History } from "lucide-react"
import { Button } from "../ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { transactionDate } from "../../lib/navigation"
import { currency } from "../../lib/formatters"
import {
  StatusBadge,
  CategoryBadge,
  TableRowSkeleton,
  EmptyState,
} from "../common"
import type { Transaction } from "../../types"

export function TransactionTable({
  data,
  isLoading,
  isError,
  activeTab,
  onSettle,
  onEdit,
  onDelete,
  onHistory,
  onAdd,
  hasActiveFilters = false,
  onReset,
}: {
  data: Transaction[]
  isLoading: boolean
  isError: boolean
  activeTab: "pending" | "history"
  onSettle: (t: Transaction) => void
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onHistory: (t: Transaction) => void
  onAdd: () => void
  hasActiveFilters?: boolean
  onReset?: () => void
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
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)}
        {isError && (
          <TableRow>
            <TableCell
              colSpan={7}
              className="py-10 text-center text-sm text-destructive"
            >
              无法加载账单，请稍后重试
            </TableCell>
          </TableRow>
        )}
        {!isLoading && !isError && data.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="p-0">
              <EmptyState
                tab={activeTab}
                onAdd={onAdd}
                filtered={hasActiveFilters}
                onReset={onReset}
              />
            </TableCell>
          </TableRow>
        )}
        {data.map((item) => {
          const due = item.amount_out - item.amount_reimbursed
          return (
            <TableRow key={item.id} className="group/row">
              <TableCell className="font-medium text-foreground">
                <span>{item.title}</span>
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  {transactionDate(item).slice(0, 10)}
                </p>
              </TableCell>
              <TableCell>
                <CategoryBadge category={item.category} />
                {item.expense_category_name && (
                  <span className="text-xs text-muted-foreground">
                    {item.expense_category_name}
                  </span>
                )}
              </TableCell>
              <TableCell className="tabular-nums text-foreground">
                {currency.format(item.amount_out)}
              </TableCell>
              <TableCell className="tabular-nums text-muted-foreground">
                {currency.format(item.amount_reimbursed)}
              </TableCell>
              <TableCell
                className={cn(
                  "tabular-nums font-medium",
                  due > 0 ? "text-expense" : "text-income",
                )}
              >
                {currency.format(due)}
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center justify-end gap-1.5">
                  {item.status !== "settled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSettle(item)}
                    >
                      <Zap data-icon="inline-start" />
                      核销
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`${item.title}的更多操作`}
                      >
                        <MoreHorizontal aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        {item.amount_reimbursed > 0 && (
                          <DropdownMenuItem onClick={() => onHistory(item)}>
                            <History
                              size={14}
                              className="text-muted-foreground"
                            />
                            核销记录
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Pencil size={14} className="text-muted-foreground" />
                          编辑
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 size={14} />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
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
