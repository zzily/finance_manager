import { useQuery } from "@tanstack/react-query"
import { api } from "../lib/api"
import type { ApiResponse, SummaryData } from "../types"

async function fetchSummary(): Promise<SummaryData> {
  const res = await api.get<ApiResponse<SummaryData>>("/summary")
  return res.data.data
}

export function useSummary() {
  const query = useQuery({
    queryKey: ["summary"],
    queryFn: fetchSummary,
  })

  const data = query.data
  const availableBalance = data?.operational_status.cash_waiting_allocation ?? 0
  const businessLoop = data?.financial_status.business_loop
  const familyLoop = data?.financial_status.family_loop
  const businessDebt = businessLoop?.current_debt ?? 0
  const personalSpending = familyLoop?.personal_spending ?? 0
  const netSavings = familyLoop?.net_savings ?? 0
  const totalAssets = data?.financial_status.total_assets ?? 0
  const billsPending = data?.operational_status.bills_pending_settlement ?? 0
  const actionNeeded = data?.operational_status.action_needed ?? "正在计算"

  return {
    query,
    data,
    isLoading: query.isLoading,
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
