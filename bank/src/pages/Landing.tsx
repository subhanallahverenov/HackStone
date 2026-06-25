import { Hero, FeatureGrid, Stats, CTA } from "@/components/ui/Marketing"

export default function Landing() {
  return (
    <>
      <Hero
        eyebrow="Banking, reimagined"
        title="Money that moves at the speed of your life."
        subtitle="Open an account in minutes, send money instantly, track spending, and get guidance from Symbolic AI — all in one secure app."
      />
      <Stats
        items={[
          { value: "2M+", label: "Active customers" },
          { value: "$8B+", label: "Moved every month" },
          { value: "99.99%", label: "Platform uptime" },
          { value: "4.9★", label: "App store rating" },
        ]}
      />
      <FeatureGrid
        items={[
          { icon: "⚡", title: "Instant transfers", body: "Move money between accounts and to others in seconds, with zero domestic fees." },
          { icon: "📊", title: "Smart analytics", body: "Understand where your money goes with automatic categorization and insights." },
          { icon: "✨", title: "Symbolic AI", body: "A built-in assistant for budgeting, loans, and investment questions — in your language." },
          { icon: "🔒", title: "Bank-grade security", body: "JWT auth, MFA, account lockout, and full audit logging protect every action." },
          { icon: "💳", title: "Cards that work for you", body: "Freeze, unfreeze, and control your cards instantly from any device." },
          { icon: "📈", title: "Invest with confidence", body: "Track your portfolio and discover opportunities aligned to your goals." },
        ]}
      />
      <CTA
        title="Ready to bank smarter?"
        subtitle="Join Team5 Bank today and experience modern, secure, AI-powered banking."
      />
    </>
  )
}
