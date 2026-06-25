import { useState } from "react"
import { PageHeader, Section } from "@/components/ui/Marketing"

export default function ContactUs() {
  const [sent, setSent] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      <PageHeader title="Contact Us" subtitle="We're here 24/7. Reach our team or chat with Symbolic AI any time." />
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            {sent ? (
              <div className="py-10 text-center">
                <p className="text-2xl">✅</p>
                <h3 className="mt-2 font-bold text-slate-800">Message sent</h3>
                <p className="text-sm text-slate-500">Our team will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input className="input" required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" required />
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea className="input" rows={4} required />
                </div>
                <button className="btn-primary w-full" type="submit">
                  Send message
                </button>
              </form>
            )}
          </div>
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-bold text-slate-800">Support</h3>
              <p className="text-sm text-slate-500">support@team5.bank · +1 (555) 0100</p>
            </div>
            <div className="card">
              <h3 className="font-bold text-slate-800">Headquarters</h3>
              <p className="text-sm text-slate-500">100 Financial Plaza, Suite 5, Metropolis</p>
            </div>
            <div className="card">
              <h3 className="font-bold text-slate-800">Hours</h3>
              <p className="text-sm text-slate-500">Online support available 24/7</p>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
