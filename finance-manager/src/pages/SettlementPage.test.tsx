import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Transaction } from "../types"
import SettlementPage from "./SettlementPage"

const { mockUseTransactions, mockUseSalaryLogs, mockUseSummary } = vi.hoisted(() => ({
  mockUseTransactions: vi.fn(),
  mockUseSalaryLogs: vi.fn(),
  mockUseSummary: vi.fn(),
}))

vi.mock("../hooks/useTransactions", () => ({
  useTransactions: mockUseTransactions,
}))

vi.mock("../hooks/useSalaryLogs", () => ({
  useSalaryLogs: mockUseSalaryLogs,
}))

vi.mock("../hooks/useSummary", () => ({
  useSummary: mockUseSummary,
}))

vi.mock("../components/dashboard/BusinessLoopCard", () => ({
  BusinessLoopCard: () => <div data-testid="business-loop-card" />,
}))

vi.mock("../components/dashboard/FamilyLoopCard", () => ({
  FamilyLoopCard: () => <div data-testid="family-loop-card" />,
}))

vi.mock("../components/dashboard/MetricCards", () => ({
  BalanceCard: ({ balance }: { balance: number }) => <div data-testid="balance-card">{balance}</div>,
  TotalAssetsCard: ({ totalAssets }: { totalAssets: number }) => (
    <div data-testid="total-assets-card">{totalAssets}</div>
  ),
}))

vi.mock("../components/dashboard/Charts", () => ({
  MonthlyTrendChart: () => <div data-testid="monthly-trend-chart" />,
  CategoryPieChart: () => <div data-testid="category-pie-chart" />,
}))

vi.mock("../components/dashboard/OperationBar", () => ({
  OperationBar: ({ billsPending }: { billsPending: number }) => (
    <div data-testid="operation-bar">{billsPending}</div>
  ),
}))

vi.mock("./SettlementDialogs", () => ({
  SettlementDialogs: () => <div data-testid="settlement-dialogs" />,
}))

vi.mock("../components/transaction/TransactionTable", () => ({
  TransactionTable: ({ data }: { data: Transaction[] }) => (
    <div data-testid="transaction-table">{data.map((item) => item.title).join("|")}</div>
  ),
}))

vi.mock("../components/transaction/MobileTransactionCard", () => ({
  MobileTransactionCard: () => null,
}))

const pendingTransaction: Transaction = {
  id: 1,
  title: "Pending bill",
  amount_out: 120,
  amount_reimbursed: 0,
  category: "work",
  status: "pending",
  created_at: "2026-03-27T00:00:00Z",
}

const settledTransaction: Transaction = {
  id: 2,
  title: "Settled bill",
  amount_out: 88,
  amount_reimbursed: 88,
  category: "personal",
  status: "settled",
  created_at: "2026-03-26T00:00:00Z",
}

beforeEach(() => {
  mockUseTransactions.mockReturnValue({
    all: [settledTransaction, pendingTransaction],
    unsettled: [pendingTransaction],
    query: {
      isLoading: false,
      isError: false,
    },
  })

  mockUseSalaryLogs.mockReturnValue({})

  mockUseSummary.mockReturnValue({
    isLoading: false,
    availableBalance: 600,
    totalAssets: 1800,
    businessLoop: null,
    businessDebt: 0,
    familyLoop: null,
    netSavings: 0,
    personalSpending: 0,
    chartData: null,
    billsPending: 1,
    actionNeeded: "pending",
  })
})

describe("SettlementPage", () => {
  it("renders the basic dashboard and bills section", () => {
    render(<SettlementPage />)

    expect(screen.getByTestId("settlement-page")).toBeInTheDocument()
    expect(screen.getByTestId("balance-card")).toHaveTextContent("600")
    expect(screen.getByTestId("total-assets-card")).toHaveTextContent("1800")
    expect(screen.getByTestId("business-loop-card")).toBeInTheDocument()
    expect(screen.getByTestId("family-loop-card")).toBeInTheDocument()
    expect(screen.getByTestId("operation-bar")).toHaveTextContent("1")
    expect(screen.getByTestId("settlement-dialogs")).toBeInTheDocument()
    expect(screen.getByTestId("transaction-table")).toHaveTextContent("Pending bill")
  })

  it("switches bills tabs between pending and history records", async () => {
    const user = userEvent.setup()

    render(<SettlementPage />)

    expect(screen.getByTestId("transaction-table")).toHaveTextContent("Pending bill")
    expect(screen.getByTestId("transaction-table")).not.toHaveTextContent("Settled bill")

    await user.click(screen.getByTestId("bills-tab-history"))

    expect(screen.getByTestId("transaction-table")).toHaveTextContent("Pending bill")
    expect(screen.getByTestId("transaction-table")).toHaveTextContent("Settled bill")

    await user.click(screen.getByTestId("bills-tab-pending"))

    expect(screen.getByTestId("transaction-table")).toHaveTextContent("Pending bill")
    expect(screen.getByTestId("transaction-table")).not.toHaveTextContent("Settled bill")
  })
})
