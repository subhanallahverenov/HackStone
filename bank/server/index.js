import "dotenv/config"
import express from "express"
import cors from "cors"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

// Importing db initializes the SQLite schema and seeds demo data on first run.
import "./lib/db.js"
import authRoutes from "./routes/auth.js"
import accountRoutes from "./routes/accounts.js"
import dashboardRoutes from "./routes/dashboard.js"
import transactionRoutes from "./routes/transactions.js"
import transferRoutes from "./routes/transfers.js"
import aiRoutes from "./routes/ai.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: "1mb" }))

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }))

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/accounts", accountRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/transfers", transferRoutes)
app.use("/api/ai", aiRoutes)

// Serve the built React app (after `npm run build`) so everything runs on one port.
const distDir = path.resolve(__dirname, "../dist")
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next()
    res.sendFile(path.join(distDir, "index.html"))
  })
} else {
  app.get("/", (req, res) =>
    res.json({
      message: "Team5 Bank API is running. The frontend is served after `npm run build`. In dev, open http://localhost:5173",
    }),
  )
}

// Central error handler
app.use((err, req, res, next) => {
  console.error("[error]", err)
  res.status(500).json({ error: "Internal server error." })
})

app.listen(PORT, () => {
  console.log("\n  \u2728 Team5 Bank is running")
  console.log(`     \u2192 App + API: http://localhost:${PORT}`)
  console.log(`     \u2192 Dev (hot reload) frontend: http://localhost:5173`)
  console.log("     \u2192 Demo login: demo@team5.bank / Demo123$\n")
})
