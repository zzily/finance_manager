import type { ReactNode } from "react"
import { ApiSwitcher } from "../components/common/ApiSwitcher"
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
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById("main-content")?.focus()
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
      >
        跳转到主要内容
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Wallet className="size-5" aria-hidden="true" />
            <h1 className="text-base font-semibold">家庭账本</h1>
          </div>
          <div className="flex items-center gap-2">
            <PrimaryNav activeView={activeView} onViewChange={onViewChange} />
            <ApiSwitcher />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-7xl px-4 py-5 pb-28 outline-none sm:px-6 sm:pb-8"
      >
        {children}
      </main>
    </div>
  )
}
