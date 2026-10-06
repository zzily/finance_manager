import { useSyncExternalStore } from "react"
import { API_ENDPOINTS, getCurrentApiIndex, subscribeApiChange } from "../lib/api"

export function useApiEndpoint() {
  const index = useSyncExternalStore(subscribeApiChange, getCurrentApiIndex, getCurrentApiIndex)
  return API_ENDPOINTS[index].key
}
