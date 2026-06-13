import { Router } from "express"
import { db } from "../lib/db.js"
import { authRequired } from "../lib/auth.js"
import { toAccountDto } from "../lib/mappers.js"

const router = Router()

router.get("/", authRequired, (req, res) => {
  const rows = db.prepare("SELECT * FROM accounts WHERE userId=? ORDER BY type").all(req.userId)
  res.json(rows.map(toAccountDto))
})

export default router
