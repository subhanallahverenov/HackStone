import { PageHeader, FeatureGrid, Section } from "@/components/ui/Marketing"

export default function CreditCards() {
  return (
    <>
      <PageHeader title="Credit Cards" subtitle="Premium cards with rewards, controls, and zero hidden fees." />
      <Section>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { name: "Team5 Everyday", color: "from-slate-700 to-slate-900", perk: "1% cashback on all spend" },
            { name: "Team5 Rewards", color: "from-brand-600 to-brand-900", perk: "3% on travel & dining" },
            { name: "Team5 Metal", color: "from-accent-600 to-brand-800", perk: "Airport lounges + 5% boosted" },
          ].map((c) => (
            <div key={c.name} className="card">
              <div className={`mb-4 flex h-40 flex-col justify-between rounded-xl bg-gradient-to-br ${c.color} p-4 text-white`}>
                <span className="text-sm font-semibold">Team5 Bank</span>
                <span className="tracking-widest">•••• •••• •••• 4291</span>
              </div>
              <h3 className="font-bold text-slate-800">{c.name}</h3>
              <p className="text-sm text-slate-500">{c.perk}</p>
            </div>
          ))}
        </div>
      </Section>
      <FeatureGrid
        items={[
          { icon: "❄️", title: "Freeze instantly", body: "Lock and unlock your card in one tap from Account Management." },
          { icon: "🎁", title: "Rewards", body: "Earn cashback and points on everyday purchases." },
          { icon: "🔔", title: "Real-time alerts", body: "Get notified the moment your card is used." },
        ]}
      />
    </>
  )
}
