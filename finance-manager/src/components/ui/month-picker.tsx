import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react"
import { cn } from "../../lib/utils"

const MONTHS = [
  ["1月", "2月", "3月"],
  ["4月", "5月", "6月"],
  ["7月", "8月", "9月"],
  ["10月", "11月", "12月"],
]

const QUARTER_LABELS = ["Q1", "Q2", "Q3", "Q4"]

/**
 * Custom month picker with year quick-jump, quarterly grouping,
 * keyboard support, and smart positioning.
 * Uses "YYYY-MM" string format for value/onChange.
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
  const currentMonth = now.getMonth()

  const [selectedYear, selectedMonth] = value
    ? [parseInt(value.split("-")[0]), parseInt(value.split("-")[1]) - 1]
    : [NaN, NaN]

  const [viewYear, setViewYear] = useState(
    !isNaN(selectedYear) ? selectedYear : currentYear,
  )
  const [isOpen, setIsOpen] = useState(false)
  const [isYearEditing, setIsYearEditing] = useState(false)
  const [yearInput, setYearInput] = useState("")
  const [openUpward, setOpenUpward] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const yearInputRef = useRef<HTMLInputElement>(null)

  /* Detect whether to open upward or downward */
  const checkDirection = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    setOpenUpward(spaceBelow < 340)
  }, [])

  /* Open/close */
  const open = useCallback(() => {
    if (!isNaN(selectedYear)) setViewYear(selectedYear)
    checkDirection()
    setIsOpen(true)
  }, [selectedYear, checkDirection])

  const close = useCallback(() => {
    setIsOpen(false)
    setIsYearEditing(false)
  }, [])

  /* Click outside to close */
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen, close])

  /* Keyboard: Escape to close */
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, close])

  /* Auto-focus year input */
  useEffect(() => {
    if (isYearEditing) yearInputRef.current?.focus()
  }, [isYearEditing])

  const handleSelect = useCallback(
    (monthIdx: number) => {
      const mm = String(monthIdx + 1).padStart(2, "0")
      onChange(`${viewYear}-${mm}`)
      close()
    },
    [viewYear, onChange, close],
  )

  const handleThisMonth = useCallback(() => {
    setViewYear(currentYear)
    handleSelect(currentMonth)
  }, [currentYear, currentMonth, handleSelect])

  const handleClear = useCallback(() => {
    onChange("")
    close()
  }, [onChange, close])

  /* Year quick-jump */
  function startYearEdit() {
    setYearInput(String(viewYear))
    setIsYearEditing(true)
  }

  function commitYearEdit() {
    const y = parseInt(yearInput)
    if (!isNaN(y) && y >= 2000 && y <= 2099) setViewYear(y)
    setIsYearEditing(false)
  }

  const displayText = value ? `${selectedYear}年${selectedMonth + 1}月` : null

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* ─── Trigger ─── */}
      <button
        type="button"
        onClick={() => (isOpen ? close() : open())}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm transition-colors",
          "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
          isOpen && "border-slate-400 ring-2 ring-slate-400 ring-offset-2",
        )}
      >
        <Calendar size={14} className="shrink-0 text-slate-400" />
        <span className={cn("flex-1 text-left", displayText ? "text-slate-900" : "text-slate-400")}>
          {displayText ?? placeholder}
        </span>
        {displayText && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); handleClear() }}
            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {/* ─── Dropdown ─── */}
      {isOpen && (
        <div
          className={cn(
            "absolute left-0 z-[60] w-full min-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-xl",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            openUpward
              ? "bottom-full mb-1 slide-in-from-bottom-1"
              : "top-full mt-1 slide-in-from-top-1",
          )}
        >
          {/* Year navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>

            {isYearEditing ? (
              <input
                ref={yearInputRef}
                type="number"
                min={2000}
                max={2099}
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                onBlur={commitYearEdit}
                onKeyDown={(e) => { if (e.key === "Enter") commitYearEdit() }}
                className="w-20 rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-center text-sm font-semibold text-slate-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-400"
              />
            ) : (
              <button
                type="button"
                onClick={startYearEdit}
                className="rounded-md px-3 py-1 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                title="点击快速跳转年份"
              >
                {viewYear}年
              </button>
            )}

            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              disabled={viewYear >= currentYear}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition active:scale-95",
                viewYear >= currentYear
                  ? "cursor-not-allowed text-slate-200"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
              )}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month grid with quarterly grouping */}
          <div className="space-y-1">
            {MONTHS.map((quarter, qi) => (
              <div key={qi} className="flex items-center gap-1.5">
                <span className="w-7 shrink-0 text-center text-[10px] font-semibold tracking-wider text-slate-300">
                  {QUARTER_LABELS[qi]}
                </span>
                <div className="grid flex-1 grid-cols-3 gap-1">
                  {quarter.map((label, mi) => {
                    const monthIdx = qi * 3 + mi
                    const isSelected = viewYear === selectedYear && monthIdx === selectedMonth
                    const isCurrent = viewYear === currentYear && monthIdx === currentMonth
                    const isFuture = viewYear > currentYear || (viewYear === currentYear && monthIdx > currentMonth)
                    return (
                      <button
                        key={monthIdx}
                        type="button"
                        disabled={isFuture}
                        onClick={() => handleSelect(monthIdx)}
                        className={cn(
                          "relative rounded-lg py-2.5 text-sm font-medium transition-all duration-150",
                          isSelected
                            ? "bg-slate-900 text-white shadow-sm"
                            : isCurrent
                              ? "bg-blue-50 font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
                              : isFuture
                                ? "cursor-not-allowed text-slate-200"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.97]",
                        )}
                      >
                        {label}
                        {isCurrent && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            >
              清除
            </button>
            <button
              type="button"
              onClick={handleThisMonth}
              className="rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
            >
              本月
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
