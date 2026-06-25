import { PageHeader, FeatureGrid, Section } from "@/components/ui/Marketing"

export default function PersonalBanking() {
  return (
    <>
      <PageHeader
        title="Personal Banking"
        subtitle="Everyday accounts, savings, and tools designed around your goals — with no hidden fees."
      />
      <FeatureGrid
        items={[
          { icon: "🏦", title: "Checking accounts", body: "Fee-free everyday spending with instant notifications." },
          { icon: "💰", title: "High-yield savings", body: "Grow your balance with competitive interest and savings goals." },
          { icon: "📱", title: "Mobile-first", body: "Manage everything from a beautiful, responsive dashboard." },
        ]}
      />
      <Section>
        <div className="card">
          <h3 className="mb-2 text-lg font-bold text-slate-800">Why customers choose us</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>No monthly maintenance fees</li>
            <li>Free instant transfers between Team5 accounts</li>
            <li>Real-time spending insights and budgets</li>
            <li>24/7 support from Symbolic AI</li>
          </ul>
        </div>
      </Section>
    </>
  )
}
