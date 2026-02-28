import { CheckCircle2, Clock, Timer, Briefcase, User } from "lucide-react"
import { Badge } from "../ui/badge"
import { Skeleton } from "../ui/skeleton"
import { TableRow, TableCell } from "../ui/table"
import { FileText, Plus } from "lucide-react"
import { Button } from "../ui/button"
import type { Transaction } from "../../types"

/* ─── Status badge ─── */
export function StatusBadge({ status }: { status: Transaction["status"] }) {
  if (status === "settled")
    return <Badge variant="success"><CheckCircle2 size={11} />已结清</Badge>
  if (status === "partially_settled")
    return <Badge variant="info"><Timer size={11} />部分核销</Badge>
  return <Badge variant="warning"><Clock size={11} />待核销</Badge>
}

/* ─── Category badge ─── */
export function CategoryBadge({ category }: { category: Transaction["category"] }) {
  if (category === "work")
    return <Badge variant="info"><Briefcase size={11} />工作</Badge>
  return <Badge className="border-orange-200 bg-orange-50 text-orange-700"><User size={11} />个人</Badge>
}

/* ─── Error box ─── */
export function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {msg}
    </div>
  )
}

/* ─── Skeleton loaders ─── */
export function CardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
      <div className="absolute left-0 top-0 h-full w-1 bg-slate-200" />
      <div className="px-5 py-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-32 mt-2" />
      </div>
    </div>
  )
}

export function DualCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
      <div className="absolute left-0 top-0 h-full w-1 bg-slate-200" />
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-28" /></div>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="mt-4 space-y-2.5">
          <div className="flex justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-24" /></div>
          <div className="flex justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-24" /></div>
          <div className="flex justify-between border-t border-slate-100 pt-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-7 w-28" /></div>
        </div>
        <Skeleton className="h-3 w-20 mt-2" />
      </div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-12 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
    </TableRow>
  )
}

export function MobileCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-card space-y-3">
      <div className="flex justify-between"><Skeleton className="h-5 w-28" /><Skeleton className="h-5 w-16 rounded-full" /></div>
      <div className="space-y-2">
        <div className="flex justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /></div>
        <div className="flex justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-20" /></div>
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  )
}

/* ─── Empty state ─── */
export function EmptyState({ tab, onAdd }: { tab: "pending" | "history"; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FileText size={28} />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-700">
        {tab === "pending" ? "暂无未结清账单" : "暂无账单记录"}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {tab === "pending" ? "所有垫付账单都已结清，干得漂亮！" : "还没有任何账单记录，开始记录吧"}
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onAdd}>
        <Plus size={14} />记录第一笔垫付
      </Button>
    </div>
  )
}
