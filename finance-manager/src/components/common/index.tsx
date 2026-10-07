import { Alert, AlertDescription } from "../ui/alert"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "../ui/empty"
import { CheckCircle2, Clock, Timer, Briefcase, User } from "lucide-react"
import { Badge } from "../ui/badge"
import { Skeleton } from "../ui/skeleton"
import { TableRow, TableCell } from "../ui/table"
import { Button } from "../ui/button"
import type { Transaction } from "../../types"

/* ─── Status badge ─── */
export function StatusBadge({ status }: { status: Transaction["status"] }) {
  if (status === "settled")
    return (
      <Badge variant="success">
        <CheckCircle2 size={11} />
        已结清
      </Badge>
    )
  if (status === "partially_settled")
    return (
      <Badge variant="info">
        <Timer size={11} />
        部分核销
      </Badge>
    )
  return (
    <Badge variant="warning">
      <Clock size={11} />
      待核销
    </Badge>
  )
}

/* ─── Category badge ─── */
export function CategoryBadge({
  category,
}: {
  category: Transaction["category"]
}) {
  if (category === "work")
    return (
      <Badge variant="info">
        <Briefcase size={11} />
        工作
      </Badge>
    )
  return (
    <Badge variant="warning">
      <User size={11} />
      个人
    </Badge>
  )
}

/* ─── Error box ─── */
export function ErrorBox({ msg }: { msg: string }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{msg}</AlertDescription>
    </Alert>
  )
}

/* ─── Skeleton loaders ─── */
export function CardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-card shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-muted" />
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
    <div className="relative overflow-hidden rounded-xl bg-card shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-muted" />
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="mt-4 space-y-2.5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-28" />
          </div>
        </div>
        <Skeleton className="h-3 w-20 mt-2" />
      </div>
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-12 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-16 ml-auto" />
      </TableCell>
    </TableRow>
  )
}

export function MobileCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-md" />
    </div>
  )
}

/* ─── Empty state ─── */
export function EmptyState({
  onAdd,
  filtered = false,
  onReset,
}: {
  tab: "pending" | "history"
  onAdd: () => void
  filtered?: boolean
  onReset?: () => void
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>
          {filtered ? "没有符合条件的账单" : "暂无账单记录"}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "调整或清空筛选后再试。"
            : "记录一笔支出或垫付，开始整理账本。"}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={filtered ? onReset : onAdd}>
          {filtered ? "清空筛选" : "记录第一笔账单"}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
