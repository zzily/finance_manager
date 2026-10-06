import { Children, cloneElement, isValidElement, type ReactNode } from "react"

export function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export function moneyError(value: string | number) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return "请输入大于零的有效金额"
  if (Math.abs(number * 100 - Math.round(number * 100)) > 0.00001) return "金额最多保留两位小数"
  return null
}

// Keep labels attached when a field contains a Radix Select composition.
export function labelControl(children: ReactNode, id: string, label: string): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return child
    const type = child.type as unknown as { displayName?: string }
    const isControl =
      ["input", "textarea", "select"].includes(String(child.type)) ||
      ["Input", "SelectTrigger"].includes(type.displayName ?? "")
    return cloneElement(child, {
      ...(isControl ? { id, "aria-label": label } : {}),
      ...(child.props.children
        ? {
            children: labelControl(child.props.children as ReactNode, id, label),
          }
        : {}),
    })
  })
}

export function dateInputValue(value?: string | null) {
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
