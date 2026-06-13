import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { Brand } from "@/components/Brand"
import { useAuth } from "@/context/AuthContext"
import { SymbolicAI } from "@/components/SymbolicAI"

const items = [
  { to: "/app", label: "Dashboard", icon: "🏠" },
  { to: "/app/transactions", label: "Transactions", icon: "📜" },
  { to: "/app/transfer", label: "Transfer", icon: "💸" },
  { to: "/app/accounts", label: "Accounts", icon: "🏦" },
  { to: "/app/assistant", label: "Symbolic AI", icon: "✨" },
]

function linkClass(state: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${state.isActive ? "bg-white/15 text-white shadow-soft" : "text-brand-100 hover:bg-white/10 hover:text-white"}`
}

export function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="flex min-h-full bg-slate-100">
      <aside className="hidden w-64 flex-col bg-gradient-to-b from-brand-950 to-brand-800 p-4 md:flex">
        <div className="px-2 py-3">
          <Brand light />
        </div>
        <nav className="mt-6 flex-1 space-y-1.5">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.to === "/app"} className={linkClass}>
              <span className="text-base">{it.icon}</span>
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="rounded-2xl bg-white/10 p-3">
          <p className="text-xs text-brand-200">Signed in as</p>
          <p className="truncate text-sm font-semibold text-white">{user?.email}</p>
          <button
            className="mt-3 w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur">
          <div>
            <p className="text-xs text-slate-400">Welcome back</p>
            <h1 className="text-lg font-bold text-slate-800">{user?.fullName?.split(" ")[0] ?? "there"} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="hidden rounded-lg p-2 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-50 md:inline-flex"
              aria-label="Notifications"
            >
              🔔
            </button>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-bold text-white">
              {user?.fullName?.charAt(0) ?? "U"}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <SymbolicAI />
    </div>
  )
}
