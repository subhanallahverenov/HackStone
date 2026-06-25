import { Router } from "express"
import crypto from "node:crypto"
import { db } from "../lib/db.js"
import { hashPassword, verifyPassword, buildAuthResponse, rotateRefreshToken, authRequired, toUserDto } from "../lib/auth.js"

const router = Router()

function validPassword(pw) {
  return typeof pw === "string" && pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)
}

router.post("/register", (req, res) => {
  const { email, fullName, password, phoneNumber } = req.body || {}
  if (!email || typeof email !== "string" || email.length > 256 || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "A valid email is required." })
  }
  if (!fullName || typeof fullName !== "string" || fullName.length > 128) {
    return res.status(400).json({ error: "Full name is required (max 128 characters)." })
  }
  if (!validPassword(password)) {
    return res.status(400).json({ error: "Password must be at least 8 characters with upper, lower, digit, and symbol." })
  }
  const normalized = email.toLowerCase()
  const existing = db.prepare("SELECT id FROM users WHERE email=?").get(normalized)
  if (existing) return res.status(409).json({ error: "An account with this email already exists." })

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO users (id,email,fullName,passwordHash,role,mfaEnabled,phoneNumber,creditScore,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(id, normalized, fullName.trim(), hashPassword(password), "Customer", 0, phoneNumber || null, 700, now)

  // New customers start with one empty checking account.
  const accId = crypto.randomUUID()
  const accountNumber = String(Math.floor(1000000000 + Math.random() * 8999999999))
  db.prepare(
    `INSERT INTO accounts (id,userId,accountNumber,iban,type,status,currency,balance,availableBalance,displayName)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(accId, id, accountNumber, "US12TEAM5" + accountNumber, "Checking", "Active", "USD", 0, 0, "Everyday Checking")

  const user = db.prepare("SELECT * FROM users WHERE id=?").get(id)
  res.status(201).json(buildAuthResponse(user))
})

router.post("/login", (req, res) => {
  const { email, password, mfaCode } = req.body || {}
  const user = db.prepare("SELECT * FROM users WHERE email=?").get((email || "").toLowerCase())
  if (!user || !verifyPassword(password || "", user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password." })
  }
  if (user.mfaEnabled && !mfaCode) {
    return res.status(428).json({ error: "MFA_REQUIRED" })
  }
  res.json(buildAuthResponse(user))
})

router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body || {}
  const userId = rotateRefreshToken(refreshToken)
  if (!userId) return res.status(401).json({ error: "Invalid or expired refresh token." })
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(userId)
  if (!user) return res.status(401).json({ error: "Invalid refresh token." })
  res.json(buildAuthResponse(user))
})

router.get("/me", authRequired, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.userId)
  if (!user) return res.status(404).json({ error: "User not found." })
  res.json(toUserDto(user))
})

export default router
