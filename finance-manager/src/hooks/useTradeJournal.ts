import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { api, getApiErrorMessage, unwrapResponseData } from "../lib/api"
import type { ApiResponse, IdPayload, TradeRecord, TradeRecordInput } from "../types"

async function fetchTradeRecords() {
  return unwrapResponseData(api.get<ApiResponse<TradeRecord[]>>("/trade_records/"))
}

async function createTradeRecordApi(payload: TradeRecordInput) {
  return unwrapResponseData(api.post<ApiResponse<IdPayload>>("/trade_records/", payload))
}

async function updateTradeRecordApi({
  id,
  payload,
}: {
  id: number
  payload: TradeRecordInput
}) {
  return unwrapResponseData(api.put<ApiResponse<TradeRecord>>(`/trade_records/${id}`, payload))
}

async function deleteTradeRecordApi(id: number) {
  return unwrapResponseData(api.delete<ApiResponse<IdPayload>>(`/trade_records/${id}`))
}

export function useTradeJournal() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["trade_records"],
    queryFn: fetchTradeRecords,
  })

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: ["trade_records"] })

  const create = useMutation({
    mutationFn: createTradeRecordApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("交易记录已保存", { description: "统计数据已经刷新" })
    },
    onError: (error) => {
      toast.error("新增交易记录失败", { description: getApiErrorMessage(error, "请稍后重试") })
    },
  })

  const update = useMutation({
    mutationFn: updateTradeRecordApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("交易记录已更新", { description: "最新统计已经同步" })
    },
    onError: (error) => {
      toast.error("更新交易记录失败", { description: getApiErrorMessage(error, "请稍后重试") })
    },
  })

  const remove = useMutation({
    mutationFn: deleteTradeRecordApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("交易记录已删除")
    },
    onError: (error) => {
      toast.error("删除交易记录失败", { description: getApiErrorMessage(error, "请稍后重试") })
    },
  })

  return {
    query,
    records: query.data ?? [],
    create,
    update,
    remove,
  }
}
