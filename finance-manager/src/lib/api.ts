import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios"

import type { ApiResponse } from "../types"

// API 环境配置
export const API_ENDPOINTS = [
  { key: "remote", label: "☁️ 线上", url: "https://fastapi-0tu0.onrender.com" },
  { key: "local", label: "💻 本地", url: "http://localhost:8000" },
] as const

export type ApiEndpointKey = (typeof API_ENDPOINTS)[number]["key"]

const STORAGE_KEY = "finance_api_endpoint"

// 从 localStorage 恢复选择，默认远程
function loadSavedEndpoint(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const idx = API_ENDPOINTS.findIndex((e) => e.key === saved)
      if (idx !== -1) return idx
    }
  } catch {
    // Ignore storage access errors and fall back to the default endpoint.
  }
  return 0
}

let currentApiIndex = loadSavedEndpoint()

// 订阅者列表，用于通知 UI 更新
type Listener = (index: number) => void
const listeners = new Set<Listener>()

export function subscribeApiChange(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function notifyListeners() {
  listeners.forEach((fn) => fn(currentApiIndex))
}

// 获取 / 设置当前 API
export function getCurrentApiIndex(): number {
  return currentApiIndex
}

export function setApiEndpoint(index: number) {
  if (!API_ENDPOINTS[index]) return
  currentApiIndex = index
  try {
    localStorage.setItem(STORAGE_KEY, API_ENDPOINTS[index].key)
  } catch {
    /* The current session still works without storage. */
  }
  notifyListeners()
}

function getCurrentBaseURL(): string {
  return API_ENDPOINTS[currentApiIndex].url
}

export function apiBaseUrl(key: ApiEndpointKey) {
  return API_ENDPOINTS.find((endpoint) => endpoint.key === key)!.url
}

export const api = axios.create({
  timeout: 10000,
})

type ApiRequest<T> = Promise<AxiosResponse<ApiResponse<T>>>
type ApiErrorPayload = Partial<ApiResponse<unknown>> & { detail?: string }

export async function unwrapResponseData<T>(request: ApiRequest<T>): Promise<T> {
  const response = await request
  if (response.data.code >= 400) throw new Error(response.data.message || "请求失败")
  return response.data.data
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return error instanceof Error && error.message ? error.message : fallback
  }

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")
    return "请求超时，请刷新核对记录后再重试"
  if (error.code === "ERR_NETWORK") return "连接中断，请检查网络并刷新核对记录"
  const data = error.response?.data
  if (typeof data?.message === "string" && data.message) {
    return data.message
  }
  if (typeof data?.detail === "string" && data.detail) {
    return data.detail
  }
  if (typeof error.message === "string" && error.message) {
    return error.message
  }
  return fallback
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL ??= getCurrentBaseURL()
  return config
})

// A failed or timed-out financial operation must remain on the same ledger.
// Reads may be retried by React Query; writes are never replayed to another API.
