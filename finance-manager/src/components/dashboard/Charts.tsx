import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import { Skeleton } from "../ui/skeleton"
import { currency } from "../../lib/formatters"
import type { ChartData } from "../../types"

const COLORS = {
  income_salary: "#10b981",
  income_reimbursement: "#06b6d4",
  spending_work: "#f59e0b",
  spending_personal: "#ef4444",
}

const PIE_COLORS = ["#f59e0b", "#ef4444", "#10b981", "#06b6d4"]

/* ─── Custom tooltip for bar chart ─── */
function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-slate-700">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500">{entry.name}</span>
          </div>
          <span className="tabular-nums font-medium text-slate-900">{currency.format(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Monthly Trend Bar Chart ─── */
export function MonthlyTrendChart({ data, isLoading }: { data: ChartData | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
        <div className="px-5 py-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-[220px] w-full mt-2 rounded-lg" />
        </div>
      </div>
    )
  }

  const timeline = data?.monthly_timeline ?? []
  if (timeline.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">月度收支趋势</p>
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">暂无数据</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">月度收支趋势</p>
        <p className="mt-0.5 text-xs text-slate-400">按月对比收入与支出</p>
        <div className="mt-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeline} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<BarTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
              <Bar dataKey="income_salary" name="工资" fill={COLORS.income_salary} radius={[3, 3, 0, 0]} />
              <Bar dataKey="income_reimbursement" name="报销" fill={COLORS.income_reimbursement} radius={[3, 3, 0, 0]} />
              <Bar dataKey="spending_work" name="工作垫付" fill={COLORS.spending_work} radius={[3, 3, 0, 0]} />
              <Bar dataKey="spending_personal" name="个人消费" fill={COLORS.spending_personal} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

/* ─── Category Pie Chart ─── */
export function CategoryPieChart({ data, isLoading }: { data: ChartData | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
        <div className="px-5 py-4 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
          <div className="flex items-center justify-center py-4"><Skeleton className="h-[180px] w-[180px] rounded-full" /></div>
        </div>
      </div>
    )
  }

  const breakdown = data?.category_breakdown ?? []
  const total = breakdown.reduce((s, i) => s + i.value, 0)

  if (breakdown.length === 0 || total === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">支出构成</p>
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">暂无数据</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-card">
      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">支出构成</p>
        <p className="mt-0.5 text-xs text-slate-400">工作垫付 vs 个人消费</p>
        <div className="relative mt-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdown}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {breakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => currency.format(Number(value))}
                contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label inside donut */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[11px] text-slate-400">总支出</p>
              <p className="text-base font-bold tabular-nums text-slate-900">{currency.format(total)}</p>
            </div>
          </div>
        </div>
        {/* Legend below chart */}
        <div className="mt-2 flex flex-wrap justify-center gap-4">
          {breakdown.map((item, i) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span>{item.name}</span>
              <span className="tabular-nums font-medium text-slate-900">{currency.format(item.value)}</span>
              <span className="text-slate-400">{total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : ""}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
