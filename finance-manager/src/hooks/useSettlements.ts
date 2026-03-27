import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, getApiErrorMessage, unwrapResponseData } from "../lib/api"
import type { ApiResponse, SettlementDetail } from "../types"

async function fetchSettlements(transactionId: number): Promise<SettlementDetail[]> {
  return unwrapResponseData(
    api.get<ApiResponse<SettlementDetail[]>>(`/transactions/${transactionId}/settlements`),
  )
}

async function undoSettlementApi(settlementId: number) {
  return unwrapResponseData(api.delete<ApiResponse>(`/settlements/${settlementId}`))
}

export function useSettlements(transactionId: number | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["settlements", transactionId],
    queryFn: () => fetchSettlements(transactionId!),
    enabled: transactionId !== null,
  })

  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["salary_logs"] }),
      queryClient.invalidateQueries({ queryKey: ["summary"] }),
      queryClient.invalidateQueries({ queryKey: ["settlements", transactionId] }),
    ])

  const undoMutation = useMutation({
    mutationFn: undoSettlementApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("撤销成功", { description: "资金已退回资金池" })
    },
    onError: (error) => {
      toast.error("撤销失败", { description: getApiErrorMessage(error, "请稍后重试") })
    },
  })

  return {
    query,
    records: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    undo: undoMutation,
  }
}
