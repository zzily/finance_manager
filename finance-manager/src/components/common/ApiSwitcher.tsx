import { useEffect, useState, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  API_ENDPOINTS,
  getCurrentApiIndex,
  setApiEndpoint,
  subscribeApiChange,
} from "../../lib/api"

/**
 * Floating API environment switcher (bottom-right pill).
 * - Color-coded pill: green = remote, amber = local
 * - Health-check dot shows live connectivity
 * - Auto-invalidates all queries on switch
 * - Syncs UI when auto-failover kicks in
 */
export function ApiSwitcher() {
  const [activeIndex, setActiveIndex] = useState(getCurrentApiIndex)
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking")
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const current = API_ENDPOINTS[activeIndex]

  // Subscribe to api layer changes (auto-failover sync)
  useEffect(() => {
    return subscribeApiChange((idx) => setActiveIndex(idx))
  }, [])

  // Health check on mount & endpoint change
  useEffect(() => {
    let cancelled = false
    setStatus("checking")

    const controller = new AbortController()
    fetch(`${current.url}/docs`, { method: "HEAD", signal: controller.signal })
      .then(() => { if (!cancelled) setStatus("online") })
      .catch(() => { if (!cancelled) setStatus("offline") })

    return () => { cancelled = true; controller.abort() }
  }, [current.url])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  function handleSelect(index: number) {
    if (index === activeIndex) { setIsOpen(false); return }
    setApiEndpoint(index)
    setActiveIndex(index)
    setIsOpen(false)
    queryClient.invalidateQueries()
    toast.success("已切换 API 环境", {
      description: `当前连接：${API_ENDPOINTS[index].label}`,
    })
  }

  const statusDot =
    status === "online"   ? "bg-emerald-500" :
    status === "offline"  ? "bg-red-500" :
                            "bg-amber-400 animate-pulse"

  const pillStyle =
    current.key === "local"
      ? "border-amber-200 bg-amber-50/90 text-amber-700 hover:bg-amber-100"
      : "border-emerald-200 bg-emerald-50/90 text-emerald-700 hover:bg-emerald-100"

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-50">
      {/* Expanded selection panel */}
      {isOpen && (
        <div className="mb-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">API 环境</p>
          </div>
          <div className="p-1.5">
            {API_ENDPOINTS.map((endpoint, idx) => {
              const isActive = idx === activeIndex
              return (
                <button
                  key={endpoint.key}
                  onClick={() => handleSelect(idx)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base leading-none">{endpoint.label.split(" ")[0]}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${isActive ? "text-white" : "text-slate-900"}`}>
                      {endpoint.label.split(" ").slice(1).join(" ")}
                    </p>
                    <p className={`mt-0.5 truncate text-[11px] ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                      {endpoint.url}
                    </p>
                  </div>
                  {isActive && (
                    <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
                  )}
                </button>
              )
            })}
          </div>
          <div className="border-t border-slate-100 px-3 py-2">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              连接失败时系统会自动切换到下一个可用环境
            </p>
          </div>
        </div>
      )}

      {/* Trigger — color-coded pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur-sm transition-all hover:shadow-lg active:scale-95 ${pillStyle}`}
        title={`${current.label}\n${current.url}\n状态：${status === "online" ? "在线" : status === "offline" ? "离线" : "检测中"}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
        {current.label}
      </button>
    </div>
  )
}
