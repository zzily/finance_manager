import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "../lib/api"
import type { ApiResponse, Transaction, TransactionCreate, TransactionUpdate } from "../types"

async function fetchTransactions() {
  return (await api.get<Transaction[]>("/transactions/")).data
}

async function createTransactionApi(p: TransactionCreate) {
  return (await api.post<ApiResponse<{ id: number }>>("/transactions/", p)).data
}

async function updateTransactionApi(id: number, p: TransactionUpdate) {
  return (await api.put<ApiResponse>(`/transactions/${id}`, p)).data
}

async function deleteTransactionApi(id: number) {
  return (await api.delete<ApiResponse>(`/transactions/${id}`)).data
}

export function useTransactions() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  })

  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["salary_logs"] }),
      queryClient.invalidateQueries({ queryKey: ["summary"] }),
    ])

  const createMutation = useMutation({
    mutationFn: createTransactionApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("垫付已记录", { description: "新账单已添加到列表" })
    },
    onError: () => toast.error("新增垫付失败，请稍后重试"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TransactionUpdate }) =>
      updateTransactionApi(id, payload),
    onSuccess: async () => {
      await invalidateAll()
      toast.success("修改已保存", { description: "账单信息已更新" })
    },
    onError: () => toast.error("修改失败，请稍后重试"),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTransactionApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("账单已删除")
    },
    onError: () => toast.error("删除失败，请稍后重试"),
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
    update: updateMutation,
    remove: deleteMutation,
  }
}
