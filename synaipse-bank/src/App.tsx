import { Routes, Route, Navigate } from "react-router-dom"
import { PublicLayout } from "@/components/layout/PublicLayout"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import Landing from "@/pages/Landing"
import PersonalBanking from "@/pages/PersonalBanking"
import BusinessBanking from "@/pages/BusinessBanking"
import CreditCards from "@/pages/CreditCards"
import Loans from "@/pages/Loans"
import Investments from "@/pages/Investments"
import SecurityCenter from "@/pages/SecurityCenter"
import ContactUs from "@/pages/ContactUs"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import Dashboard from "@/pages/Dashboard"
import TransactionHistory from "@/pages/TransactionHistory"
import MoneyTransfer from "@/pages/MoneyTransfer"
import AccountManagement from "@/pages/AccountManagement"
import AiAssistant from "@/pages/AiAssistant"

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/personal" element={<PersonalBanking />} />
        <Route path="/business" element={<BusinessBanking />} />
        <Route path="/credit-cards" element={<CreditCards />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/security" element={<SecurityCenter />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/transactions" element={<TransactionHistory />} />
        <Route path="/app/transfer" element={<MoneyTransfer />} />
        <Route path="/app/accounts" element={<AccountManagement />} />
        <Route path="/app/assistant" element={<AiAssistant />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
