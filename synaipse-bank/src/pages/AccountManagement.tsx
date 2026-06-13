import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/apiClient"
import type { AccountDto } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { formatCurrency } from "@/lib/format"

async function fetchAccounts(): Promise<AccountDto[]> {
  const res = await api.get<AccountDto[]>("/accounts")
  return res.data
}

export default function AccountManagement() {
  const { user } = useAuth()
  const { data: accounts, isLoading } = useQuery({ queryKey: ["accounts"], queryFn: fetchAccounts })
  const [cardFrozen, setCardFrozen] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfaEnabled ?? false)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Account management</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-800">Profile</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-700">{user?.fullName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-700">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium text-slate-700">{user?.role}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-800">Security</h3>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Multi-factor authentication</p>
              <p className="text-xs text-slate-400">Add a second factor for extra protection.</p>
            </div>
            <button className={mfaEnabled ? "btn-primary" : "btn-ghost"} onClick={() => setMfaEnabled((v) => !v)}>
              {mfaEnabled ? "Enabled" : "Enable"}
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Freeze cards</p>
              <p className="text-xs text-slate-400">Instantly block all card spending.</p>
            </div>
            <button className={cardFrozen ? "btn-primary" : "btn-ghost"} onClick={() => setCardFrozen((v) => !v)}>
              {cardFrozen ? "Frozen" : "Freeze"}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold text-slate-800">Accounts</h3>
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {accounts?.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{a.displayName}</p>
                  <p className="text-xs text-slate-400">
                    {a.type} · {a.iban} · {a.status}
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-800">{formatCurrency(a.balance)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
