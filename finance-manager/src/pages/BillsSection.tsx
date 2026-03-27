import { EmptyState, MobileCardSkeleton } from "../components/common"
import { MobileTransactionCard } from "../components/transaction/MobileTransactionCard"
import { TransactionTable } from "../components/transaction/TransactionTable"
import type { Transaction } from "../types"

import type { SettlementTab } from "./useSettlementPageState"

type BillsSectionProps = {
  activeTab: SettlementTab
  data: Transaction[]
  isError: boolean
  isLoading: boolean
  onAdd: () => void
  onDelete: (transaction: Transaction) => void
  onEdit: (transaction: Transaction) => void
  onHistory: (transaction: Transaction) => void
  onSettle: (transaction: Transaction) => void
  onTabChange: (tab: SettlementTab) => void
}

export function BillsSection({
  activeTab,
  data,
  isError,
  isLoading,
  onAdd,
  onDelete,
  onEdit,
  onHistory,
  onSettle,
  onTabChange,
}: BillsSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="relative flex items-center gap-1 rounded-full bg-slate-100 p-0.5">
          {(["pending", "history"] as const).map((tab) => (
            <button
              key={tab}
              data-testid={`bills-tab-${tab}`}
              className={`relative z-10 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${activeTab === tab ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => onTabChange(tab)}
            >
              {tab === "pending" ? "待核销" : "全部记录"}
            </button>
          ))}
        </div>
        <span className="hidden text-xs text-slate-400 sm:inline">
          {activeTab === "pending" ? "仅显示未结清账单" : "展示全部账单记录"}
        </span>
      </div>

      <div className="hidden md:block">
        <TransactionTable
          data={data}
          isLoading={isLoading}
          isError={isError}
          activeTab={activeTab}
          onSettle={onSettle}
          onEdit={onEdit}
          onDelete={onDelete}
          onHistory={onHistory}
          onAdd={onAdd}
        />
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {isLoading && Array.from({ length: 3 }).map((_, index) => <MobileCardSkeleton key={index} />)}
        {isError && <div className="py-10 text-center text-sm text-red-500">无法加载账单，请稍后重试</div>}
        {!isLoading && data.length === 0 && <EmptyState tab={activeTab} onAdd={onAdd} />}
        {data.map((item) => (
          <MobileTransactionCard
            key={item.id}
            item={item}
            onSettle={onSettle}
            onEdit={onEdit}
            onDelete={onDelete}
            onHistory={onHistory}
          />
        ))}
      </div>
    </div>
  )
}
