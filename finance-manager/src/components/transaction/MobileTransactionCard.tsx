import { Zap, Pencil, Trash2, History } from "lucide-react"
import { Button } from "../ui/button"
import { currency } from "../../lib/formatters"
import { StatusBadge, CategoryBadge } from "../common"
import type { Transaction } from "../../types"

export function MobileTransactionCard({
  item,
  onSettle,
  onEdit,
  onDelete,
  onHistory,
}: {
  item: Transaction
  onSettle: (t: Transaction) => void
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onHistory: (t: Transaction) => void
}) {
  const due = item.amount_out - item.amount_reimbursed
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm font-semibold text-slate-900">{item.title}</span>
          <CategoryBadge category={item.category} />
        </div>
        <StatusBadge status={item.status} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[11px] text-slate-400">账单金额</p>
          <p className="text-sm font-medium tabular-nums text-slate-700">{currency.format(item.amount_out)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">已还</p>
          <p className="text-sm font-medium tabular-nums text-slate-500">{currency.format(item.amount_reimbursed)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">未结清</p>
          <p className={`text-sm font-bold tabular-nums ${due > 0 ? "text-red-600" : "text-emerald-600"}`}>{currency.format(due)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
        {item.status !== "settled" && (
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onSettle(item)}>
            <Zap size={13} />核销
          </Button>
        )}
        {item.amount_reimbursed > 0 && (
          <Button size="sm" variant="ghost" className="text-slate-500" onClick={() => onHistory(item)}>
            <History size={13} />
          </Button>
        )}
        <Button size="sm" variant="ghost" className="text-slate-500" onClick={() => onEdit(item)}>
          <Pencil size={13} />
        </Button>
        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => onDelete(item)}>
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  )
}
