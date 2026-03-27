import { useEffect, useState } from "react"

import { Toaster } from "sonner"
import { ApiSwitcher } from "./components/common/ApiSwitcher"
import { AppShell } from "./layouts/AppShell"
import type { AppView } from "./layouts/appShell.types"
import { DashboardPage } from "./pages/DashboardPage"
import { MonthlyReviewPage } from "./pages/MonthlyReviewPage"
import { SettlementWorkbenchPage } from "./pages/SettlementWorkbenchPage"
import { TransactionsPage } from "./pages/TransactionsPage"

const DEFAULT_VIEW: AppView = "dashboard"

function loadViewFromHash(): AppView {
  const hash = window.location.hash.replace(/^#/, "")

  if (hash === "dashboard" || hash === "transactions" || hash === "workbench" || hash === "review") {
    return hash
  }

  return DEFAULT_VIEW
}

function App() {
  const [activeView, setActiveView] = useState<AppView>(loadViewFromHash)

  useEffect(() => {
    function handleHashChange() {
      setActiveView(loadViewFromHash())
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  function handleViewChange(nextView: AppView) {
    window.location.hash = nextView
    setActiveView(nextView)
  }

  function renderCurrentView() {
    switch (activeView) {
      case "transactions":
        return <TransactionsPage onNavigate={handleViewChange} />
      case "workbench":
        return <SettlementWorkbenchPage onNavigate={handleViewChange} />
      case "review":
        return <MonthlyReviewPage onNavigate={handleViewChange} />
      case "dashboard":
      default:
        return <DashboardPage onNavigate={handleViewChange} />
    }
  }

  return (
    <>
      <AppShell activeView={activeView} onViewChange={handleViewChange}>
        {renderCurrentView()}
      </AppShell>
      <Toaster position="top-center" richColors closeButton />
      <ApiSwitcher />
    </>
  )
}

export default App
