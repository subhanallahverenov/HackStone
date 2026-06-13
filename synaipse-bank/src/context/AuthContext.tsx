import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { api, tokenStore } from "@/lib/apiClient"
import type { AuthResponse, UserDto } from "@/types"

const USER_KEY = "t5_user"

interface AuthContextValue {
  user: UserDto | null
  loading: boolean
  login: (email: string, password: string, mfaCode?: string) => Promise<void>
  register: (email: string, fullName: string, password: string, phoneNumber?: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser(): UserDto | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserDto) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(() => readStoredUser())
  const [loading, setLoading] = useState(false)

  function persistAuth(auth: AuthResponse) {
    tokenStore.setTokens(auth)
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user))
    setUser(auth.user)
  }

  async function login(email: string, password: string, mfaCode?: string) {
    setLoading(true)
    try {
      const res = await api.post<AuthResponse>("/auth/login", { email, password, mfaCode })
      persistAuth(res.data)
    } finally {
      setLoading(false)
    }
  }

  async function register(email: string, fullName: string, password: string, phoneNumber?: string) {
    setLoading(true)
    try {
      const res = await api.post<AuthResponse>("/auth/register", { email, fullName, password, phoneNumber })
      persistAuth(res.data)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    tokenStore.clear()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  // Keep the in-memory access token aligned with a stored session on first load.
  useEffect(() => {
    if (user && !tokenStore.getAccessToken() && !tokenStore.getRefreshToken()) {
      // No way to silently restore without a refresh token; clear stale profile.
      localStorage.removeItem(USER_KEY)
      setUser(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
