import { Router } from "express"
import crypto from "node:crypto"
import { db } from "../lib/db.js"
import { authRequired } from "../lib/auth.js"
import { toTransactionDto, round2 } from "../lib/mappers.js"

const router = Router()

router.post("/", authRequired, (req, res) => {
  const { fromAccountId, toAccountNumber, amount, description } = req.body || {}
  const amt = Number(amount)
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: "Amount must be greater than zero." })
  }
  const from = db.prepare("SELECT * FROM accounts WHERE id=? AND userId=?").get(fromAccountId, req.userId)
  if (!from) return res.status(400).json({ error: "Source account not found." })
  if (from.availableBalance < amt) return res.status(400).json({ error: "Insufficient funds." })

  const recipientNumber = (toAccountNumber || "").toString().trim()
  if (!recipientNumber) return res.status(400).json({ error: "Recipient account number is required." })
  const to = db.prepare("SELECT * FROM accounts WHERE accountNumber=?").get(recipientNumber)

  const now = new Date().toISOString()
  const reference = "TRF" + Date.now().toString(36).toUpperCase()
  const insertTx = db.prepare(
    `INSERT INTO transactions (id,accountId,type,status,amount,currency,balanceAfter,description,category,merchantName,reference,occurredAtUtc)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  )

  let debitId
  db.exec("BEGIN")
  try {
    const newFrom = round2(from.balance - amt)
    db.prepare("UPDATE accounts SET balance=?, availableBalance=? WHERE id=?").run(newFrom, newFrom, from.id)
    debitId = crypto.randomUUID()
    insertTx.run(debitId, from.id, "Transfer", "Completed", round2(-amt), from.currency, newFrom, description || `Transfer to ${recipientNumber}`, "Transfer", null, reference, now)

    if (to && to.id !== from.id) {
      const newTo = round2(to.balance + amt)
      db.prepare("UPDATE accounts SET balance=?, availableBalance=? WHERE id=?").run(newTo, newTo, to.id)
      insertTx.run(crypto.randomUUID(), to.id, "Transfer", "Completed", round2(amt), to.currency, newTo, description || `Transfer from ${from.accountNumber}`, "Transfer", null, reference, now)
    }
    db.exec("COMMIT")
  } catch (e) {
    db.exec("ROLLBACK")
    throw e
  }
  const created = db.prepare("SELECT * FROM transactions WHERE id=?").get(debitId)
  res.status(201).json(toTransactionDto(created))
})

export default router
