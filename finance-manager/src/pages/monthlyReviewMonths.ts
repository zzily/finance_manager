const REVIEW_QUICK_MONTH_LIMIT = 5

export function getReviewMonthVisibility(
  availableMonths: string[],
  selectedMonth: string,
  limit = REVIEW_QUICK_MONTH_LIMIT,
) {
  const dataMonths = availableMonths.filter(Boolean)
  const sourceMonths = dataMonths.length > 0 ? dataMonths : [selectedMonth].filter(Boolean)
  const quickMonths = sourceMonths.slice(0, limit)

  if (selectedMonth && !quickMonths.includes(selectedMonth)) {
    quickMonths.push(selectedMonth)
  }

  return {
    quickMonths: Array.from(new Set(quickMonths)),
    overflowMonths: sourceMonths.filter((month) => !quickMonths.includes(month)),
    totalDataMonths: dataMonths.length > 0 ? dataMonths.length : sourceMonths.length,
  }
}
