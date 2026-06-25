import { useState } from "react"
import { PageHeader, FeatureGrid, Section } from "@/components/ui/Marketing"
import { formatCurrency } from "@/lib/format"

export default function Loans() {
  const [amount, setAmount] = useState(10000)
  const [months, setMonths] = useState(36)
  const rate = 0.069
  const monthly = (amount * (rate / 12)) / (1 - Math.pow(1 + rate / 12, -months))

  return (
    <>
      <PageHeader title="Loans" subtitle="Personal, auto, and home loans with transparent rates and instant decisions." />
      <Section>
        <div className="card max-w-xl">
          <h3 className="mb-4 font-bold text-slate-800">Loan calculator</h3>
          <label className="label">Amount: {formatCurrency(amount)}</label>
          <input type="range" min={1000} max={50000} step={500} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full" />
          <label className="label mt-4">Term: {months} months</label>
          <input type="range" min={6} max={72} step={6} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full" />
          <div className="mt-5 rounded-xl bg-brand-50 p-4">
            <p className="text-sm text-slate-500">Estimated monthly payment</p>
            <p className="text-2xl font-bold text-brand-700">{formatCurrency(monthly)}</p>
            <p className="mt-1 text-xs text-slate-400">Representative APR 6.9%. For illustration only.</p>
          </div>
        </div>
      </Section>
      <FeatureGrid
        items={[
          { icon: "⚡", title: "Instant decisions", body: "Get a decision in minutes with no impact on your credit score to check." },
          { icon: "📉", title: "Low rates", body: "Competitive fixed rates with no early repayment penalties." },
          { icon: "🤖", title: "AI guidance", body: "Symbolic AI recommends a loan that fits your budget." },
        ]}
      />
    </>
  )
}
