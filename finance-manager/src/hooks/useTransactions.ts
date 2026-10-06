import { fetchAllPages } from "../lib/pagination"
import { markTemplateRecorded } from "../lib/templates"
import { useApiEndpoint } from "./useApiEndpoint"
import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  api,
  type ApiEndpointKey,
  getApiErrorMessage,
  unwrapResponseData,
} from "../lib/api"
import type {
  ApiResponse,
  IdPayload,
  Transaction,
  TransactionCreate,
  TransactionUpdate,
} from "../types"

async function fetchTransactions(endpoint: ApiEndpointKey) {
  return fetchAllPages<Transaction>("/transactions/",endpoint)
}

async function createTransactionApi(p: TransactionCreate) {
  return unwrapResponseData(api.post<ApiResponse<IdPayload>>("/transactions/", p))
}

async function updateTransactionApi(id: number, p: TransactionUpdate) {
  return unwrapResponseData(api.put<ApiResponse<Transaction>>(`/transactions/${id}`, p))
}

async function deleteTransactionApi(id: number) {
  return unwrapResponseData(api.delete<ApiResponse<IdPayload>>(`/transactions/${id}`))
}

export function useTransactions() {
  const endpoint = useApiEndpoint()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["transactions", endpoint],
    queryFn: () => fetchTransactions(endpoint),
  })

  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["salary_logs"] }),
      queryClient.invalidateQueries({ queryKey: ["summary"] }),
    ])

  const createMutation = useMutation({
    mutationFn: createTransactionApi,
    onSuccess: async (_, payload) => {
      markTemplateRecorded(payload)
      await invalidateAll()
      toast.success("账单已记录", { description: "新账单已添加到列表" })
    },
    onError: (error) => {
      toast.error("新增账单失败", {
        description: getApiErrorMessage(error, "请稍后重试"),
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TransactionUpdate }) =>
      updateTransactionApi(id, payload),
    onSuccess: async () => {
      await invalidateAll()
      toast.success("修改已保存", { description: "账单信息已更新" })
    },
    onError: (error) => {
      toast.error("修改失败", {
        description: getApiErrorMessage(error, "请稍后重试"),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTransactionApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("账单已删除")
    },
    onError: (error) => {
      toast.error("删除失败", {
        description: getApiErrorMessage(error, "请稍后重试"),
      })
    },
  })

  const unsettled = useMemo(
    () => (query.data ?? []).filter((i) => i.status !== "settled"),
    [query.data],
  )

  return {
    query,
    all: query.data ?? [],
    unsettled,
    create: createMutation,
    getDeleteErrorMessage: (error: unknown) => getApiErrorMessage(error, "删除失败，请稍后重试"),
    update: updateMutation,
    remove: deleteMutation,
  }
}

export type TransactionsState = ReturnType<typeof useTransactions>
