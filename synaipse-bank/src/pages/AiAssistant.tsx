import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/apiClient"
import type { AiConversationDto } from "@/types"

const LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "az", label: "Azərbaycan" },
]

const SUGGESTIONS = [
  "How much did I spend on dining this month?",
  "Recommend a budget based on my spending.",
  "Am I eligible for a personal loan?",
  "How should I diversify my investments?",
]

export default function AiAssistant() {
  const [conversations, setConversations] = useState<AiConversationDto[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [language, setLanguage] = useState("en")
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function load() {
    try {
      const res = await api.get<AiConversationDto[]>("/ai/conversations")
      setConversations(res.data)
      if (!activeId && res.data.length) setActiveId(res.data[0].id)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const active = conversations.find((c) => c.id === activeId) ?? null

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [active])

  async function send(message: string) {
    const text = message.trim()
    if (!text || busy) return
    setInput("")
    setBusy(true)
    try {
      const payload = { conversationId: activeId, message: text, language }
      const res = await api.post<AiConversationDto>("/ai/chat", payload)
      setActiveId(res.data.id)
      setConversations((prev) => {
        const others = prev.filter((c) => c.id !== res.data.id)
        return [res.data, ...others]
      })
    } finally {
      setBusy(false)
    }
  }

  function startNew() {
    setActiveId(null)
  }

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-4 lg:grid-cols-4">
      <aside className="card hidden flex-col lg:flex">
        <button className="btn-primary mb-3" onClick={startNew}>
          + New chat
        </button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`block w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
                c.id === activeId ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c.title || "Conversation"}
            </button>
          ))}
          {!conversations.length && <p className="px-3 text-xs text-slate-400">No conversations yet.</p>}
        </div>
      </aside>

      <section className="card col-span-1 flex flex-col lg:col-span-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h2 className="font-bold text-slate-800">Symbolic AI</h2>
              <p className="text-xs text-slate-400">Financial assistant · tokens used: {active?.totalTokens ?? 0}</p>
            </div>
          </div>
          <select className="input w-36" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4">
          {!active && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Ask anything about your money. Try:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full bg-white px-3 py-1.5 text-xs text-brand-700 ring-1 ring-slate-200 hover:bg-brand-50">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {active?.messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && <p className="text-xs text-slate-400">Symbolic AI is typing…</p>}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="input"
            placeholder="Message Symbolic AI…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
          />
          <button className="btn-primary" onClick={() => send(input)} disabled={busy}>
            Send
          </button>
        </div>
      </section>
    </div>
  )
}
