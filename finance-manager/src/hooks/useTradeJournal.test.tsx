import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "../lib/api"
import type { TradeRecord, TradeRecordInput } from "../types"
import { createQueryClientWrapper } from "../test/queryClient"
import { useTradeJournal } from "./useTradeJournal"

const tradePayload: TradeRecord[] = [
  {
    id: 1,
    symbol: "BTCUSDT",
    market: "crypto",
    side: "long",
    traded_at: "2026-03-31",
    pnl: 320.5,
    setup: "趋势突破",
    note: "顺势加仓",
    entry_at: "2026-03-31T09:30:00",
    exit_at: "2026-03-31T11:00:00",
    entry_price: 88000,
    exit_price: 88320,
    position_size: 1,
    thesis: "突破后延续",
    planned_stop: 87800,
    planned_target: 88500,
    actual_stop: null,
    actual_target: 88320,
    fees: 12,
    slippage: 3,
    followed_plan: true,
    plan_clarity: "clear",
    execution_quality: "disciplined",
    mistake_tags: [],
    lesson: "只在确认放量后加仓",
    option_expiration: null,
    option_strike: null,
    option_right: null,
    option_structure: null,
    option_premium_type: null,
    option_max_risk: null,
    option_max_reward: null,
    option_delta: null,
    created_at: "2026-03-31T09:00:00Z",
  },
]

const tradeInput: TradeRecordInput = {
  symbol: "BTCUSDT",
  market: "crypto",
  side: "long",
  traded_at: "2026-03-31",
  pnl: 320.5,
  setup: "趋势突破",
  note: "顺势加仓",
  entry_at: "2026-03-31T09:30",
  exit_at: "2026-03-31T11:00",
  entry_price: 88000,
  exit_price: 88320,
  position_size: 1,
  thesis: "突破后延续",
  planned_stop: 87800,
  planned_target: 88500,
  actual_stop: null,
  actual_target: 88320,
  fees: 12,
  slippage: 3,
  followed_plan: true,
  plan_clarity: "clear",
  execution_quality: "disciplined",
  mistake_tags: [],
  lesson: "只在确认放量后加仓",
  option_expiration: null,
  option_strike: null,
  option_right: null,
  option_structure: null,
  option_premium_type: null,
  option_max_risk: null,
  option_max_reward: null,
  option_delta: null,
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("useTradeJournal", () => {
  it("unwraps trade records from the common API envelope", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValue({
      data: {
        code: 200,
        message: "ok",
        data: tradePayload,
      },
    } as never)

    const { result } = renderHook(() => useTradeJournal(), {
      wrapper: createQueryClientWrapper(),
    })

    await waitFor(() => {
      expect(result.current.records).toHaveLength(1)
    })

    expect(getSpy).toHaveBeenCalledWith("/trade_records/")
    expect(result.current.records).toEqual(tradePayload)
  })

  it("calls backend CRUD endpoints with the full trade payload", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        code: 200,
        message: "ok",
        data: tradePayload,
      },
    } as never)
    const postSpy = vi.spyOn(api, "post").mockResolvedValue({
      data: { code: 200, message: "ok", data: { id: 2 } },
    } as never)
    const putSpy = vi.spyOn(api, "put").mockResolvedValue({
      data: {
        code: 200,
        message: "ok",
        data: {
          ...tradePayload[0],
          symbol: "ETHUSDT",
        },
      },
    } as never)
    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValue({
      data: { code: 200, message: "ok", data: { id: 1 } },
    } as never)

    const { result } = renderHook(() => useTradeJournal(), {
      wrapper: createQueryClientWrapper(),
    })

    await waitFor(() => {
      expect(result.current.records).toHaveLength(1)
    })

    await act(async () => {
      await result.current.create.mutateAsync(tradeInput)
      await result.current.update.mutateAsync({
        id: 1,
        payload: { ...tradeInput, symbol: "ETHUSDT" },
      })
      await result.current.remove.mutateAsync(1)
    })

    expect(postSpy).toHaveBeenCalledWith("/trade_records/", tradeInput)
    expect(putSpy).toHaveBeenCalledWith("/trade_records/1", {
      ...tradeInput,
      symbol: "ETHUSDT",
    })
    expect(deleteSpy).toHaveBeenCalledWith("/trade_records/1")
  })
})
