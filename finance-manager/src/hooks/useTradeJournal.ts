import { useEffect, useMemo, useState } from "react"

import type { TradeRecord, TradeRecordInput } from "../types"

const STORAGE_KEY = "finance-cockpit-trade-records:v1"

function sortTradeRecords(records: TradeRecord[]) {
  return [...records].sort((left, right) => {
    const dateCompare = right.traded_at.localeCompare(left.traded_at)

    if (dateCompare !== 0) {
      return dateCompare
    }

    return right.id.localeCompare(left.id)
  })
}

function loadTradeRecords() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return sortTradeRecords(
      parsed.filter((item): item is TradeRecord => {
        return (
          typeof item?.id === "string" &&
          typeof item?.symbol === "string" &&
          typeof item?.market === "string" &&
          typeof item?.side === "string" &&
          typeof item?.traded_at === "string" &&
          typeof item?.pnl === "number"
        )
      }),
    )
  } catch {
    return []
  }
}

function buildTradeRecord(input: TradeRecordInput, id: string): TradeRecord {
  return {
    ...input,
    id,
    symbol: input.symbol.trim(),
    setup: input.setup?.trim(),
    note: input.note?.trim() ? input.note.trim() : null,
  }
}

function generateTradeId() {
  return `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function useTradeJournal() {
  const [records, setRecords] = useState<TradeRecord[]>(loadTradeRecords)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [records])

  const actions = useMemo(
    () => ({
      create(input: TradeRecordInput) {
        setRecords((previous) => sortTradeRecords([...previous, buildTradeRecord(input, generateTradeId())]))
      },
      update(id: string, input: TradeRecordInput) {
        setRecords((previous) =>
          sortTradeRecords(
            previous.map((record) => (record.id === id ? buildTradeRecord(input, id) : record)),
          ),
        )
      },
      remove(id: string) {
        setRecords((previous) => previous.filter((record) => record.id !== id))
      },
    }),
    [],
  )

  return {
    records,
    ...actions,
  }
}
