// Symbolic AI: uses an OpenAI-compatible provider when OPENAI_API_KEY is set,
// otherwise falls back to a built-in offline mock so the app works with zero setup.

export const estimateTokens = (text) => Math.max(1, Math.ceil((text || "").length / 4))

const LANG_NAME = { en: "English", es: "Spanish", fr: "French", az: "Azerbaijani" }

const SYSTEM_PROMPT =
  "You are Symbolic AI, the friendly and concise financial assistant for SynAIpse Bank. " +
  "Help with transfers, spending insights, budgeting, loans, savings, and investments. " +
  "Be practical and reassuring. Never invent exact balances unless they are provided to you. Keep answers short."

export async function generateReply({ history, message, language, context }) {
  const apiKey = process.env.OPENAI_API_KEY
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
  const langName = LANG_NAME[language] || "English"

  if (apiKey) {
    try {
      const messages = [
        { role: "system", content: `${SYSTEM_PROMPT} Always respond in ${langName}.${context || ""}` },
        ...history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
        { role: "user", content: message },
      ]
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, max_tokens: 600, temperature: 0.4 }),
      })
      if (!resp.ok) {
        const detail = await resp.text()
        console.error(`[AI] provider ${resp.status}: ${detail.slice(0, 300)}`)
        return { content: mockReply(message, language), tokens: estimateTokens(message) }
      }
      const data = await resp.json()
      const content = data?.choices?.[0]?.message?.content?.trim()
      const tokens = data?.usage?.total_tokens ?? estimateTokens(message + (content || ""))
      return { content: content || mockReply(message, language), tokens }
    } catch (err) {
      console.error("[AI] request failed:", err?.message)
      return { content: mockReply(message, language), tokens: estimateTokens(message) }
    }
  }

  // SynAIpse tinyllama chatbot
  try {
    const resp = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
    if (resp.ok) {
      const data = await resp.json()
      if (data.reply) return { content: data.reply, tokens: estimateTokens(message + data.reply) }
    }
  } catch (_) {}

  return { content: mockReply(message, language), tokens: estimateTokens(message) }
}

function topicOf(msg) {
  const m = (msg || "").toLowerCase()
  if (/(transfer|send money|move money|pay|göndər|köçür)/.test(m)) return "transfer"
  if (/(spend|spent|spending|budget|xərc|büdcə)/.test(m)) return "spending"
  if (/(loan|borrow|credit|kredit|borc)/.test(m)) return "loan"
  if (/(invest|stock|portfolio|diversif|səhm|investisiya)/.test(m)) return "invest"
  if (/(save|saving|goal|yığım|qənaət)/.test(m)) return "saving"
  if (/(balance|how much|nə qədər|balans)/.test(m)) return "balance"
  if (/(card|freeze|kart|dondur)/.test(m)) return "card"
  if (/(hi|hello|hey|salam)/.test(m)) return "greeting"
  return "default"
}

const REPLIES = {
  en: {
    greeting: "Hi! I'm Symbolic AI. I can help with transfers, spending, budgeting, loans, savings, and investments. What would you like to do?",
    transfer: "To send money, open Transfer, pick the source account, enter the recipient's account number and the amount. Internal transfers are instant and you'll get a reference number.",
    spending: "Your biggest categories are usually groceries, dining, and housing. Check the dashboard spending chart for the last 30 days — a good rule is to keep needs under 50% of income.",
    loan: "Based on a healthy credit score and steady income, you'd typically qualify for a personal loan. Keep total debt payments under ~35% of monthly income for comfortable approval.",
    invest: "A simple diversified mix is broad global equity (like VWRL), a few individual stocks, and some bonds for stability. Invest regularly and avoid timing the market.",
    saving: "Try automating a fixed monthly transfer to savings right after payday, and aim for a 3–6 month emergency fund. Even small recurring amounts compound nicely.",
    balance: "You can see live balances on the dashboard and in Accounts. I can guide you, but always trust the figures shown there.",
    card: "You can freeze a card instantly from Account management if it's lost. Unfreezing is just as quick once you find it.",
    default: "I can help with transfers, spending insights, budgeting, loans, savings, and investments. Could you tell me a bit more about what you need?",
  },
  az: {
    greeting: "Salam! Mən Symbolic AI-yam. Köçürmələr, xərclər, büdcə, kreditlər, yığım və investisiyalarda kömək edə bilərəm. Nə etmək istəyirsiniz?",
    transfer: "Pul göndərmək üçün Köçürmə bölməsini açın, mənbə hesabı seçin, alıcının hesab nömrəsini və məbləği daxil edin. Daxili köçürmələr anidir və istinad nömrəsi alırsınız.",
    spending: "Ən böyük xərc kateqoriyalarınız adətən ərzaq, restoran və mənzildir. Son 30 günün xərc qrafikinə dashboard-da baxa bilərsiniz.",
    loan: "Yaxşı kredit reytinqi və sabit gəlirlə, adətən şəxsi kredit ala bilərsiniz. Borc ödənişlərini aylıq gəlirin 35%-dən aşağı saxlayın.",
    invest: "Sadə diversifikasiya: qlobal səhmlər (məs. VWRL), bir neçə fərdi səhm və sabitlik üçün istiqrazlar. Müntəzəm investisiya edin.",
    saving: "Maaş günündən dərhal sonra yığıma sabit aylıq köçürməni avtomatlaşdırın və 3-6 aylıq ehtiyat fondu hədəfləyin.",
    balance: "Canlı balansları dashboard və Hesablar bölməsində görə bilərsiniz. Həmişə orada göstərilən rəqəmlərə etibar edin.",
    card: "Kartı itirsəniz, Hesab idarəetməsindən dərhal dondura bilərsiniz. Tapılan kimi yenidən aktivləşdirmək də asandır.",
    default: "Köçürmələr, xərclər, büdcə, kreditlər, yığım və investisiyalarda kömək edə bilərəm. Bir az daha ətraflı deyə bilərsiniz?",
  },
}

function mockReply(message, language) {
  const dict = REPLIES[language] || REPLIES.en
  return dict[topicOf(message)] || dict.default
}
