import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/apiClient"
import type { DashboardDto } from "@/types"
import { formatCurrency } from "@/lib/format"
import {
  StatCard,
  Panel,
  SpendingChart,
  BalanceTrend,
  CreditScoreWidget,
  SavingsGoals,
  InvestmentList,
  TransactionRows,
} from "@/components/dashboard/Widgets"

async function fetchDashboard(): Promise<DashboardDto> {
  const res = await api.get<DashboardDto>("/dashboard")
  return res.data
}

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard })

  if (isLoading) return <p className="text-slate-500">Loading your dashboard…</p>
  if (isError || !data) return <p className="text-red-500">Couldn't load dashboard. Is the API running?</p>

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total balance" value={formatCurrency(data.totalBalance)} accent="text-brand-700" icon="💰" />
        <StatCard label="Investments" value={formatCurrency(data.totalInvestments)} accent="text-accent-600" icon="📈" />
        <StatCard label="Loans outstanding" value={formatCurrency(data.totalLoans)} icon="🏷️" />
        <StatCard label="Notifications" value={String(data.unreadNotifications)} hint="unread" icon="🔔" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Balance trend">
            <div className="h-64">
              <BalanceTrend transactions={data.recentTransactions} />
            </div>
          </Panel>
        </div>
        <CreditScoreWidget score={data.creditScore} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Spending (30 days)">
          <div className="mx-auto h-60 w-60">
            <SpendingChart data={data.spending} />
          </div>
        </Panel>
        <Panel title="Recent transactions">
          <TransactionRows items={data.recentTransactions.slice(0, 6)} />
        </Panel>
        <Panel title="Savings goals">
          <SavingsGoals />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Investment portfolio">
          <InvestmentList items={data.investments} />
        </Panel>
        <Panel title="Your accounts">
          <ul className="divide-y divide-slate-100">
            {data.accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{a.displayName}</p>
                  <p className="text-xs text-slate-400">
                    {a.type} · •••• {a.accountNumber.slice(-4)}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-800">{formatCurrency(a.balance)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
