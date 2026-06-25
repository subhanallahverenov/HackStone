import { Router } from "express"
import { db } from "../lib/db.js"
import { authRequired } from "../lib/auth.js"
import { toAccountDto, toTransactionDto, toInvestmentDto, round2 } from "../lib/mappers.js"

const router = Router()

router.get("/", authRequired, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.userId)
  const accounts = db.prepare("SELECT * FROM accounts WHERE userId=?").all(req.userId)
  const accountIds = accounts.map((a) => a.id)
  const investments = db.prepare("SELECT * FROM investments WHERE userId=?").all(req.userId).map(toInvestmentDto)
  const loans = db.prepare("SELECT * FROM loans WHERE userId=?").all(req.userId)

  const totalBalance = round2(accounts.reduce((s, a) => s + a.balance, 0))
  const totalInvestments = round2(investments.reduce((s, i) => s + i.marketValue, 0))
  const totalLoans = round2(loans.reduce((s, l) => s + l.outstanding, 0))

  let recentTransactions = []
  let spending = []
  if (accountIds.length) {
    const ph = accountIds.map(() => "?").join(",")
    recentTransactions = db
      .prepare(`SELECT * FROM transactions WHERE accountId IN (${ph}) ORDER BY occurredAtUtc DESC LIMIT 10`)
      .all(...accountIds)
      .map(toTransactionDto)

    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    spending = db
      .prepare(
        `SELECT category, SUM(-amount) AS total FROM transactions
         WHERE accountId IN (${ph}) AND amount < 0 AND occurredAtUtc >= ?
         GROUP BY category ORDER BY total DESC`,
      )
      .all(...accountIds, since)
      .map((r) => ({ category: r.category, total: round2(r.total) }))
  }

  const unread = db.prepare("SELECT COUNT(*) AS n FROM notifications WHERE userId=? AND isRead=0").get(req.userId).n

  res.json({
    totalBalance,
    totalInvestments,
    totalLoans,
    creditScore: user?.creditScore ?? 700,
    accounts: accounts.map(toAccountDto),
    recentTransactions,
    spending,
    investments,
    unreadNotifications: unread,
  })
})

export default router
