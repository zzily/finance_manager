import axios, { type InternalAxiosRequestConfig } from "axios"

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
  } catch {}
  return 0
}

let currentApiIndex = loadSavedEndpoint()

// 订阅者列表，用于通知 UI 更新
type Listener = (index: number) => void
const listeners = new Set<Listener>()

export function subscribeApiChange(fn: Listener) {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

function notifyListeners() {
  listeners.forEach((fn) => fn(currentApiIndex))
}

// 获取 / 设置当前 API
export function getCurrentApiIndex(): number {
  return currentApiIndex
}

export function setApiEndpoint(index: number) {
  currentApiIndex = index
  localStorage.setItem(STORAGE_KEY, API_ENDPOINTS[index].key)
  notifyListeners()
}

function getCurrentBaseURL(): string {
  return API_ENDPOINTS[currentApiIndex].url
}

// 自动故障切换
function switchToNextAPI(): boolean {
  if (currentApiIndex < API_ENDPOINTS.length - 1) {
    currentApiIndex++
    localStorage.setItem(STORAGE_KEY, API_ENDPOINTS[currentApiIndex].key)
    console.warn(`⚠️ API 自动切换到: ${API_ENDPOINTS[currentApiIndex].label}`)
    notifyListeners()
    return true
  }
  return false
}

export const api = axios.create({
  timeout: 10000,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getCurrentBaseURL()
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    if (!config._retryApiIndex) {
      config._retryApiIndex = currentApiIndex
    }

    const isNetworkError = !error.response
    const isServerError = error.response?.status >= 500
    const isTimeout = error.code === "ECONNABORTED"

    if ((isNetworkError || isServerError || isTimeout) && switchToNextAPI()) {
      console.warn(`🔄 正在重试请求: ${config.url}`)
      config.baseURL = getCurrentBaseURL()
      return api.request(config)
    }

    currentApiIndex = 0
    localStorage.setItem(STORAGE_KEY, API_ENDPOINTS[0].key)
    notifyListeners()
    return Promise.reject(error)
  }
)
