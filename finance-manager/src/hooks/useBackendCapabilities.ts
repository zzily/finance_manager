import axios from "axios"
import { useQuery } from "@tanstack/react-query"
import { api, apiBaseUrl, unwrapResponseData } from "../lib/api"
import { useApiEndpoint } from "./useApiEndpoint"
import type { ApiResponse } from "../types"

export type BackendCapabilities = {
  transactionOccurrenceDate: boolean
  expenseCategories: boolean
  immediatePayment: boolean
  backups: boolean
  restore: boolean
}
const legacy: BackendCapabilities = {
  transactionOccurrenceDate: false,
  expenseCategories: false,
  immediatePayment: false,
  backups: false,
  restore: false,
}
export function useBackendCapabilities() {
  const endpoint = useApiEndpoint()
  const query = useQuery({
    queryKey: ["capabilities", endpoint],
    retry: false,
    queryFn: async () => {
      try {
        const value = await unwrapResponseData(
          api.get<ApiResponse<BackendCapabilities>>("/ledger/capabilities", {
            baseURL: apiBaseUrl(endpoint),
          }),
        )
        return value?.transactionOccurrenceDate === true ? value : legacy
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 404) return legacy
        throw e
      }
    },
  })
  return { ...query, capabilities: query.data ?? legacy }
}
