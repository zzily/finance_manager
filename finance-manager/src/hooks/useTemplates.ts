import { useEffect, useState } from "react"
import { loadTemplates, TEMPLATE_EVENT } from "../lib/templates"

export function useTemplates() {
  const [templates, setTemplates] = useState(loadTemplates)
  useEffect(() => {
    const refresh = () => setTemplates(loadTemplates())
    window.addEventListener(TEMPLATE_EVENT, refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener(TEMPLATE_EVENT, refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])
  return templates
}
