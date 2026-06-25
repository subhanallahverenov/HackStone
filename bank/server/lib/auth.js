import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { db } from "./db.js"

const JWT_SECRET = process.env.JWT_SECRET || "team5-dev-secret-change-me-please-0123456789"
const ACCESS_TTL_SEC = 15 * 60
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function hashPassword(pw) {
  return bcrypt.hashSync(pw, 10)
}

export function verifyPassword(pw, hash) {
  return bcrypt.compareSync(pw, hash)
}

export function toUserDto(u) {
  return { id: u.id, email: u.email, fullName: u.fullName, role: u.role, mfaEnabled: !!u.mfaEnabled }
}

function signAccessToken(user) {
  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: ACCESS_TTL_SEC })
  const expiresUtc = new Date(Date.now() + ACCESS_TTL_SEC * 1000).toISOString()
  return { token, expiresUtc }
}

function issueRefreshToken(userId) {
  const token = crypto.randomBytes(40).toString("hex")
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS).toISOString()
  db.prepare("INSERT INTO refresh_tokens (token,userId,expiresAt) VALUES (?,?,?)").run(token, userId, expiresAt)
  return token
}

export function rotateRefreshToken(oldToken) {
  if (!oldToken) return null
  const row = db.prepare("SELECT * FROM refresh_tokens WHERE token=?").get(oldToken)
  if (!row) return null
  db.prepare("DELETE FROM refresh_tokens WHERE token=?").run(oldToken)
  if (new Date(row.expiresAt).getTime() < Date.now()) return null
  return row.userId
}

export function buildAuthResponse(user) {
  const { token, expiresUtc } = signAccessToken(user)
  const refreshToken = issueRefreshToken(user.id)
  return {
    accessToken: token,
    refreshToken,
    accessTokenExpiresUtc: expiresUtc,
    user: toUserDto(user),
  }
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || ""
  const match = header.match(/^Bearer (.+)$/)
  if (!match) return res.status(401).json({ error: "Unauthorized." })
  try {
    const payload = jwt.verify(match[1], JWT_SECRET)
    req.userId = payload.sub
    req.userRole = payload.role
    next()
  } catch {
    return res.status(401).json({ error: "Session expired. Please sign in again." })
  }
}
