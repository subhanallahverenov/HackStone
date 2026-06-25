import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { api } from "@/lib/apiClient"
import type { AccountDto, TransactionDto } from "@/types"
import { formatCurrency } from "@/lib/format"

async function fetchAccounts(): Promise<AccountDto[]> {
  const res = await api.get<AccountDto[]>("/accounts")
  return res.data
}

export default function MoneyTransfer() {
  const qc = useQueryClient()
  const { data: accounts } = useQuery({ queryKey: ["accounts"], queryFn: fetchAccounts })
  const [fromAccountId, setFromAccountId] = useState("")
  const [toAccountNumber, setToAccountNumber] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fromAccountId: fromAccountId || accounts?.[0]?.id,
        toAccountNumber,
        amount: Number(amount),
        description: description || undefined,
      }
      const res = await api.post<TransactionDto>("/transfers", payload)
      return res.data
    },
    onSuccess: (tx) => {
      setSuccess(`Transfer of ${formatCurrency(Math.abs(tx.amount))} completed. Ref ${tx.reference}.`)
      setError(null)
      setToAccountNumber("")
      setAmount("")
      setDescription("")
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      qc.invalidateQueries({ queryKey: ["accounts"] })
      qc.invalidateQueries({ queryKey: ["transactions"] })
    },
    onError: (err) => {
      const ax = err as AxiosError<{ error?: string }>
      setError(ax.response?.data?.error ?? "Transfer failed.")
      setSuccess(null)
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="max-w-xl space-y-5">
      <h2 className="text-xl font-bold text-slate-800">Money transfer</h2>
      {success && <div className="rounded-lg bg-accent-500/10 px-3 py-2 text-sm text-accent-600">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">From account</label>
          <select className="input" value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName} · {formatCurrency(a.availableBalance)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Recipient account number</label>
          <input className="input" value={toAccountNumber} onChange={(e) => setToAccountNumber(e.target.value)} required placeholder="e.g. 4000500060" />
        </div>
        <div>
          <label className="label">Amount</label>
          <input className="input" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Sending…" : "Send money"}
        </button>
      </form>
      <p className="text-xs text-slate-400">Tip: transfer to your savings account 4000500060 to see an internal credit.</p>
    </div>
  )
}
