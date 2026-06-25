import { DatabaseSync } from "node:sqlite"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { seedDatabase } from "./seed.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, "../../data")
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, "team5bank.db")
export const db = new DatabaseSync(dbPath)
db.exec("PRAGMA journal_mode = WAL;")

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  fullName TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Customer',
  mfaEnabled INTEGER NOT NULL DEFAULT 0,
  phoneNumber TEXT,
  creditScore INTEGER NOT NULL DEFAULT 720,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expiresAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountNumber TEXT NOT NULL,
  iban TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  currency TEXT NOT NULL DEFAULT 'USD',
  balance REAL NOT NULL DEFAULT 0,
  availableBalance REAL NOT NULL DEFAULT 0,
  displayName TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  balanceAfter REAL NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  merchantName TEXT,
  reference TEXT NOT NULL,
  occurredAtUtc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  averagePrice REAL NOT NULL,
  currentPrice REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS loans (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  principal REAL NOT NULL,
  outstanding REAL NOT NULL,
  interestRate REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  last4 TEXT NOT NULL,
  frozen INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  isRead INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  totalTokens INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(accountId);
CREATE INDEX IF NOT EXISTS idx_tx_time ON transactions(occurredAtUtc);
CREATE INDEX IF NOT EXISTS idx_msg_convo ON ai_messages(conversationId);
`)

const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get()
if (userCount.n === 0) {
  seedDatabase(db)
}
