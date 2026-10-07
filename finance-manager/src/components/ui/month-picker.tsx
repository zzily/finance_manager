import { useState, useRef, useEffect, type ComponentProps } from "react"
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

const MONTHS = [
  ["1月", "2月", "3月"],
  ["4月", "5月", "6月"],
  ["7月", "8月", "9月"],
  ["10月", "11月", "12月"],
]

/** YYYY-MM month selection, with Radix positioning and focus management. */
export function MonthPicker({
  value,
  onChange,
  placeholder = "选择月份",
  className,
  ...triggerProps
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
} & Omit<ComponentProps<typeof Button>, "value" | "onChange" | "children">) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const [selectedYear, selectedMonth] = value
    ? [Number(value.split("-")[0]), Number(value.split("-")[1]) - 1]
    : [NaN, NaN]
  const [viewYear, setViewYear] = useState(
    Number.isNaN(selectedYear) ? currentYear : selectedYear,
  )
  const [isOpen, setIsOpen] = useState(false)
  const [isYearEditing, setIsYearEditing] = useState(false)
  const [yearInput, setYearInput] = useState("")
  const yearInputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isYearEditing) yearInputRef.current?.focus()
  }, [isYearEditing])

  function close() {
    setIsOpen(false)
    setIsYearEditing(false)
  }
  function commitYearEdit() {
    const year = Number(yearInput)
    if (Number.isInteger(year) && year >= 2000 && year <= currentYear)
      setViewYear(year)
    setIsYearEditing(false)
  }
  function selectMonth(month: number) {
    onChange(`${viewYear}-${String(month + 1).padStart(2, "0")}`)
    close()
  }
  const displayText = value
    ? `${selectedYear}年${selectedMonth + 1}月`
    : placeholder

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        if (open)
          setViewYear(Number.isNaN(selectedYear) ? currentYear : selectedYear)
        else setIsYearEditing(false)
        setIsOpen(open)
      }}
    >
      <div className={cn("flex items-center gap-1", className)}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            type="button"
            variant="outline"
            className="w-full justify-start font-normal"
            {...triggerProps}
          >
            <Calendar data-icon="inline-start" aria-hidden="true" />
            <span
              className={cn(
                "flex-1 text-left",
                !value && "text-muted-foreground",
              )}
            >
              {displayText}
            </span>
          </Button>
        </PopoverTrigger>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="清除月份"
            disabled={triggerProps.disabled}
            onClick={() => {
              onChange("")
              triggerRef.current?.focus()
            }}
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
      <PopoverContent
        align="start"
        className="w-72 p-3"
        aria-label={placeholder}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="上一年"
            disabled={viewYear <= 2000}
            onClick={() => setViewYear((y) => y - 1)}
          >
            <ChevronLeft />
          </Button>
          {isYearEditing ? (
            <Input
              ref={yearInputRef}
              aria-label="年份"
              type="number"
              min={2000}
              max={currentYear}
              className="w-24 text-center"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onBlur={commitYearEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  commitYearEdit()
                }
              }}
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setYearInput(String(viewYear))
                setIsYearEditing(true)
              }}
              title="点击快速跳转年份"
            >
              {viewYear}年
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="下一年"
            disabled={viewYear >= currentYear}
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="flex flex-col gap-1" role="group" aria-label="月份">
          {MONTHS.map((quarter, qi) => (
            <div key={qi} className="flex items-center gap-1.5">
              <span className="w-7 shrink-0 text-center text-xs text-muted-foreground">
                Q{qi + 1}
              </span>
              <div className="grid flex-1 grid-cols-3 gap-1">
                {quarter.map((label, mi) => {
                  const month = qi * 3 + mi
                  const selected =
                    viewYear === selectedYear && month === selectedMonth
                  const current =
                    viewYear === currentYear && month === currentMonth
                  return (
                    <Button
                      key={month}
                      type="button"
                      size="sm"
                      variant={
                        selected ? "default" : current ? "secondary" : "ghost"
                      }
                      aria-pressed={selected}
                      aria-current={current ? "date" : undefined}
                      disabled={
                        viewYear > currentYear ||
                        (viewYear === currentYear && month > currentMonth)
                      }
                      onClick={() => selectMonth(month)}
                    >
                      {label}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-2.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange("")
              close()
            }}
          >
            清除
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              onChange(
                `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`,
              )
              close()
            }}
          >
            本月
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
