import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api, getApiErrorMessage, unwrapResponseData } from "../lib/api"
import type {
  ApiResponse,
  IdPayload,
  SalaryLog,
  SalaryLogCreate,
  SalaryLogUpdate,
  SettleRequest,
} from "../types"

async function fetchAvailable() {
  return unwrapResponseData(
    api.get<ApiResponse<SalaryLog[]>>("/salary_logs/", { params: { available_only: true } }),
  )
}

async function fetchAll() {
  return unwrapResponseData(api.get<ApiResponse<SalaryLog[]>>("/salary_logs/"))
}

async function createSalaryLogApi(p: SalaryLogCreate) {
  return unwrapResponseData(api.post<ApiResponse<IdPayload>>("/salary_logs/", p))
}

async function updateSalaryLogApi({ id, payload }: { id: number; payload: SalaryLogUpdate }) {
  return unwrapResponseData(api.put<ApiResponse<SalaryLog>>(`/salary_logs/${id}`, payload))
}

async function deleteSalaryLogApi(id: number) {
  return unwrapResponseData(api.delete<ApiResponse<IdPayload>>(`/salary_logs/${id}`))
}

async function settleDebtApi(p: SettleRequest) {
  return unwrapResponseData(api.post<ApiResponse>("/settle", p))
}

export function useSalaryLogs() {
  const queryClient = useQueryClient()

  const availableQuery = useQuery({
    queryKey: ["salary_logs", "available"],
    queryFn: fetchAvailable,
  })

  const allQuery = useQuery({
    queryKey: ["salary_logs", "all"],
    queryFn: fetchAll,
  })

  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["salary_logs"] }),
      queryClient.invalidateQueries({ queryKey: ["summary"] }),
    ])

  const createMutation = useMutation({
    mutationFn: createSalaryLogApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("回款已录入", { description: "资金池已更新" })
    },
    onError: (error) => {
      toast.error("新增回款失败", { description: getApiErrorMessage(error, "请稍后重试") })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateSalaryLogApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("回款已更新", { description: "资金池已同步" })
    },
    onError: (error) => {
      toast.error("更新失败", { description: getApiErrorMessage(error, "请稍后重试") })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSalaryLogApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("回款记录已删除")
    },
    onError: (error) => {
      toast.error("删除失败", { description: getApiErrorMessage(error, "请稍后重试") })
    },
  })

  const settleMutation = useMutation({
    mutationFn: settleDebtApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("核销成功", { description: "账单已更新" })
    },
    onError: (error) => {
      toast.error("核销失败", { description: getApiErrorMessage(error, "请稍后重试") })
    },
  })

  const available = useMemo(
    () => (availableQuery.data ?? []).filter((i) => i.amount_unused > 0),
    [availableQuery.data],
  )

  return {
    availableQuery,
    allQuery,
    available,
    allLogs: allQuery.data ?? [],
    create: createMutation,
    update: updateMutation,
    remove: deleteMutation,
    settle: settleMutation,
  }
}

export type SalaryLogsState = ReturnType<typeof useSalaryLogs>
