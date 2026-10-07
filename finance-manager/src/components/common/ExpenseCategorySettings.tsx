import { NativeSelect } from "../ui/native-select"
import { useState } from "react"
import { useExpenseCategories } from "../../hooks/useExpenseCategories"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Field, FieldLabel, FieldDescription } from "../ui/field"
import type { ExpenseCategory } from "../../types"

function CategoryRow({
  category,
  pending,
  update,
}: {
  category: ExpenseCategory
  pending: boolean
  update: (payload: { id: number; name?: string; archived?: boolean }) => void
}) {
  const [name, setName] = useState(category.name)
  return (
    <div className="flex items-center gap-2 py-2">
      <Input
        className="min-w-0 flex-1"
        aria-label={`分类名称：${category.name}`}
        value={name}
        maxLength={50}
        onChange={(e) => setName(e.target.value)}
        disabled={pending}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={pending || !name.trim() || name.trim() === category.name}
        onClick={() => update({ id: category.id, name: name.trim() })}
      >
        保存
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        aria-label={`${category.archived ? "启用" : "停用"}分类：${category.name}`}
        onClick={() =>
          update({ id: category.id, archived: !category.archived })
        }
      >
        {category.archived ? "启用" : "停用"}
      </Button>
    </div>
  )
}
export function ExpenseCategorySettings() {
  const categories = useExpenseCategories(true)
  const [kind, setKind] = useState<ExpenseCategory["kind"]>("personal")
  const [name, setName] = useState("")
  const pending = categories.create.isPending || categories.update.isPending
  return (
    <Field>
      <FieldLabel htmlFor="settings-category-kind">支出分类</FieldLabel>
      <NativeSelect
        id="settings-category-kind"
        className="h-11 rounded-md border bg-background px-3 text-sm"
        value={kind}
        onChange={(e) => setKind(e.target.value as ExpenseCategory["kind"])}
      >
        <option value="personal">个人支出</option>
        <option value="work">工作垫付</option>
      </NativeSelect>
      <FieldDescription>
        停用后不再用于新账单，历史记录仍保留原分类。
      </FieldDescription>
      {categories.query.isError ? (
        <Button
          variant="outline"
          onClick={() => void categories.query.refetch()}
        >
          分类加载失败，重试
        </Button>
      ) : categories.query.isLoading ? (
        <p className="text-sm text-muted-foreground">正在加载分类…</p>
      ) : (
        <div className="max-h-48 divide-y overflow-y-auto">
          {categories.categories
            .filter((c) => c.kind === kind)
            .map((c) => (
              <CategoryRow
                key={`${c.id}:${c.name}`}
                category={c}
                pending={pending}
                update={(p) => categories.update.mutate(p)}
              />
            ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          aria-label="新分类名称"
          placeholder="例如：孩子教育"
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
        />
        <Button
          variant="outline"
          disabled={pending || !name.trim()}
          onClick={() =>
            categories.create.mutate(
              { name: name.trim(), kind },
              { onSuccess: () => setName("") },
            )
          }
        >
          添加分类
        </Button>
      </div>
    </Field>
  )
}
