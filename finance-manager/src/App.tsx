import SettlementPage from "./pages/SettlementPage"
import { Toaster } from "sonner"
import { ApiSwitcher } from "./components/common/ApiSwitcher"

function App() {
  return (
    <>
      <SettlementPage />
      <Toaster position="top-center" richColors closeButton />
      <ApiSwitcher />
    </>
  )
}

export default App
