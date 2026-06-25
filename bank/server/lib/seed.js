import bcrypt from "bcryptjs"
import crypto from "node:crypto"

const DAY = 86400000
const uuid = () => crypto.randomUUID()
const round2 = (n) => Math.round(n * 100) / 100
const isoDaysAgo = (days) => new Date(Date.now() - days * DAY).toISOString()

export function seedDatabase(db) {
  const now = new Date().toISOString()
  const userId = uuid()

  db.prepare(
    `INSERT INTO users (id,email,fullName,passwordHash,role,mfaEnabled,phoneNumber,creditScore,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?)`,
  ).run(userId, "demo@team5.bank", "Demo Customer", bcrypt.hashSync("Demo123$", 10), "Customer", 0, "+1 415 555 0100", 781, now)

  const checkingId = uuid()
  const savingsId = uuid()
  const insertAccount = db.prepare(
    `INSERT INTO accounts (id,userId,accountNumber,iban,type,status,currency,balance,availableBalance,displayName)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  )
  insertAccount.run(checkingId, userId, "1000200030", "US12TEAM50001000200030", "Checking", "Active", "USD", 0, 0, "Everyday Checking")
  insertAccount.run(savingsId, userId, "4000500060", "US12TEAM50004000500060", "Savings", "Active", "USD", 0, 0, "Premier Savings")

  const items = []
  // Monthly salary + rent (checking)
  for (let m = 2; m >= 0; m--) items.push({ acc: checkingId, days: m * 30 + 2, amount: 5400, desc: "Salary \u2014 Acme Corp", cat: "Income", type: "Credit", merchant: "Acme Corp" })
  for (let m = 2; m >= 0; m--) items.push({ acc: checkingId, days: m * 30 + 4, amount: -1650, desc: "Apartment rent", cat: "Housing", type: "Transfer", merchant: "Skyline Living" })

  const grocery = ["Whole Foods", "Trader Joe's", "Costco", "Safeway"]
  for (let w = 0; w < 11; w++) items.push({ acc: checkingId, days: w * 6 + 1, amount: -(48 + (w % 4) * 14.5), desc: "Groceries", cat: "Groceries", type: "Card", merchant: grocery[w % 4] })

  const dining = [["Dinner", -62.4, "Olive & Vine"], ["Coffee", -5.75, "Blue Bottle"], ["Lunch", -16.9, "Sweetgreen"], ["Brunch", -44.2, "The Hatch"], ["Takeout", -28.6, "Pho 88"], ["Coffee", -6.25, "Blue Bottle"], ["Dinner", -51.1, "Nopa"]]
  dining.forEach((d, i) => items.push({ acc: checkingId, days: i * 8 + 3, amount: d[1], desc: d[0], cat: "Dining", type: "Card", merchant: d[2] }))

  const transport = [["Uber ride", -18.4, "Uber"], ["Fuel", -52.3, "Shell"], ["Metro card", -30, "BART"], ["Uber ride", -23.7, "Uber"]]
  transport.forEach((t, i) => items.push({ acc: checkingId, days: i * 12 + 5, amount: t[1], desc: t[0], cat: "Transport", type: "Card", merchant: t[2] }))

  items.push({ acc: checkingId, days: 9, amount: -14.99, desc: "Spotify Premium", cat: "Subscriptions", type: "Card", merchant: "Spotify" })
  items.push({ acc: checkingId, days: 11, amount: -22.99, desc: "Netflix", cat: "Subscriptions", type: "Card", merchant: "Netflix" })
  items.push({ acc: checkingId, days: 16, amount: -89.4, desc: "Electricity bill", cat: "Utilities", type: "Transfer", merchant: "PG&E" })
  items.push({ acc: checkingId, days: 17, amount: -60.2, desc: "Internet", cat: "Utilities", type: "Transfer", merchant: "Comcast" })

  const shopping = [["Online order", -129.99, "Amazon"], ["Sneakers", -94.5, "Nike"], ["Pharmacy", -23.15, "CVS"]]
  shopping.forEach((s, i) => items.push({ acc: checkingId, days: i * 10 + 6, amount: s[1], desc: s[0], cat: "Shopping", type: "Card", merchant: s[2] }))

  // Savings
  for (let m = 2; m >= 0; m--) items.push({ acc: savingsId, days: m * 30 + 5, amount: 500, desc: "Monthly savings transfer", cat: "Transfer", type: "Transfer", merchant: null })
  items.push({ acc: savingsId, days: 2, amount: 42.18, desc: "Interest earned", cat: "Income", type: "Credit", merchant: null })

  const openings = { [checkingId]: 2400, [savingsId]: 14000 }
  const insertTx = db.prepare(
    `INSERT INTO transactions (id,accountId,type,status,amount,currency,balanceAfter,description,category,merchantName,reference,occurredAtUtc)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
  const byAcc = {}
  for (const it of items) (byAcc[it.acc] ||= []).push(it)
  for (const acc of Object.keys(byAcc)) {
    const list = byAcc[acc].sort((a, b) => b.days - a.days) // oldest first
    let bal = openings[acc] ?? 0
    for (const it of list) {
      bal = round2(bal + it.amount)
      const id = uuid()
      insertTx.run(id, acc, it.type, "Completed", round2(it.amount), "USD", bal, it.desc, it.cat, it.merchant || null, "TXN" + id.slice(0, 8).toUpperCase(), isoDaysAgo(it.days))
    }
    db.prepare("UPDATE accounts SET balance=?, availableBalance=? WHERE id=?").run(bal, bal, acc)
  }

  const investments = [
    ["ETF", "VWRL", "Vanguard FTSE All-World", 35, 92.4, 101.8],
    ["Stock", "AAPL", "Apple Inc.", 12, 168.5, 192.3],
    ["Bond", "GOVT", "iShares US Treasury Bond", 40, 24.1, 23.6],
  ]
  const insertInv = db.prepare(
    `INSERT INTO investments (id,userId,type,symbol,name,quantity,averagePrice,currentPrice) VALUES (?,?,?,?,?,?,?,?)`,
  )
  investments.forEach((v) => insertInv.run(uuid(), userId, v[0], v[1], v[2], v[3], v[4], v[5]))

  db.prepare(
    `INSERT INTO loans (id,userId,type,principal,outstanding,interestRate,status) VALUES (?,?,?,?,?,?,?)`,
  ).run(uuid(), userId, "Auto", 28000, 15240.5, 4.9, "Active")

  db.prepare(`INSERT INTO cards (id,userId,type,last4,frozen) VALUES (?,?,?,?,?)`).run(uuid(), userId, "Debit", "4291", 0)

  const insertNote = db.prepare(
    `INSERT INTO notifications (id,userId,title,body,isRead,createdAt) VALUES (?,?,?,?,?,?)`,
  )
  insertNote.run(uuid(), userId, "Welcome to Team5 Bank", "Your demo account is ready. Explore the dashboard and Symbolic AI!", 0, now)
  insertNote.run(uuid(), userId, "Security tip", "Enable multi-factor authentication in Account settings for extra protection.", 0, now)

  console.log("[seed] Demo data created \u2014 login with demo@team5.bank / Demo123$")
}
