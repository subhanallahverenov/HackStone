import { PageHeader, FeatureGrid, Section } from "@/components/ui/Marketing"

export default function Investments() {
  return (
    <>
      <PageHeader title="Investments" subtitle="Build long-term wealth with diversified portfolios and clear, low fees." />
      <FeatureGrid
        items={[
          { icon: "📈", title: "Diversified portfolios", body: "Ready-made ETF and bond portfolios matched to your risk profile." },
          { icon: "🔍", title: "Transparent fees", body: "Know exactly what you pay — no surprises, no hidden charges." },
          { icon: "✨", title: "AI insights", body: "Symbolic AI surfaces opportunities aligned with your goals." },
        ]}
      />
      <Section>
        <div className="card">
          <p className="text-sm text-slate-600">
            Investing involves risk, including possible loss of principal. This is a demonstration platform and does not
            offer real investment products.
          </p>
        </div>
      </Section>
    </>
  )
}
