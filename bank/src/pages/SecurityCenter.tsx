import { PageHeader, FeatureGrid, Section } from "@/components/ui/Marketing"

export default function SecurityCenter() {
  return (
    <>
      <PageHeader
        title="Security Center"
        subtitle="Your money and data are protected by layered, bank-grade security at every step."
      />
      <FeatureGrid
        items={[
          { icon: "🔑", title: "JWT + refresh tokens", body: "Short-lived access tokens with secure rotation keep sessions safe." },
          { icon: "🔐", title: "MFA", body: "Add a second factor to protect against unauthorized access." },
          { icon: "🚫", title: "Account lockout", body: "Automatic lockout after repeated failed sign-in attempts." },
          { icon: "🧾", title: "Audit logging", body: "Every sensitive action is recorded for full traceability." },
          { icon: "✅", title: "Input validation", body: "Server-side validation guards against malformed and malicious input." },
          { icon: "🛡️", title: "Rate limiting & CSRF", body: "Abuse protection and anti-CSRF defenses on every endpoint." },
        ]}
      />
      <Section>
        <div className="card">
          <h3 className="mb-2 font-bold text-slate-800">Report a security concern</h3>
          <p className="text-sm text-slate-600">
            If you notice anything suspicious, freeze your cards from Account Management and contact support immediately.
          </p>
        </div>
      </Section>
    </>
  )
}
