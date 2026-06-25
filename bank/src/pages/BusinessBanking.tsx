import { PageHeader, FeatureGrid, Section } from "@/components/ui/Marketing"

export default function BusinessBanking() {
  return (
    <>
      <PageHeader
        title="Business Banking"
        subtitle="Powerful accounts, payments, and cash-flow tools to help your business grow."
      />
      <FeatureGrid
        items={[
          { icon: "💼", title: "Business accounts", body: "Multi-user access with role-based permissions and approvals." },
          { icon: "🧾", title: "Invoicing & payments", body: "Send invoices and accept payments with automatic reconciliation." },
          { icon: "📊", title: "Cash-flow insights", body: "Forecast and monitor cash flow with real-time dashboards." },
        ]}
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="mb-2 font-bold text-slate-800">Scale with confidence</h3>
            <p className="text-sm text-slate-600">From sole traders to growing teams, our tiered plans grow with you.</p>
          </div>
          <div className="card">
            <h3 className="mb-2 font-bold text-slate-800">Integrations</h3>
            <p className="text-sm text-slate-600">Connect accounting tools and automate payouts with our secure API.</p>
          </div>
        </div>
      </Section>
    </>
  )
}
