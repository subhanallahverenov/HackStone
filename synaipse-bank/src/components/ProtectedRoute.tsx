import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "@/context/AuthContext"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    const redirectState = { from: location.pathname }
    return <Navigate to="/login" state={redirectState} replace />
  }
  return <>{children}</>
}
