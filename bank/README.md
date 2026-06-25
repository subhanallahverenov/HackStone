# Team5 Bank — Node.js Edition

A full-stack digital banking demo. **No .NET, no Docker, no SQL Server.**
React 19 + Vite frontend, Node.js + Express backend, and an embedded **SQLite** database — all started with a single command.

---

## Quick start

```bash
npm install
npm start
```

Then open **http://localhost:4000**

Demo login:

```
email:    demo@team5.bank
password: Demo123$
```

That's it. `npm start` builds the React app and launches the API + app on one port. The SQLite database is created and seeded automatically on first run (file: `data/team5bank.db`).

---

## Development mode (hot reload)

```bash
npm run dev
```

- Frontend (Vite, hot reload): http://localhost:5173
- API (Express): http://localhost:4000
- Vite proxies `/api` to the Express server automatically.

---

## AI assistant (Symbolic AI)

Works out of the box with a built-in **offline mock** (no key, no internet needed) that answers in English, Spanish, French, and Azerbaijani.

To plug in **real AI**, copy `.env.example` to `.env` and fill it in:

```bash
cp .env.example .env
```

```ini
# Free option — Groq (no credit card):
OPENAI_API_KEY=gsk_your_key_here
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
```

Get a free Groq key at https://console.groq.com/keys. Any OpenAI-compatible endpoint works (OpenAI, Groq, OpenRouter, local LLMs). If the provider fails or has no quota, the assistant automatically falls back to the offline mock — it never breaks.

---

## Project structure

```
team5-bank-node/
  index.html              # Vite entry
  vite.config.ts          # dev proxy -> :4000
  tailwind.config.js
  src/                    # React app (premium UI)
    pages/  components/  context/  lib/  types/
  server/
    index.js              # Express app (serves API + built frontend)
    lib/
      db.js               # SQLite schema + init
      seed.js             # demo data
      auth.js             # JWT + bcrypt + refresh tokens
      ai.js               # OpenAI-compatible client + offline mock
      mappers.js          # row -> DTO mappers
    routes/
      auth.js  accounts.js  dashboard.js
      transactions.js  transfers.js  ai.js
  data/                   # SQLite db file (auto-created)
```

---

## API

All under `/api`. Auth uses JWT Bearer access tokens + refresh tokens.

| Method | Route | Description |
| ------ | ----- | ----------- |
| POST | `/auth/register` | Create account `{ email, fullName, password, phoneNumber? }` |
| POST | `/auth/login` | `{ email, password, mfaCode? }` |
| POST | `/auth/refresh` | `{ refreshToken }` |
| GET  | `/auth/me` | Current user |
| GET  | `/accounts` | User accounts |
| GET  | `/dashboard` | Balances, recent activity, spending, investments |
| GET  | `/transactions?search&category&accountId&page&pageSize` | Paged transactions |
| POST | `/transfers` | `{ fromAccountId, toAccountNumber, amount, description? }` |
| POST | `/ai/chat` | `{ conversationId, message, language }` |
| GET  | `/ai/conversations` | Conversation history |
| GET  | `/health` | Health check |

---

## Reset the database

Delete the SQLite file and restart — it will be re-seeded:

```bash
rm -rf data/team5bank.db data/team5bank.db-wal data/team5bank.db-shm
npm start
```

## Tech stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, React Query, React Router, Framer Motion, Chart.js, Axios
- **Backend:** Node.js, Express, better-sqlite3, jsonwebtoken, bcryptjs
- **Database:** SQLite (embedded, file-based)
