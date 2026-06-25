import { Link } from "react-router-dom"

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-extrabold text-white shadow-glow transition group-hover:scale-105">
        T5
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-brand-900"}`}>
        Team5 <span className="gradient-text">Bank</span>
      </span>
    </Link>
  )
}
