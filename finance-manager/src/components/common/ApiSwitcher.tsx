import { useEffect, useState, useRef } from "react"
import {
  API_ENDPOINTS,
  getCurrentApiIndex,
  setApiEndpoint,
  subscribeApiChange,
} from "../../lib/api"

/**
 * 浮动 API 环境切换器
 * - 底部右侧小药丸，显示当前环境
 * - 点击展开选择面板
 * - 选择后记忆到 localStorage
 * - 自动故障切换时也会同步状态
 */
export function ApiSwitcher() {
  const [activeIndex, setActiveIndex] = useState(getCurrentApiIndex)
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 订阅 api 层的变化（自动故障切换时同步 UI）
  useEffect(() => {
    return subscribeApiChange((idx) => setActiveIndex(idx))
  }, [])

  // 点击外部关闭
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

  const current = API_ENDPOINTS[activeIndex]

  function handleSelect(index: number) {
    setApiEndpoint(index)
    setActiveIndex(index)
    setIsOpen(false)
  }

  return (
    <div ref={ref} className="fixed bottom-4 right-4 z-50">
      {/* 展开的选择面板 */}
      {isOpen && (
        <div className="mb-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">切换 API 环境</p>
          </div>
          <div className="p-1.5">
            {API_ENDPOINTS.map((endpoint, idx) => (
              <button
                key={endpoint.key}
                onClick={() => handleSelect(idx)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  idx === activeIndex
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className="text-base leading-none">{endpoint.label.split(" ")[0]}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{endpoint.label.split(" ")[1]}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">{endpoint.url}</p>
                </div>
                {idx === activeIndex && (
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 触发按钮 - 小药丸 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur-sm transition-all hover:shadow-lg active:scale-95 ${
          current.key === "local"
            ? "border-amber-200 bg-amber-50/90 text-amber-700 hover:bg-amber-100"
            : "border-emerald-200 bg-emerald-50/90 text-emerald-700 hover:bg-emerald-100"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            current.key === "local" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
          }`}
        />
        {current.label}
      </button>
    </div>
  )
}
