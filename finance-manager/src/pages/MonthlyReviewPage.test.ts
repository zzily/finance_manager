import { describe, expect, it } from "vitest"

import { getReviewMonthVisibility } from "./monthlyReviewMonths"

describe("getReviewMonthVisibility", () => {
  it("keeps only the latest five months as quick shortcuts", () => {
    const result = getReviewMonthVisibility(
      ["2026-06", "2026-05", "2026-04", "2026-03", "2026-02", "2026-01", "2025-12"],
      "2026-06",
    )

    expect(result.quickMonths).toEqual(["2026-06", "2026-05", "2026-04", "2026-03", "2026-02"])
    expect(result.overflowMonths).toEqual(["2026-01", "2025-12"])
    expect(result.totalDataMonths).toBe(7)
  })

  it("keeps the selected month visible when it falls outside the latest five months", () => {
    const result = getReviewMonthVisibility(
      ["2026-06", "2026-05", "2026-04", "2026-03", "2026-02", "2026-01", "2025-12"],
      "2025-12",
    )

    expect(result.quickMonths).toEqual([
      "2026-06",
      "2026-05",
      "2026-04",
      "2026-03",
      "2026-02",
      "2025-12",
    ])
    expect(result.overflowMonths).toEqual(["2026-01"])
  })

  it("keeps a manually selected no-data month visible", () => {
    const result = getReviewMonthVisibility(
      ["2026-06", "2026-05", "2026-04", "2026-03", "2026-02", "2026-01"],
      "2024-09",
    )

    expect(result.quickMonths).toEqual([
      "2026-06",
      "2026-05",
      "2026-04",
      "2026-03",
      "2026-02",
      "2024-09",
    ])
    expect(result.overflowMonths).toEqual(["2026-01"])
    expect(result.totalDataMonths).toBe(6)
  })
})
