import { useState } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { api } from "@/lib/apiClient"
import type { PagedResult, TransactionDto } from "@/types"
import { formatCurrency, formatDate } from "@/lib/format"

async function fetchTransactions(params: { search: string; page: number }): Promise<PagedResult<TransactionDto>> {
  const res = await api.get<PagedResult<TransactionDto>>("/transactions", {
    params: { search: params.search || undefined, page: params.page, pageSize: 15 },
  })
  return res.data
}

export default function TransactionHistory() {
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", debounced, page],
    queryFn: () => fetchTransactions({ search: debounced, page }),
    placeholderData: keepPreviousData,
  })

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setDebounced(search)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Transaction history</h2>
        <form onSubmit={onSearch} className="flex gap-2">
          <input
            className="input w-64"
            placeholder="Search description or merchant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-primary" type="submit">
            Search
          </button>
        </form>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={5}>
                  Loading…
                </td>
              </tr>
            )}
            {data?.items.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{formatDate(t.occurredAtUtc)}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{t.description}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t.category}</span>
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${t.amount >= 0 ? "text-accent-600" : "text-slate-700"}`}>
                  {t.amount >= 0 ? "+" : ""}
                  {formatCurrency(t.amount)}
                </td>
                <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(t.balanceAfter)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {data.page} of {Math.max(1, data.totalPages)} · {data.totalCount} transactions
          </span>
          <div className="flex gap-2">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button className="btn-ghost" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
