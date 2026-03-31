import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { api, getApiErrorMessage, unwrapResponseData } from "../lib/api"
import {
  mergeTradeRecordWithMeta,
  mergeTradeRecordsWithMeta,
  removeTradeRecordMeta,
  saveTradeRecordMeta,
  splitTradeRecordInput,
} from "../lib/tradeJournalStorage"
import type {
  ApiResponse,
  IdPayload,
  TradeRecordApi,
  TradeRecordApiPayload,
  TradeRecordInput,
} from "../types"

async function fetchTradeRecords() {
  const records = await unwrapResponseData(api.get<ApiResponse<TradeRecordApi[]>>("/trade_records/"))
  return mergeTradeRecordsWithMeta(records)
}

async function createTradeRecordApi(payload: TradeRecordApiPayload) {
  return unwrapResponseData(api.post<ApiResponse<IdPayload>>("/trade_records/", payload))
}

async function updateTradeRecordApi({
  id,
  payload,
}: {
  id: number
  payload: TradeRecordApiPayload
}) {
  return unwrapResponseData(api.put<ApiResponse<TradeRecordApi>>(`/trade_records/${id}`, payload))
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
    mutationFn: async (input: TradeRecordInput) => {
      const { apiPayload, meta } = splitTradeRecordInput(input)
      const created = await createTradeRecordApi(apiPayload)
      saveTradeRecordMeta(created.id, meta)
      return created
    },
    onSuccess: async () => {
      await invalidateAll()
      toast.success("交易记录已保存", { description: "统计数据已经刷新" })
    },
    onError: (error) => {
      toast.error("新增交易记录失败", { description: getApiErrorMessage(error, "请稍后重试") })
    },
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number
      payload: TradeRecordInput
    }) => {
      const { apiPayload, meta } = splitTradeRecordInput(payload)
      const updated = await updateTradeRecordApi({ id, payload: apiPayload })
      saveTradeRecordMeta(id, meta)
      return mergeTradeRecordWithMeta(updated, meta)
    },
    onSuccess: async () => {
      await invalidateAll()
      toast.success("交易记录已更新", { description: "最新统计已经同步" })
    },
    onError: (error) => {
      toast.error("更新交易记录失败", { description: getApiErrorMessage(error, "请稍后重试") })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const deleted = await deleteTradeRecordApi(id)
      removeTradeRecordMeta(id)
      return deleted
    },
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
