import { api, apiBaseUrl, type ApiEndpointKey, unwrapResponseData } from "./api"
import type { ApiResponse } from "../types"

export async function fetchAllPages<T extends { id: number }>(
  path: string,
  endpoint: ApiEndpointKey,
  params: Record<string, unknown> = {},
) {
  const records: T[] = [],
    ids = new Set<number>()
  for (let skip = 0; ; skip += 100) {
    const page = await unwrapResponseData(
      api.get<ApiResponse<T[]>>(path, {
        baseURL: apiBaseUrl(endpoint),
        params: { ...params, skip, limit: 100 },
      }),
    )
    if (!Array.isArray(page)) throw new Error("列表数据格式不正确")
    const unseen = page.filter((row) => !ids.has(row.id))
    unseen.forEach((row) => {
      ids.add(row.id)
      records.push(row)
    })
    if (page.length < 100) return records
    if (!unseen.length) throw new Error("分页读取未完成，请刷新重试")
  }
}
