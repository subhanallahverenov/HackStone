import axios, { AxiosError, type AxiosRequestConfig } from "axios"
import type { AuthResponse } from "@/types"

const REFRESH_KEY = "t5_refresh"

// Access token is kept in memory only (XSS-resistant); refresh token persists.
let accessToken: string | null = null

export const tokenStore = {
  getAccessToken: () => accessToken,
  setAccessToken: (token: string | null) => {
    accessToken = token
  },
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  setRefreshToken: (token: string | null) => {
    if (token) localStorage.setItem(REFRESH_KEY, token)
    else localStorage.removeItem(REFRESH_KEY)
  },
  setTokens: (auth: AuthResponse) => {
    accessToken = auth.accessToken
    localStorage.setItem(REFRESH_KEY, auth.refreshToken)
  },
  clear: () => {
    accessToken = null
    localStorage.removeItem(REFRESH_KEY)
  },
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api"

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
})

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Single-flight refresh so concurrent 401s share one refresh call.
let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) return null
  try {
    const res = await axios.post<AuthResponse>(`${baseURL}/auth/refresh`, { refreshToken })
    tokenStore.setTokens(res.data)
    return res.data.accessToken
  } catch {
    tokenStore.clear()
    return null
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    const status = error.response?.status
    const url = original?.url ?? ""

    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/refresh")
    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      if (!refreshing) refreshing = refreshAccessToken()
      const newToken = await refreshing
      refreshing = null
      if (newToken) {
        original.headers = original.headers ?? {}
        ;(original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)
