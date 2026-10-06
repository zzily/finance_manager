import { ChevronRight } from "lucide-react"
import { currency } from "../../lib/formatters"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

export function BalanceCard({
  isLoading,
  balance,
  onClick,
}: {
  isLoading: boolean
  balance: number
  onClick?: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>可分配收入</CardTitle>
        <CardDescription>尚未关联账单的到账收入</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-xl font-semibold tabular-nums sm:text-2xl">
            {currency.format(balance)}
          </p>
        )}
        {onClick && (
          <button
            type="button"
            onClick={onClick}
            className="mt-2 flex min-h-9 items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            查看资金池明细
            <ChevronRight className="size-3" />
          </button>
        )}
      </CardContent>
    </Card>
  )
}
export function TotalAssetsCard({
  isLoading,
  totalAssets,
}: {
  isLoading: boolean
  totalAssets: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>账内资金及待回款</CardTitle>
        <CardDescription>现金 + 待回款，不含其他资产与负债</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-xl font-semibold tabular-nums sm:text-2xl">
            {currency.format(totalAssets)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function UnsettledBillsCard({isLoading,amount}:{isLoading:boolean;amount:number}){
 return <Card><CardHeader><CardTitle>待核销账单</CardTitle><CardDescription>个人支出与工作垫付的未结金额</CardDescription></CardHeader><CardContent>{isLoading?<Skeleton className="h-8 w-24" />:<p className="text-xl font-semibold tabular-nums sm:text-2xl">{currency.format(amount)}</p>}</CardContent></Card>
}
