import { Doughnut, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js"
import type { ReactNode } from "react"
import type { InvestmentDto, SpendingCategoryDto, TransactionDto } from "@/types"
import { formatCurrency, formatDate } from "@/lib/format"

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler)

export function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string
  value: string
  hint?: string
  accent?: string
  icon?: string
}) {
  return (
    <div className="card card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${accent ?? "text-slate-800"}`}>{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {icon && (
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg ring-1 ring-brand-100">
            {icon}
          </span>
        )}
      </div>
    </div>
  )
}

export function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

export function SpendingChart({ data }: { data: SpendingCategoryDto[] }) {
  const palette = ["#3563e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"]
  const chartData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        data: data.map((d) => d.total),
        backgroundColor: palette,
        borderWidth: 0,
      },
    ],
  }
  const options = { plugins: { legend: { position: "bottom" as const } }, cutout: "62%" }
  if (!data.length) return <p className="text-sm text-slate-400">No spending data yet.</p>
  return <Doughnut data={chartData} options={options} />
}

export function BalanceTrend({ transactions }: { transactions: TransactionDto[] }) {
  const ordered = [...transactions].reverse()
  const chartData = {
    labels: ordered.map((t) => formatDate(t.occurredAtUtc)),
    datasets: [
      {
        label: "Balance",
        data: ordered.map((t) => t.balanceAfter),
        borderColor: "#3563e9",
        backgroundColor: "rgba(53,99,233,0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: 0,
      },
    ],
  }
  const options = {
    plugins: { legend: { display: false } },
    scales: { x: { display: false } },
  }
  if (!transactions.length) return <p className="text-sm text-slate-400">No activity yet.</p>
  return <Line data={chartData} options={options} />
}

export function CreditScoreWidget({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, ((score - 300) / 550) * 100))
  const band = score >= 740 ? "Excellent" : score >= 670 ? "Good" : score >= 580 ? "Fair" : "Poor"
  return (
    <div className="card card-hover">
      <p className="text-sm text-slate-500">Credit score</p>
      <p className="mt-1 text-3xl font-bold text-brand-700">{score}</p>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-accent-500" style={trackStyle(pct)} />
      </div>
      <p className="mt-2 text-xs font-medium text-accent-600">{band}</p>
    </div>
  )
}

function trackStyle(pct: number) {
  return { width: `${pct}%` }
}

export function SavingsGoals() {
  const goals = [
    { name: "Emergency fund", saved: 4200, target: 6000 },
    { name: "Vacation", saved: 1500, target: 3000 },
    { name: "New laptop", saved: 900, target: 1500 },
  ]
  return (
    <div className="space-y-4">
      {goals.map((g) => {
        const pct = Math.round((g.saved / g.target) * 100)
        return (
          <div key={g.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-slate-600">{g.name}</span>
              <span className="text-slate-400">
                {formatCurrency(g.saved)} / {formatCurrency(g.target)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-brand-500" style={trackStyle(pct)} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function InvestmentList({ items }: { items: InvestmentDto[] }) {
  if (!items.length) return <p className="text-sm text-slate-400">No holdings.</p>
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((i) => (
        <li key={i.id} className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-sm font-semibold text-slate-700">{i.symbol}</p>
            <p className="text-xs text-slate-400">{i.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">{formatCurrency(i.marketValue)}</p>
            <p className={`text-xs ${i.unrealizedGain >= 0 ? "text-accent-600" : "text-red-500"}`}>
              {i.unrealizedGain >= 0 ? "+" : ""}
              {formatCurrency(i.unrealizedGain)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function TransactionRows({ items }: { items: TransactionDto[] }) {
  if (!items.length) return <p className="text-sm text-slate-400">No transactions.</p>
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((t) => (
        <li key={t.id} className="flex items-center justify-between py-2.5">
          <div>
            <p className="text-sm font-medium text-slate-700">{t.description}</p>
            <p className="text-xs text-slate-400">
              {t.category} · {formatDate(t.occurredAtUtc)}
            </p>
          </div>
          <span className={`text-sm font-semibold ${t.amount >= 0 ? "text-accent-600" : "text-slate-700"}`}>
            {t.amount >= 0 ? "+" : ""}
            {formatCurrency(t.amount)}
          </span>
        </li>
      ))}
    </ul>
  )
}
