import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "../lib/api"
import type { ApiResponse, SalaryLog, SalaryLogCreate, SalaryLogUpdate, SettleRequest } from "../types"

async function fetchAvailable() {
  return (await api.get<SalaryLog[]>("/salary_logs/", { params: { available_only: true } })).data
}

async function fetchAll() {
  return (await api.get<SalaryLog[]>("/salary_logs/")).data
}

async function createSalaryLogApi(p: SalaryLogCreate) {
  return (await api.post<ApiResponse<{ id: number }>>("/salary_logs/", p)).data
}

async function updateSalaryLogApi({ id, payload }: { id: number; payload: SalaryLogUpdate }) {
  return (await api.put<SalaryLog>(`/salary_logs/${id}`, payload)).data
}

async function deleteSalaryLogApi(id: number) {
  return (await api.delete<ApiResponse>(`/salary_logs/${id}`)).data
}

async function settleDebtApi(p: SettleRequest) {
  return (await api.post<ApiResponse>("/settle", p)).data
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
    onError: () => toast.error("新增回款失败，请稍后重试"),
  })

  const updateMutation = useMutation({
    mutationFn: updateSalaryLogApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("回款已更新", { description: "资金池已同步" })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? "更新失败，请稍后重试"
      toast.error("更新失败", { description: msg })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSalaryLogApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("回款记录已删除")
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? "删除失败，请稍后重试"
      toast.error("删除失败", { description: msg })
    },
  })

  const settleMutation = useMutation({
    mutationFn: settleDebtApi,
    onSuccess: async () => {
      await invalidateAll()
      toast.success("核销成功", { description: "账单已更新" })
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
