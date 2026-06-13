import { Router } from "express"
import { db } from "../lib/db.js"
import { authRequired } from "../lib/auth.js"
import { toTransactionDto } from "../lib/mappers.js"

const router = Router()

router.get("/", authRequired, (req, res) => {
  const accountRows = db.prepare("SELECT id FROM accounts WHERE userId=?").all(req.userId)
  const accountIds = accountRows.map((a) => a.id)
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 15))
  const search = (req.query.search || "").toString().trim()
  const category = (req.query.category || "").toString().trim()
  const accountId = (req.query.accountId || "").toString().trim()

  if (!accountIds.length) {
    return res.json({ items: [], page, pageSize, totalCount: 0, totalPages: 0 })
  }

  let ids = accountIds
  if (accountId && accountIds.includes(accountId)) ids = [accountId]

  const ph = ids.map(() => "?").join(",")
  const where = [`accountId IN (${ph})`]
  const params = [...ids]
  if (search) {
    where.push("(description LIKE ? OR merchantName LIKE ?)")
    params.push(`%${search}%`, `%${search}%`)
  }
  if (category) {
    where.push("category = ?")
    params.push(category)
  }
  const whereSql = where.join(" AND ")

  const totalCount = db.prepare(`SELECT COUNT(*) AS n FROM transactions WHERE ${whereSql}`).get(...params).n
  const items = db
    .prepare(`SELECT * FROM transactions WHERE ${whereSql} ORDER BY occurredAtUtc DESC LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize)
    .map(toTransactionDto)

  res.json({ items, page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) })
})

export default router
