import { useApiEndpoint } from "./useApiEndpoint"
import { useQuery } from "@tanstack/react-query"
import { api, apiBaseUrl, type ApiEndpointKey, unwrapResponseData } from "../lib/api"
import type { ApiResponse, SummaryData } from "../types"

async function fetchSummary(endpoint: ApiEndpointKey, month?: string): Promise<SummaryData> {
  return unwrapResponseData(
    api.get<ApiResponse<SummaryData>>("/summary", {
      baseURL: apiBaseUrl(endpoint),
      params: month ? { month } : undefined,
    }),
  )
}

export function useSummary(month?: string) {
  const endpoint = useApiEndpoint()
  const query = useQuery({
    queryKey: ["summary", endpoint, month ?? "all"],
    queryFn: () => fetchSummary(endpoint, month),
  })

  const data = query.data
  const availableBalance = data?.operational_status.cash_waiting_allocation ?? 0
  const businessLoop = data?.financial_status.business_loop
  const familyLoop = data?.financial_status.family_loop
  const businessDebt = (month ? businessLoop?.period_outstanding ?? businessLoop?.current_debt : businessLoop?.current_debt) ?? 0
  const personalSpending = familyLoop?.personal_spending ?? 0
  const netSavings = familyLoop?.net_savings ?? 0
  const totalAssets = data?.financial_status.total_assets ?? 0
  const billsPending = data?.operational_status.bills_pending_settlement ?? 0
  const actionNeeded = data?.operational_status.action_needed ?? "正在计算"

  return {
    query,
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    hasData: Boolean(data),
    availableBalance,
    businessLoop,
    familyLoop,
    businessDebt,
    personalSpending,
    netSavings,
    totalAssets,
    billsPending,
    actionNeeded,
    chartData: data?.chart_data ?? null,
  }
}
