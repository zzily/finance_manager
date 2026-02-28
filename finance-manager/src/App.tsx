import SettlementPage from "./pages/SettlementPage"
import { Toaster } from "sonner"

function App() {
  return (
    <>
      <SettlementPage />
      <Toaster position="top-center" richColors closeButton />
    </>
  )
}

export default App
