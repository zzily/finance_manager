import type { AppView } from "../layouts/appShell.types"

export type NavigationParams = Record<string, string | number | boolean | undefined>
export type AppNavigate = (view: AppView, params?: NavigationParams) => void

const views: AppView[] = ["dashboard", "transactions", "workbench", "review", "trading"]

export function readLocation(hash = window.location.hash) {
  const [name, search = ""] = hash.replace(/^#/, "").split("?")
  const view = views.includes(name as AppView) ? (name as AppView) : "dashboard"
  return { view, params: new URLSearchParams(search) }
}

export function buildHash(view: AppView, params: NavigationParams = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && value !== false) search.set(key, String(value))
  }
  return `#${view}${search.size ? `?${search}` : ""}`
}

export function transactionDate(transaction: { created_at: string; occurred_at?: string | null }) {
  return transaction.occurred_at || transaction.created_at
}
