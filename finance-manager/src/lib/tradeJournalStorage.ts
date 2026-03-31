import type {
  TradeRecord,
  TradeRecordApi,
  TradeRecordApiPayload,
  TradeRecordInput,
  TradeRecordMeta,
  TradeMistakeType,
} from "../types"

export const TRADE_RECORD_META_STORAGE_KEY = "finance_trade_record_meta_v1"

type TradeRecordMetaStore = Record<string, TradeRecordMeta>

const EMPTY_META: TradeRecordMeta = {
  mistake_tags: [],
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function trimToNull(value?: string | null) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeNumber(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null
  }

  return value
}

function normalizeMistakeTags(value: unknown): TradeMistakeType[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is TradeMistakeType => typeof item === "string")
}

export function loadTradeRecordMetaStore(): TradeRecordMetaStore {
  if (!canUseStorage()) {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(TRADE_RECORD_META_STORAGE_KEY)
    if (!rawValue) {
      return {}
    }

    const parsed = JSON.parse(rawValue) as TradeRecordMetaStore
    return typeof parsed === "object" && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function persistTradeRecordMetaStore(store: TradeRecordMetaStore) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(TRADE_RECORD_META_STORAGE_KEY, JSON.stringify(store))
}

export function sanitizeTradeRecordMeta(meta: Partial<TradeRecordMeta>): TradeRecordMeta {
  return {
    entry_at: trimToNull(meta.entry_at),
    exit_at: trimToNull(meta.exit_at),
    entry_price: normalizeNumber(meta.entry_price),
    exit_price: normalizeNumber(meta.exit_price),
    position_size: normalizeNumber(meta.position_size),
    thesis: trimToNull(meta.thesis),
    planned_stop: normalizeNumber(meta.planned_stop),
    planned_target: normalizeNumber(meta.planned_target),
    actual_stop: normalizeNumber(meta.actual_stop),
    actual_target: normalizeNumber(meta.actual_target),
    fees: normalizeNumber(meta.fees),
    slippage: normalizeNumber(meta.slippage),
    followed_plan: typeof meta.followed_plan === "boolean" ? meta.followed_plan : null,
    plan_clarity: meta.plan_clarity ?? null,
    execution_quality: meta.execution_quality ?? null,
    mistake_tags: normalizeMistakeTags(meta.mistake_tags),
    lesson: trimToNull(meta.lesson),
    option_expiration: trimToNull(meta.option_expiration),
    option_strike: normalizeNumber(meta.option_strike),
    option_right: meta.option_right ?? null,
    option_structure: meta.option_structure ?? null,
    option_premium_type: meta.option_premium_type ?? null,
    option_max_risk: normalizeNumber(meta.option_max_risk),
    option_max_reward: normalizeNumber(meta.option_max_reward),
    option_delta: normalizeNumber(meta.option_delta),
  }
}

export function mergeTradeRecordWithMeta(
  record: TradeRecordApi,
  meta?: Partial<TradeRecordMeta> | null,
): TradeRecord {
  return {
    ...record,
    ...EMPTY_META,
    ...sanitizeTradeRecordMeta(meta ?? {}),
  }
}

export function mergeTradeRecordsWithMeta(records: TradeRecordApi[]): TradeRecord[] {
  const metaStore = loadTradeRecordMetaStore()
  return records.map((record) => mergeTradeRecordWithMeta(record, metaStore[String(record.id)]))
}

export function saveTradeRecordMeta(id: number, meta: Partial<TradeRecordMeta>) {
  const store = loadTradeRecordMetaStore()
  store[String(id)] = sanitizeTradeRecordMeta(meta)
  persistTradeRecordMetaStore(store)
}

export function removeTradeRecordMeta(id: number) {
  const store = loadTradeRecordMetaStore()
  delete store[String(id)]
  persistTradeRecordMetaStore(store)
}

export function splitTradeRecordInput(input: TradeRecordInput): {
  apiPayload: TradeRecordApiPayload
  meta: TradeRecordMeta
} {
  const {
    actual_stop,
    actual_target,
    entry_at,
    entry_price,
    execution_quality,
    exit_at,
    exit_price,
    fees,
    followed_plan,
    lesson,
    mistake_tags,
    option_delta,
    option_expiration,
    option_max_reward,
    option_max_risk,
    option_premium_type,
    option_right,
    option_strike,
    option_structure,
    plan_clarity,
    planned_stop,
    planned_target,
    position_size,
    slippage,
    thesis,
    ...basePayload
  } = input

  return {
    apiPayload: {
      ...basePayload,
      symbol: input.symbol.trim(),
      setup: trimToNull(input.setup) ?? undefined,
      note: trimToNull(input.note),
    },
    meta: sanitizeTradeRecordMeta({
      actual_stop,
      actual_target,
      entry_at,
      entry_price,
      execution_quality,
      exit_at,
      exit_price,
      fees,
      followed_plan,
      lesson,
      mistake_tags,
      option_delta,
      option_expiration,
      option_max_reward,
      option_max_risk,
      option_premium_type,
      option_right,
      option_strike,
      option_structure,
      plan_clarity,
      planned_stop,
      planned_target,
      position_size,
      slippage,
      thesis,
    }),
  }
}
