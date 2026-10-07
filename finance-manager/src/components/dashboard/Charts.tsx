import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "../ui/chart"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "../ui/empty"
import { Skeleton } from "../ui/skeleton"
import { currency } from "../../lib/formatters"
import type { ChartData } from "../../types"

const trendConfig = {
  income_salary: { label: "工资", color: "hsl(var(--chart-1))" },
  income_reimbursement: { label: "报销", color: "hsl(var(--chart-2))" },
  spending_work: { label: "工作垫付", color: "hsl(var(--chart-3))" },
  spending_personal: { label: "个人消费", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig
const pieColors = [3, 4, 1, 2, 5].map((index) => `hsl(var(--chart-${index}))`)

function ChartEmpty() {
  return (
    <Empty className="min-h-[260px] border-0">
      <EmptyHeader>
        <EmptyTitle>暂无数据</EmptyTitle>
        <EmptyDescription>录入收支后查看统计。</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function MonthlyTrendChart({
  data,
  isLoading,
}: {
  data: ChartData | null
  isLoading: boolean
}) {
  const timeline = data?.monthly_timeline ?? []
  return (
    <Card>
      <CardHeader>
        <CardTitle>月度收支趋势</CardTitle>
        <CardDescription>按月对比收入与支出</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : timeline.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ChartContainer
            config={trendConfig}
            className="h-[260px] w-full aspect-auto"
            aria-label="月度收支趋势"
          >
            <BarChart
              accessibilityLayer
              data={timeline}
              margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("zh-CN", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(value)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    valueFormatter={(value) => currency.format(Number(value))}
                  />
                }
              />
              <ChartLegend
                content={<ChartLegendContent className="flex-wrap" />}
              />
              {Object.entries(trendConfig).map(([key, config]) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={config.label}
                  fill={`var(--color-${key})`}
                  radius={[3, 3, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function CategoryPieChart({
  data,
  isLoading,
}: {
  data: ChartData | null
  isLoading: boolean
}) {
  const breakdown =
    data?.personal_category_breakdown ?? data?.category_breakdown ?? []
  const total = breakdown.reduce((sum, item) => sum + item.value, 0)
  const slices = breakdown.map((item, index) => ({
    ...item,
    category: `category${index}`,
    fill: `var(--color-category${index})`,
  }))
  const config: ChartConfig = Object.fromEntries(
    breakdown.map((item, index) => [
      `category${index}`,
      { label: item.name, color: pieColors[index % pieColors.length] },
    ]),
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle>支出构成</CardTitle>
        <CardDescription>
          {data?.personal_category_breakdown
            ? "个人消费按分类统计"
            : "工作垫付与个人消费"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="mx-auto h-[260px] w-[260px] rounded-full" />
        ) : !breakdown.length || total === 0 ? (
          <ChartEmpty />
        ) : (
          <>
            <div className="relative">
              <ChartContainer
                config={config}
                className="h-[260px] w-full aspect-auto"
                aria-label="支出构成"
              >
                <PieChart accessibilityLayer>
                  <Pie
                    data={slices}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="category"
                  >
                    {slices.map((item) => (
                      <Cell key={item.category} fill={item.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        nameKey="category"
                        valueFormatter={(value) =>
                          currency.format(Number(value))
                        }
                      />
                    }
                  />
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">总支出</p>
                  <p className="text-base font-bold tabular-nums">
                    {currency.format(total)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {breakdown.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span
                    className="inline-block size-2.5 rounded-sm"
                    style={{
                      backgroundColor: pieColors[index % pieColors.length],
                    }}
                  />
                  <span>{item.name}</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {currency.format(item.value)}
                  </span>
                  <span>{((item.value / total) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
