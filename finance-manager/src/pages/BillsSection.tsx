import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
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
  hideTabs?: boolean
  hasActiveFilters?: boolean
  onReset?: () => void
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
  hideTabs = false,
  hasActiveFilters = false,
  onReset,
}: BillsSectionProps) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm">
      {!hideTabs && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Tabs
            value={activeTab}
            onValueChange={(value) => onTabChange(value as SettlementTab)}
          >
            <TabsList aria-label="账单范围">
              {(["pending", "history"] as const).map((tab) => (
                <TabsTrigger
                  value={tab}
                  key={tab}
                  data-testid={`bills-tab-${tab}`}
                >
                  {tab === "pending" ? "待核销" : "全部记录"}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {activeTab === "pending" ? "仅显示未结清账单" : "展示全部账单记录"}
          </span>
        </div>
      )}

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
          hasActiveFilters={hasActiveFilters}
          onReset={onReset}
        />
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <MobileCardSkeleton key={index} />
          ))}
        {isError && (
          <div className="py-10 text-center text-sm text-destructive">
            无法加载账单，请稍后重试
          </div>
        )}
        {!isLoading && !isError && data.length === 0 && (
          <EmptyState
            tab={activeTab}
            onAdd={onAdd}
            filtered={hasActiveFilters}
            onReset={onReset}
          />
        )}
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
