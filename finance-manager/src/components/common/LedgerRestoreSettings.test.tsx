import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { api } from "../../lib/api"
import { createQueryClientWrapper } from "../../test/queryClient"
import { LedgerRestoreSettings } from "./LedgerRestoreSettings"
const data = { version: 2, checksum: "a".repeat(64), ledger: { expense_categories: [] }, templates: [] }
function upload(value: unknown) {
  const file = new File([JSON.stringify(value)], "backup.json", { type: "application/json" })
  Object.defineProperty(file, "text", { value: () => Promise.resolve(JSON.stringify(value)) })
  fireEvent.change(screen.getByLabelText("从备份恢复"), { target: { files: [file] } })
}
afterEach(() => vi.restoreAllMocks())
describe("backup restore review", () => {
  it("rejects legacy exports before making a restore request", async () => {
    const post = vi.spyOn(api, "post")
    render(<LedgerRestoreSettings />, { wrapper: createQueryClientWrapper() })
    upload({ version: 1, transactions: [] })
    await screen.findByText(/请选择版本 2/)
    expect(post).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "校验备份" })).toBeDisabled()
  })
  it("requires a fresh preview after changing the restore key", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { code: 200, data: { can_restore: true, already_restored: false, counts: { transactions: 1 }, existing_counts: {} } } })
    const user = userEvent.setup()
    render(<LedgerRestoreSettings />, { wrapper: createQueryClientWrapper() })
    upload(data)
    await user.type(screen.getByLabelText("恢复密钥"), "test-only")
    await waitFor(() => expect(screen.getByRole("button", { name: "校验备份" })).toBeEnabled())
    await user.click(screen.getByRole("button", { name: "校验备份" }))
    await screen.findByRole("button", { name: "确认恢复到账本" })
    await user.type(screen.getByLabelText("恢复密钥"), "changed")
    expect(screen.queryByRole("button", { name: "确认恢复到账本" })).not.toBeInTheDocument()
    expect(post).toHaveBeenCalledTimes(1)
  })
  it("does not offer restoration into an existing ledger", async () => {
    vi.spyOn(api, "post").mockResolvedValue({ data: { code: 200, data: { can_restore: false, already_restored: false, counts: { transactions: 1 }, existing_counts: { transactions: 3 } } } })
    const user = userEvent.setup()
    render(<LedgerRestoreSettings />, { wrapper: createQueryClientWrapper() })
    upload(data)
    await user.type(screen.getByLabelText("恢复密钥"), "test-only")
    await waitFor(() => expect(screen.getByRole("button", { name: "校验备份" })).toBeEnabled())
    await user.click(screen.getByRole("button", { name: "校验备份" }))
    await screen.findByText(/当前账本已有记录/)
    expect(screen.queryByRole("button", { name: "确认恢复到账本" })).not.toBeInTheDocument()
  })
})
