import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { Brand } from "@/components/Brand"
import { useAuth } from "@/context/AuthContext"

const navLinks = [
  { to: "/personal", label: "Personal" },
  { to: "/business", label: "Business" },
  { to: "/credit-cards", label: "Cards" },
  { to: "/loans", label: "Loans" },
  { to: "/investments", label: "Investments" },
  { to: "/security", label: "Security" },
  { to: "/contact", label: "Contact" },
]

function navClass(state: { isActive: boolean }) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${state.isActive ? "text-brand-700" : "text-slate-600 hover:text-brand-700"}`
}

export function PublicLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Brand />
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={navClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <button className="btn-primary" onClick={() => navigate("/app")}>
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="hidden btn-ghost sm:inline-flex">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Open account
                </Link>
              </>
            )}
            <button
              className="ml-1 rounded-lg p-2 text-slate-600 ring-1 ring-slate-200 lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="grid gap-1">
              {navLinks.map((l) => (
                <NavLink key={l.to} to={l.to} className={navClass} onClick={() => setMenuOpen(false)}>
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-brand-950 text-brand-100">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Brand light />
            <p className="mt-3 max-w-xs text-sm text-brand-200">
              Modern digital banking for people and businesses. Bank-grade security, 24/7 support.
            </p>
          </div>
          <FooterCol title="Products" items={["Personal Banking", "Business Banking", "Credit Cards", "Loans"]} />
          <FooterCol title="Company" items={["About", "Security Center", "Contact Us", "Careers"]} />
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
            <p className="text-xs leading-relaxed text-brand-200">
              Team5 Bank is a demonstration project. Not a real financial institution. Branding is original and inspired by, but not copied from, well-known banks.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-brand-200">
          © {new Date().getFullYear()} Team5 Bank. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-white">{title}</h4>
      <ul className="space-y-2 text-sm text-brand-200">
        {items.map((i) => (
          <li key={i} className="cursor-pointer transition hover:text-white">
            {i}
          </li>
        ))}
      </ul>
    </div>
  )
}
