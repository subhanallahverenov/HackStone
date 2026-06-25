import { Router } from "express"
import crypto from "node:crypto"
import { db } from "../lib/db.js"
import { authRequired } from "../lib/auth.js"
import { toAiConversationDto } from "../lib/mappers.js"
import { generateReply, estimateTokens } from "../lib/ai.js"

const router = Router()
const SUPPORTED = ["en", "es", "fr", "az"]

router.get("/conversations", authRequired, (req, res) => {
  const convos = db.prepare("SELECT * FROM ai_conversations WHERE userId=? ORDER BY updatedAt DESC").all(req.userId)
  const result = convos.map((c) => {
    const msgs = db.prepare("SELECT * FROM ai_messages WHERE conversationId=? ORDER BY createdAt ASC").all(c.id)
    return toAiConversationDto(c, msgs)
  })
  res.json(result)
})

router.post("/chat", authRequired, async (req, res) => {
  const { conversationId, message, language } = req.body || {}
  const text = (message || "").toString().trim()
  if (!text) return res.status(400).json({ error: "Message is required." })
  const lang = SUPPORTED.includes(language) ? language : "en"
  const now = new Date().toISOString()

  let convo = conversationId
    ? db.prepare("SELECT * FROM ai_conversations WHERE id=? AND userId=?").get(conversationId, req.userId)
    : null
  if (!convo) {
    const id = crypto.randomUUID()
    const title = text.length > 40 ? text.slice(0, 40) + "\u2026" : text
    db.prepare(
      `INSERT INTO ai_conversations (id,userId,title,language,totalTokens,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`,
    ).run(id, req.userId, title, lang, 0, now, now)
    convo = db.prepare("SELECT * FROM ai_conversations WHERE id=?").get(id)
  }

  const insertMsg = db.prepare(
    `INSERT INTO ai_messages (id,conversationId,role,content,tokens,createdAt) VALUES (?,?,?,?,?,?)`,
  )
  insertMsg.run(crypto.randomUUID(), convo.id, "user", text, estimateTokens(text), now)

  // History window (last 12 messages, excluding the just-added user message for the model call).
  const history = db
    .prepare("SELECT role, content FROM ai_messages WHERE conversationId=? ORDER BY createdAt ASC")
    .all(convo.id)
    .slice(-12)
    .slice(0, -1)

  const accounts = db.prepare("SELECT displayName, balance, currency FROM accounts WHERE userId=?").all(req.userId)
  const context = accounts.length
    ? " Customer accounts: " + accounts.map((a) => `${a.displayName} ${a.balance} ${a.currency}`).join("; ") + "."
    : ""

  const { content, tokens } = await generateReply({ history, message: text, language: lang, context })

  const after = new Date().toISOString()
  insertMsg.run(crypto.randomUUID(), convo.id, "assistant", content, tokens || 0, after)
  const newTotal = (convo.totalTokens || 0) + estimateTokens(text) + (tokens || 0)
  db.prepare("UPDATE ai_conversations SET totalTokens=?, updatedAt=?, language=? WHERE id=?").run(newTotal, after, lang, convo.id)

  const fresh = db.prepare("SELECT * FROM ai_conversations WHERE id=?").get(convo.id)
  const msgs = db.prepare("SELECT * FROM ai_messages WHERE conversationId=? ORDER BY createdAt ASC").all(convo.id)
  res.json(toAiConversationDto(fresh, msgs))
})

export default router
