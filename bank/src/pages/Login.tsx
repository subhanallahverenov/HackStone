import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { AxiosError } from "axios"
import { useAuth } from "@/context/AuthContext"
import { Brand } from "@/components/Brand"

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [email, setEmail] = useState("demo@team5.bank")
  const [password, setPassword] = useState("Demo123$")
  const [mfaCode, setMfaCode] = useState("")
  const [needsMfa, setNeedsMfa] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password, needsMfa ? mfaCode : undefined)
      navigate(location.state?.from ?? "/app")
    } catch (err) {
      const ax = err as AxiosError<{ error?: string }>
      const msg = ax.response?.data?.error
      if (msg === "MFA_REQUIRED") {
        setNeedsMfa(true)
        setError("Enter your 6-digit MFA code.")
      } else {
        setError(msg ?? "Sign in failed. Check your credentials.")
      }
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
        <div className="pointer-events-none absolute -right-16 top-24 h-72 w-72 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="relative">
          <Brand light />
        </div>
        <div className="relative">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">Banking that works as hard as you do.</h2>
          <p className="mt-4 max-w-sm text-brand-100">Secure, instant, and intelligent. Your money, beautifully organized.</p>
          <div className="mt-8 flex gap-6 text-sm text-brand-100">
            <span>🔒 256-bit encryption</span>
            <span>⚡ Instant transfers</span>
          </div>
        </div>
        <p className="relative text-xs text-brand-200">© {new Date().getFullYear()} Team5 Bank</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden">
            <Brand />
          </div>
          <h1 className="text-center text-2xl font-extrabold text-slate-800">Welcome back</h1>
          <p className="mb-6 mt-1 text-center text-sm text-slate-500">Sign in to your Team5 Bank account</p>
          {error && <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 ring-1 ring-amber-100">{error}</div>}
          <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-soft ring-1 ring-slate-100">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {needsMfa && (
              <div>
                <label className="label">MFA code</label>
                <input className="input" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} maxLength={6} />
              </div>
            )}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            New to Team5 Bank?{" "}
            <Link to="/register" className="font-semibold text-brand-700">
              Open an account
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-slate-400">Demo: demo@team5.bank / Demo123$</p>
        </div>
      </div>
    </div>
  )
}
