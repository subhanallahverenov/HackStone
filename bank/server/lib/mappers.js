export const round2 = (n) => Math.round(n * 100) / 100

export function toAccountDto(a) {
  return {
    id: a.id,
    accountNumber: a.accountNumber,
    iban: a.iban,
    type: a.type,
    status: a.status,
    currency: a.currency,
    balance: a.balance,
    availableBalance: a.availableBalance,
    displayName: a.displayName,
  }
}

export function toTransactionDto(t) {
  return {
    id: t.id,
    accountId: t.accountId,
    type: t.type,
    status: t.status,
    amount: t.amount,
    currency: t.currency,
    balanceAfter: t.balanceAfter,
    description: t.description,
    category: t.category,
    merchantName: t.merchantName || undefined,
    reference: t.reference,
    occurredAtUtc: t.occurredAtUtc,
  }
}

export function toInvestmentDto(i) {
  const marketValue = round2(i.quantity * i.currentPrice)
  const unrealizedGain = round2((i.currentPrice - i.averagePrice) * i.quantity)
  return {
    id: i.id,
    type: i.type,
    symbol: i.symbol,
    name: i.name,
    quantity: i.quantity,
    averagePrice: i.averagePrice,
    currentPrice: i.currentPrice,
    marketValue,
    unrealizedGain,
  }
}

export function toAiMessageDto(m) {
  return { id: m.id, role: m.role, content: m.content, createdAtUtc: m.createdAt }
}

export function toAiConversationDto(c, messages) {
  return {
    id: c.id,
    title: c.title,
    language: c.language,
    totalTokens: c.totalTokens,
    messages: messages.map(toAiMessageDto),
  }
}
