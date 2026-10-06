import { lazy, Suspense, useEffect, useState } from "react"
import { Toaster } from "sonner"
import { useApiEndpoint } from "./hooks/useApiEndpoint"
import { AppShell } from "./layouts/AppShell"
import { buildHash, readLocation, type AppNavigate } from "./lib/navigation"
import { DashboardPage } from "./pages/DashboardPage"

import { SettlementWorkbenchPage } from "./pages/SettlementWorkbenchPage"

import { TransactionsPage } from "./pages/TransactionsPage"

const MonthlyReviewPage = lazy(() =>
  import("./pages/MonthlyReviewPage").then((module) => ({ default: module.MonthlyReviewPage })),
)
const TradingJournalPage = lazy(() =>
  import("./pages/TradingJournalPage").then((module) => ({ default: module.TradingJournalPage })),
)

function App() {
  const endpoint = useApiEndpoint()
  const [location, setLocation] = useState(() => readLocation())
  useEffect(() => {
    const handleHashChange = () => setLocation(readLocation())
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])
  const navigate: AppNavigate = (view, params) => {
    try {
      sessionStorage.setItem(`finance-view-${location.view}`, window.location.hash)
      sessionStorage.setItem(`finance-scroll-${location.view}`, String(window.scrollY))
    } catch {
      /* Navigation also works without session storage. */
    }
    let hash = buildHash(view, params)
    let scroll = 0
    if (!params) {
      try {
        hash = sessionStorage.getItem(`finance-view-${view}`) || hash
        scroll = Number(sessionStorage.getItem(`finance-scroll-${view}`)) || 0
      } catch {
        /* Use the default view. */
      }
    }
    window.location.hash = hash
    setLocation(readLocation(hash))
    requestAnimationFrame(() => window.scrollTo({ top: scroll, behavior: "instant" }))
  }
  const transactionId = Number(location.params.get("transactionId")) || undefined
  return (
    <>
      <AppShell key={endpoint} activeView={location.view} onViewChange={navigate}>
        <Suspense
          fallback={
            <p role="status" className="py-8 text-sm text-muted-foreground">
              正在打开页面…
            </p>
          }
        >
          {location.view === "dashboard" && <DashboardPage onNavigate={navigate} />}
          {location.view === "transactions" && (
            <TransactionsPage key={location.params.toString()} onNavigate={navigate} />
          )}
          {location.view === "workbench" && (
            <SettlementWorkbenchPage
              key={transactionId ?? "queue"}
              initialTransactionId={transactionId}
              onNavigate={navigate}
            />
          )}
          {location.view === "review" && <MonthlyReviewPage onNavigate={navigate} />}
          {location.view === "trading" && <TradingJournalPage />}
        </Suspense>
      </AppShell>
      <Toaster position="top-center" richColors closeButton />
    </>
  )
}
export default App
