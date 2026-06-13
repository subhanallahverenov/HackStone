import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { api } from "@/lib/apiClient"
import type { AiConversationDto } from "@/types"

const LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "az", label: "Azərbaycan" },
]

const STORAGE_KEY = "t5_ai_conversation_id"

const panelInitial = { opacity: 0, y: 24, scale: 0.96 }
const panelAnimate = { opacity: 1, y: 0, scale: 1 }
const panelExit = { opacity: 0, y: 24, scale: 0.96 }
const panelTransition = { duration: 0.18 }

const GREETING = "Hi! I'm Symbolic AI. Ask me about transfers, spending, budgeting, loans, or investments."

interface ChatLine {
  role: string
  content: string
}

function normalizeRole(role: string): string {
  return (role || "").toLowerCase()
}

export function SymbolicAI() {
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState("en")
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY))
  const [lines, setLines] = useState<ChatLine[]>([{ role: "assistant", content: GREETING }])
  const scrollRef = useRef<HTMLDivElement>(null)
  const restoredRef = useRef(false)

  // Restore prior conversation once, the first time the panel is opened.
  useEffect(() => {
    if (!open || restoredRef.current) return
    restoredRef.current = true
    const storedId = localStorage.getItem(STORAGE_KEY)
    if (!storedId) return
    api
      .get<AiConversationDto[]>("/ai/conversations")
      .then((res) => {
        const found = res.data.find((c) => c.id === storedId)
        if (found && found.messages.length) {
          setConversationId(found.id)
          const restored = found.messages
            .filter((m) => normalizeRole(m.role) !== "system")
            .map((m) => ({ role: normalizeRole(m.role), content: m.content }))
          if (restored.length) setLines(restored)
        }
      })
      .catch(() => undefined)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [lines, open, busy])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput("")
    // Optimistically show the user's message; never overwrite earlier lines.
    setLines((prev) => [...prev, { role: "user", content: text }])
    setBusy(true)
    try {
      const payload = { conversationId, message: text, language }
      const res = await api.post<AiConversationDto>("/ai/chat", payload)
      if (res.data?.id) {
        setConversationId(res.data.id)
        localStorage.setItem(STORAGE_KEY, res.data.id)
      }
      // Append only the assistant's newest reply.
      const msgs = res.data?.messages ?? []
      const lastAssistant = [...msgs].reverse().find((m) => normalizeRole(m.role) === "assistant")
      const replyText = lastAssistant?.content?.trim() || "(no response)"
      setLines((prev) => [...prev, { role: "assistant", content: replyText }])
    } catch {
      setLines((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't reach the assistant. Please try again." }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-2xl text-white shadow-lg transition hover:scale-105"
        aria-label="Open Symbolic AI"
      >
        ✨
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-24 right-6 z-40 flex h-[32rem] w-[22rem] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
          >
            <div className="flex items-center justify-between bg-brand-700 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <p className="text-sm font-semibold leading-tight">Symbolic AI</p>
                  <p className="text-[11px] text-brand-100">Your financial assistant</p>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded bg-brand-600 px-1.5 py-1 text-xs text-white outline-none"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
              {lines.map((line, i) => (
                <div key={i} className={`flex ${line.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                      line.role === "user"
                        ? "bg-brand-600 text-white"
                        : "bg-white text-slate-700 ring-1 ring-slate-200"
                    }`}
                  >
                    {line.content}
                  </div>
                </div>
              ))}
              {busy && <div className="text-xs text-slate-400">Symbolic AI is typing…</div>}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-200 p-2">
              <input
                className="input"
                placeholder="Ask Symbolic AI…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button className="btn-primary px-3" onClick={send} disabled={busy}>
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
