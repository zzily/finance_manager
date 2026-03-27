import type { ReactNode } from "react"

import { Wallet } from "lucide-react"

import type { AppView } from "./appShell.types"
import { PrimaryNav } from "../components/navigation/PrimaryNav"

export function AppShell({
  activeView,
  children,
  onViewChange,
}: {
  activeView: AppView
  children: ReactNode
  onViewChange: (view: AppView) => void
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Finance cockpit
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                  家庭财务驾驶舱
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  把日常记账、回款管理和核销动作拆成更清晰的工作流，减少来回切换和操作犹豫。
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-500 shadow-sm">
              <p className="font-medium text-slate-900">当前视图</p>
              <p className="mt-1">
                {activeView === "dashboard" && "总览与提醒"}
                {activeView === "transactions" && "账单管理与筛选"}
                {activeView === "workbench" && "推荐核销与快速处理"}
                {activeView === "review" && "趋势洞察与复盘"}
              </p>
            </div>
          </div>

          <PrimaryNav activeView={activeView} onViewChange={onViewChange} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
