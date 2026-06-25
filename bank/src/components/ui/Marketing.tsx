import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

const fadeInitial = { opacity: 0, y: 20 }
const fadeInView = { opacity: 1, y: 0 }
const viewportOnce = { once: true }
const delay1 = { delay: 0.08 }
const delay2 = { delay: 0.16 }
const delay3 = { delay: 0.24 }
const cardFloat = { opacity: 0, y: 30, scale: 0.95 }
const cardShow = { opacity: 1, y: 0, scale: 1 }
const cardTransition = { duration: 0.5 }

function featureDelay(i: number) {
  return { delay: (i % 3) * 0.08 }
}

export function Hero({
  eyebrow,
  title,
  subtitle,
  ctaLabel = "Open an account",
  ctaTo = "/register",
}: {
  eyebrow: string
  title: string
  subtitle: string
  ctaLabel?: string
  ctaTo?: string
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-32 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 lg:grid-cols-2">
        <div>
          <motion.span initial={fadeInitial} whileInView={fadeInView} viewport={viewportOnce} className="chip">
            ✨ {eyebrow}
          </motion.span>
          <motion.h1
            initial={fadeInitial}
            whileInView={fadeInView}
            viewport={viewportOnce}
            transition={delay1}
            className="mt-5 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={fadeInitial}
            whileInView={fadeInView}
            viewport={viewportOnce}
            transition={delay2}
            className="mt-5 max-w-xl text-lg text-brand-100"
          >
            {subtitle}
          </motion.p>
          <motion.div
            initial={fadeInitial}
            whileInView={fadeInView}
            viewport={viewportOnce}
            transition={delay3}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to={ctaTo} className="btn-white">
              {ctaLabel}
            </Link>
            <Link to="/contact" className="btn-outline">
              Talk to us
            </Link>
          </motion.div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-brand-100">
            <span className="flex items-center gap-2">🔒 Bank-grade security</span>
            <span className="flex items-center gap-2">⚡ Instant transfers</span>
            <span className="flex items-center gap-2">★ 4.9 app rating</span>
          </div>
        </div>
        <HeroCard />
      </div>
    </section>
  )
}

function HeroCard() {
  return (
    <motion.div
      initial={cardFloat}
      whileInView={cardShow}
      viewport={viewportOnce}
      transition={cardTransition}
      className="relative mx-auto w-full max-w-sm"
    >
      <div className="animate-floaty rounded-4xl bg-white p-6 text-slate-800 shadow-lift ring-1 ring-white/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Total balance</p>
            <p className="text-2xl font-extrabold text-brand-900">$30,600.75</p>
          </div>
          <span className="badge bg-accent-500/15 text-accent-700">+2.4%</span>
        </div>
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 p-4 text-white shadow-soft">
          <p className="text-xs text-brand-100">Team5 • Debit</p>
          <p className="mt-6 text-lg font-semibold tracking-widest">•••• •••• •••• 4291</p>
          <div className="mt-2 flex justify-between text-xs text-brand-100">
            <span>D. CUSTOMER</span>
            <span>12 / 28</span>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <Row label="Apple Store" sub="Shopping" amount="-$1,299.00" />
          <Row label="Salary" sub="Income" amount="+$5,400.00" positive />
          <Row label="Spotify" sub="Subscription" amount="-$9.99" />
        </div>
      </div>
    </motion.div>
  )
}

function Row({ label, sub, amount, positive = false }: { label: string; sub: string; amount: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm">{positive ? "💰" : "🛍️"}</span>
        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="text-xs text-slate-400">{sub}</p>
        </div>
      </div>
      <span className={`text-sm font-semibold ${positive ? "text-accent-600" : "text-slate-700"}`}>{amount}</span>
    </div>
  )
}

export function FeatureGrid({ items }: { items: { icon: string; title: string; body: string }[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f, i) => (
          <motion.div
            key={f.title}
            initial={fadeInitial}
            whileInView={fadeInView}
            viewport={viewportOnce}
            transition={featureDelay(i)}
            className="card card-hover"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl ring-1 ring-brand-100">
              {f.icon}
            </div>
            <h3 className="mb-1.5 text-base font-bold text-slate-800">{f.title}</h3>
            <p className="text-sm leading-relaxed text-slate-500">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export function Stats({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-extrabold gradient-text">{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 py-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-brand-100">{subtitle}</p>
      </div>
    </section>
  )
}

export function Section({ children }: { children: ReactNode }) {
  return <section className="mx-auto max-w-7xl px-4 py-12">{children}</section>
}

export function CTA({
  title,
  subtitle,
  ctaLabel = "Open your free account",
  ctaTo = "/register",
}: {
  title: string
  subtitle: string
  ctaLabel?: string
  ctaTo?: string
}) {
  return (
    <Section>
      <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-brand-900 to-brand-700 px-6 py-16 text-center text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent-500/30 blur-3xl" />
        <h2 className="relative text-3xl font-extrabold">{title}</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-brand-100">{subtitle}</p>
        <div className="relative mt-7 flex justify-center">
          <Link to={ctaTo} className="btn-white">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </Section>
  )
}
