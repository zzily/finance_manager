import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { cn } from "../../lib/utils"

const MONTH_LABELS = [
  "1月", "2月", "3月", "4月",
  "5月", "6月", "7月", "8月",
  "9月", "10月", "11月", "12月",
]

/**
 * 自定义月份选择器
 * value / onChange 使用 "YYYY-MM" 格式
 */
export function MonthPicker({
  value,
  onChange,
  placeholder = "选择月份",
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-based

  // 解析已选中的值
  const [selectedYear, selectedMonth] = value
    ? [parseInt(value.split("-")[0]), parseInt(value.split("-")[1]) - 1]
    : [NaN, NaN]

  // 面板浏览年份
  const [viewYear, setViewYear] = useState(
    !isNaN(selectedYear) ? selectedYear : currentYear,
  )
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen])

  const handleSelect = useCallback(
    (month: number) => {
      const mm = String(month + 1).padStart(2, "0")
      onChange(`${viewYear}-${mm}`)
      setIsOpen(false)
    },
    [viewYear, onChange],
  )

  const handleThisMonth = useCallback(() => {
    setViewYear(currentYear)
    handleSelect(currentMonth)
  }, [currentYear, currentMonth, handleSelect])

  const handleClear = useCallback(() => {
    onChange("")
    setIsOpen(false)
  }, [onChange])

  // 格式化显示值
  const displayText = value
    ? `${selectedYear}年${selectedMonth + 1}月`
    : null

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          if (!isOpen && !isNaN(selectedYear)) setViewYear(selectedYear)
          setIsOpen(!isOpen)
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background transition-colors",
          "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          !displayText && "text-slate-400",
        )}
      >
        <span>{displayText ?? placeholder}</span>
        <Calendar size={15} className="text-slate-400" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-full min-w-[260px] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-lg animate-in fade-in-0 zoom-in-95">
          {/* Year nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-900">{viewYear}年</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month grid 4x3 */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_LABELS.map((label, i) => {
              const isSelected = viewYear === selectedYear && i === selectedMonth
              const isCurrent = viewYear === currentYear && i === currentMonth
              const isFuture = viewYear > currentYear || (viewYear === currentYear && i > currentMonth)
              return (
                <button
                  key={i}
                  type="button"
                  disabled={isFuture}
                  onClick={() => handleSelect(i)}
                  className={cn(
                    "rounded-lg py-2 text-sm font-medium transition-colors",
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm"
                      : isCurrent
                        ? "border border-slate-300 bg-slate-50 text-slate-900 hover:bg-slate-100"
                        : isFuture
                          ? "cursor-not-allowed text-slate-300"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Footer actions */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-slate-400 transition hover:text-slate-600"
            >
              清除
            </button>
            <button
              type="button"
              onClick={handleThisMonth}
              className="text-xs font-medium text-blue-600 transition hover:text-blue-700"
            >
              本月
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
