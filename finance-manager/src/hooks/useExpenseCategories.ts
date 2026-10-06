import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  api,
  apiBaseUrl,
  getApiErrorMessage,
  unwrapResponseData,
} from "../lib/api"
import { useApiEndpoint } from "./useApiEndpoint"
import type { ApiResponse, ExpenseCategory } from "../types"

export function useExpenseCategories(enabled: boolean) {
  const endpoint = useApiEndpoint()
  const client = useQueryClient()
  const config = { baseURL: apiBaseUrl(endpoint) }
  const query = useQuery({
    queryKey: ["expenseCategories", endpoint],
    enabled,
    queryFn: () =>
      unwrapResponseData(
        api.get<ApiResponse<ExpenseCategory[]>>("/expense_categories/", {
          ...config,
          params: { include_archived: true },
        }),
      ),
  })
  const onSuccess = async () => {
    await Promise.all(
      ["expenseCategories", "transactions", "summary"].map((key) =>
        client.invalidateQueries({ queryKey: [key, endpoint] }),
      ),
    )
    toast.success("分类已保存")
  }
  const onError = (error: unknown) =>
    toast.error(getApiErrorMessage(error, "分类保存失败"))
  const create = useMutation({
    mutationFn: (payload: { name: string; kind: ExpenseCategory["kind"] }) =>
      unwrapResponseData(api.post("/expense_categories/", payload, config)),
    onSuccess,
    onError,
  })
  const update = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: number
      name?: string
      archived?: boolean
    }) =>
      unwrapResponseData(api.put(`/expense_categories/${id}`, payload, config)),
    onSuccess,
    onError,
  })
  return { query, categories: query.data ?? [], create, update }
}
