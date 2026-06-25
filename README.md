<img width="1905" height="916" alt="image" src="https://github.com/user-attachments/assets/708799d7-1de5-41ce-9023-533745f8dd68" />

# SynAIpse VulnLab

**An end‑to‑end LLM‑security demonstration lab.** It pairs a *deliberately vulnerable* AI banking
assistant with **SynAIpse Scanner** — an analyst‑friendly red‑team console built around
[garak](https://github.com/NVIDIA/garak) — so you can launch real prompt‑injection / jailbreak /
data‑leakage attacks against a live target, score its resilience (A–F), prove a guardrail works with
a before/after comparison, and export a branded PDF/HTML report.

> ⚠️ **This project is intentionally insecure.** The `vuln-chatbot` target plants secrets in its
> system prompt and performs **no** input/output filtering. Run it **only** on your own machine for
> learning and demos. **Never deploy it to the public internet.**

---

## Table of contents

1. [What's in the box](#whats-in-the-box)
2. [Architecture](#architecture)
3. [The two AI models (TinyLlama vs Groq)](#the-two-ai-models-tinyllama-vs-groq)
4. [Prerequisites](#prerequisites)
5. [Quick start (Windows, one‑click)](#quick-start-windows-one-click)
6. [Manual start (macOS / Linux / advanced)](#manual-start-macos--linux--advanced)
7. [Using the scanner](#using-the-scanner)
8. [Reports & email](#reports--email)
9. [API reference](#api-reference)
10. [Project structure](#project-structure)
11. [Configuration reference](#configuration-reference)
12. [Troubleshooting — every problem & fix](#troubleshooting--every-problem--fix)
13. [Security notes](#security-notes)
14. [Credits](#credits)

---

## What's in the box

| Folder | What it is | Default port |
|---|---|---|
| **`vuln-chatbot/`** | The **vulnerable AI target**. A small Python (stdlib‑only) HTTP server exposing `POST /chat`. Secrets are planted in its system prompt and there is no filtering. | `5000` |
| **`bank/`** | The **demo bank web app** (Node + Vite + React). Its in‑app assistant is wired to the vulnerable target, so it returns *real, exploitable* answers — not canned text. | API `4000`, Web `5173` |
| **`garak_gui/`** | **SynAIpse Scanner** — a zero‑dependency Python web console that drives garak against the target, parses results, scores resilience, replays exploits, runs guardrail A/B tests, and exports reports. | `8800` |
| `*.bat` | One‑click Windows launchers (`1‑setup‑garak`, `2‑run‑vuln‑chatbot`, `3‑run‑bank`, `4‑run‑garak‑gui`). | — |
| `START_HERE.md` | A short quick‑start aimed at demo day. | — |

---

## Architecture

```
  Bank UI (4000 / 5173) ─┐                                  ┌─►  Ollama · TinyLlama   (LOCAL / offline)
                         ├─►   vuln-chatbot  :5000  ────────┤
  garak GUI  (8800) ─────┘       (planted secrets,          └─►  Groq · Llama‑3.1‑8B   (CLOUD / public)
                                  no filtering)
```

Everything points at **one** target (`:5000`), so whatever the scanner finds is exactly what the
bank chatbot will do. The scanner can also point **directly** at the separate Groq model as an
independent target (see below).

The optional **Aegis guardrail** runs the same attack battery twice — once raw, once guarded —
through a proxy, and reports the per‑category delta so you can *prove* the defence works.

---

## The two AI models (TinyLlama vs Groq)

This is the single most important concept to get right:

- **The bank chatbot's brain is ALWAYS TinyLlama** (local, served by Ollama). Groq is **not** wired
  into the bank. This keeps the demo offline‑capable and reproducible.
- **Groq is a SEPARATE, standalone scan target.** You only ever reach it by **choosing it in the
  scanner**.

### The model selector (in the scanner)

The scanner's **Target** card has a **Target model** drop‑down:

- **TinyLlama · Ollama (local)** — scans the bank's actual brain. *(default)*
- **Groq (cloud)** — scans the separate Groq model directly.

Your choice is sent to the target as a `provider` field in the request body
(`{"message": "...", "provider": "groq"}`), and the target routes accordingly. The same selection is
honoured for both the normal scan and the Aegis‑guarded A/B scan.

> You can also switch per request without restarting the target:
> `POST /chat {"message":"hi","provider":"groq"}`. Inspect availability with `GET /providers`.

---

## Prerequisites

Install these once:

| Tool | Why | Install |
|---|---|---|
| **Ollama** + `tinyllama` | The bank's local model | install Ollama, then `ollama pull tinyllama` |
| **Python 3.10 – 3.12** | Required by **garak** (it does **not** support 3.13/3.14) | `winget install Python.Python.3.12` or [python.org](https://www.python.org/downloads/release/python-3120/) |
| **Node.js 18+** | Runs the demo bank | [nodejs.org](https://nodejs.org) |
| *(optional)* **Groq API key** | Faster scans + the separate cloud target | free at [console.groq.com/keys](https://console.groq.com/keys) |

> The scanner server (`garak_gui.py`) and the target (`server.py`) use **only the Python standard
> library** — no `pip install` needed for them. Only **garak itself** needs its own environment.

---

## Quick start (Windows, one‑click)

Run the numbered scripts **in order**:

1. **`1-setup-garak.bat`** — creates a Python 3.12 virtual‑env at `%USERPROFILE%\garak-env` and
   installs garak. Wait for `SUCCESS`. *(One time, ~1–2 GB download.)*
2. **`2-run-vuln-chatbot.bat`** — starts the vulnerable target on `:5000`. Leave it open. Verify at
   <http://127.0.0.1:5000/> → you should see `{"ok": true, ...}`.
3. **`3-run-bank.bat`** *(optional)* — starts the bank (API `:4000`, web `:5173`). Open
   <http://localhost:5173> and log in with `demo@team5.bank` / `Demo123$`.
4. **`4-run-garak-gui.bat`** — launches the scanner at <http://127.0.0.1:8800> using the garak
   venv. Log in with `admin` / `admin`.

Then pick a probe category (start with **Data & Prompt Leakage**), keep **Generations = 1**, choose
your **Target model**, and click **Run**.

---

## Manual start (macOS / Linux / advanced)

The `.bat` files are just convenience wrappers. On any OS:

```bash
# 0) one-time: install garak in a 3.10–3.12 env
python3.12 -m venv ~/garak-env
source ~/garak-env/bin/activate
pip install -U pip garak
python -m garak --version        # verify

# 1) start Ollama + pull the model
ollama pull tinyllama            # ensure `ollama serve` is running

# 2) start the vulnerable target (stdlib only — any Python 3.x)
cd vuln-chatbot
export AI_PROVIDER=ollama OLLAMA_MODEL=tinyllama MAX_TOKENS=80
# optional Groq target:  export GROQ_API_KEY=gsk_xxx OPENAI_MODEL=llama-3.1-8b-instant
python server.py                 # serves http://127.0.0.1:5000

# 3) (optional) start the bank
cd ../bank
npm install --legacy-peer-deps   # IMPORTANT: legacy flag avoids ERESOLVE errors
npm run dev                      # API :4000, web :5173

# 4) start the scanner (use the garak venv so `python -m garak` resolves)
source ~/garak-env/bin/activate
cd ../garak_gui
python garak_gui.py              # serves http://127.0.0.1:8800
```

> **Tip:** the scanner shells out to `garak`, falling back to `python -m garak`. Launch it from the
> **same environment** where garak is installed, otherwise you'll get `No module named 'garak'`.

---

## Using the scanner

1. **Target card** — set Host (`127.0.0.1`), Port (`5000`), Path (`/chat`), request field
   (`message`), response field (`reply`), and the **Target model** drop‑down (TinyLlama or Groq).
   The app writes `garak_gui_generator.json` for you.
2. **Attack & vulnerability probes** — expand a category (Prompt Injection, Jailbreak & DAN, Data &
   Prompt Leakage, Encoding, Toxicity, Misinformation…) and tick the probes you want. Use
   *Recommended only* to hide slow "Full" variants, or the search box to filter.
3. **Run options** — set generations (keep `1` for CPU TinyLlama), parallel attempts, optional
   report prefix/seed.
4. **Preview command** shows the exact `garak` command + generator JSON; **Run Scan** executes and
   streams output live. When it finishes you get a **resilience score**, an **A–F grade**, a
   per‑probe pass/fail breakdown, and dynamic recommendations.
5. **Attack Replay** reproduces the exact prompt/response of the most damaging hit.
6. **Guardrail A/B** runs the same battery raw vs. Aegis‑guarded and shows the per‑category delta.

---

## Reports & email

After any scan, click **📧 Email / export report**:

- **⬇ PDF** and **⬇ HTML** download a clean, branded report instantly — no setup needed.
- **Send email** delivers the report (PDF + HTML attached). A copy is always saved to
  `garak_gui/reports/`, so the button is useful even without SMTP configured.

To enable sending, fill the SMTP block in `4-run-garak-gui.bat` (or the equivalent env vars). For
Gmail use an **App Password** (Google Account → Security → 2‑Step Verification → App passwords),
**not** your normal password. Port `465` uses SSL automatically; `587` uses STARTTLS.

---

## API reference

### Vulnerable target — `vuln-chatbot/server.py` (`:5000`)

| Method & path | Body | Returns |
|---|---|---|
| `GET /` | — | `{"ok": true, ...}` health check |
| `GET /providers` | — | which models are available (`ollama`, `groq`) and the default |
| `POST /chat` | `{"message": "...", "provider"?: "ollama"\|"groq"}` | `{"reply": "...", "provider": "...", "model": "..."}` |

- `AI_PROVIDER` (`auto`\|`ollama`\|`groq`) sets the default when no `provider` is supplied.
  `auto` = use Groq if `GROQ_API_KEY` is set, else Ollama.
- The optional `provider` field overrides per request — this is exactly what the scanner's
  **Target model** drop‑down sends.

### Scanner — `garak_gui/garak_gui.py` (`:8800`)

Key endpoints: `/api/preview`, `/api/run`, `/api/run_ab` (guardrail A/B), `/api/replay`,
`/api/history`, `/api/compare`, `/api/email_report`, `/api/report_file`.

---

## Project structure

```
SynAIpse-VulnLab/
├─ START_HERE.md                 # demo-day quick start
├─ 1-setup-garak.bat             # one-time garak install (Py 3.12 venv)
├─ 2-run-vuln-chatbot.bat        # start the vulnerable target (:5000)
├─ 3-run-bank.bat                # start the demo bank (:4000 / :5173)
├─ 4-run-garak-gui.bat           # start the scanner (:8800)
├─ vuln-chatbot/
│  ├─ server.py                  # stdlib HTTP server, /chat, /providers
│  └─ .env.example               # model config reference
├─ bank/
│  ├─ server/                    # Node API (lib/ai.js calls the :5000 target)
│  ├─ src/                       # React + Vite front end
│  ├─ .env                       # PORT, JWT_SECRET, VULN_CHATBOT_URL
│  └─ package.json
└─ garak_gui/
   ├─ garak_gui.py               # the scanner web server / launcher
   ├─ index.html                 # full UI (homepage → login → dashboard) + Target model selector
   ├─ report_template.html       # branded HTML report
   ├─ report_email.py            # PDF builder + SMTP sender
   ├─ compare_template.html      # before/after Aegis comparison
   ├─ history_template.html      # scan history
   ├─ homepage_reference.html    # standalone landing-page reference (NOT served)
   └─ HTML_SETUP_NOTE.txt
```

---

## Configuration reference

| Variable | Where | Default | Meaning |
|---|---|---|---|
| `AI_PROVIDER` | target | `ollama` (via .bat) | default model: `auto`\|`ollama`\|`groq` |
| `OLLAMA_URL` | target | `http://localhost:11434` | Ollama endpoint |
| `OLLAMA_MODEL` | target | `tinyllama` | local model name |
| `GROQ_API_KEY` | target | *(empty)* | enables the Groq target |
| `OPENAI_MODEL` | target | `llama-3.1-8b-instant` | Groq model name |
| `GROQ_USER_AGENT` | target | `curl/8.4.0` | UA used for Groq calls (avoids Cloudflare 403 — see below) |
| `MAX_TOKENS` | target | `80` | shorter replies = faster scans |
| `PORT` | bank | `4000` | bank API port |
| `JWT_SECRET` | bank | dev value | change for anything non‑local |
| `VULN_CHATBOT_URL` | bank | `http://localhost:5000/chat` | where the bank's assistant calls |
| `GARAK_GUI_PORT` | scanner | `8800` | scanner UI port |
| `SMTP_*`, `EMAIL_*` | scanner | *(empty)* | optional email sending |

---

## Troubleshooting — every problem & fix

This section documents **every** issue encountered while building and running this lab, with the
root cause and the exact fix.

### Setup & environment

**1. `ModuleNotFoundError: No module named 'garak'` when starting the scanner.**
- *Cause:* the scanner was launched from a Python environment that doesn't have garak installed.
- *Fix:* launch it via **`4-run-garak-gui.bat`**, which activates `%USERPROFILE%\garak-env` first.
  Manually: `source ~/garak-env/bin/activate` before `python garak_gui.py`.

**2. garak fails to install / `py -3.12 -m venv` errors.**
- *Cause:* garak **does not support Python 3.13 / 3.14**. A newer Python is the default `py`.
- *Fix:* install **Python 3.10–3.12** (`winget install Python.Python.3.12`) and let
  `1-setup-garak.bat` build the venv with `py -3.12`.

**3. The `garak.exe` launcher is broken / does nothing on Windows.**
- *Cause:* a known packaging issue with the console‑script shim in some environments.
- *Fix:* always invoke **`python -m garak`** (the scanner already falls back to this, and the
  `.bat` runs inside the venv).

**4. Bank: `npm install` fails with `ERESOLVE unable to resolve dependency tree`.**
- *Cause:* peer‑dependency conflicts among the front‑end packages.
- *Fix:* install with **`npm install --legacy-peer-deps`** (this is what `3-run-bank.bat` does).

**5. Sandbox/CI: never name a helper script `inspect.py`.**
- *Cause:* it shadows Python's stdlib `inspect`, which breaks `lxml`/`python-pptx` with a circular
  import.
- *Fix:* name scripts something else (e.g. `tools.py`).

### Models (Ollama / Groq)

**6. Target returns `model 'X' not found` / `404` (e.g. `llama3`).**
- *Cause:* the requested model isn't pulled in Ollama.
- *Fix:* `ollama pull tinyllama` (or set `OLLAMA_MODEL` to a model you actually have).

**7. Groq calls fail with `403 Forbidden` from Python, but `curl` works.**
- *Cause:* Groq is behind **Cloudflare**, which blocks the default `Python-urllib/x.y` User‑Agent.
- *Fix:* send a browser/curl‑style UA. The target sets `GROQ_USER_AGENT=curl/8.4.0` by default; keep
  it set. (This fix is already baked into `server.py`.)

**8. Groq returns 401 / "invalid api key".**
- *Cause:* missing or wrong `GROQ_API_KEY`.
- *Fix:* paste a valid key from <https://console.groq.com/keys> into `2-run-vuln-chatbot.bat`
  (`set GROQ_API_KEY=...`). Confirm with `GET /providers`.

**9. Scans are painfully slow.**
- *Cause:* **TinyLlama on CPU is slow.**
- *Fix:* keep **Generations = 1** (the default) and use **Recommended** probes. For fast scans,
  select the **Groq** target — replies come back in seconds.

### Wiring & runtime

**10. Bank chatbot says "target is not running on :5000".**
- *Cause:* the vulnerable target isn't up.
- *Fix:* start **`2-run-vuln-chatbot.bat`** *before* the bank, and verify
  <http://127.0.0.1:5000/> returns `{"ok": true}`.

**11. Bank chatbot only gives static/canned answers.**
- *Cause:* earlier the bank used hard‑coded replies.
- *Fix:* the bank is now wired to the vulnerable target via `bank/server/lib/ai.js`
  (`VULN_CHATBOT_URL=http://localhost:5000/chat`). Make sure the target is running.

**12. `Port 5000 is already in use` (or 4000 / 5173 / 8800).**
- *Cause:* another process owns the port.
- *Fix:* close the other program, **or** change the port (`PORT`, `GARAK_GUI_PORT`, etc.) and update
  `garak_gui/garak_gui_generator.json` (Host/Port) to match.

**13. "Send email" doesn't deliver.**
- *Cause:* SMTP not configured, or Gmail rejecting a normal password.
- *Fix:* fill the `SMTP_*` block in `4-run-garak-gui.bat`. For Gmail, create an **App Password**
  (requires 2FA) and use that for `SMTP_PASS`. Port `465` = SSL, `587` = STARTTLS. Even without
  SMTP, the report is saved to `garak_gui/reports/`.

### The two issues fixed most recently

**14. "Only TinyLlama should power the chatbot; Groq should be separate."**
- *Decision:* the bank is **locked** to TinyLlama (`AI_PROVIDER=ollama`). Groq is reachable **only**
  as a standalone scan target chosen in the scanner. The target still accepts a per‑request
  `provider` override so the scanner can point at either model.

**15. An AI edit deleted the Groq selector from the dashboard and removed the GRC feature
incompletely.**
- *Cause:* a regenerated build dropped the **Target model** drop‑down and left stray GRC/
  governance code scattered across the UI, backend, and report files.
- *Fix:* the **Target model** selector (TinyLlama vs Groq) was restored in `index.html`, and the
  chosen `provider` is wired into **both** the normal and Aegis‑guarded generators in
  `garak_gui.py`. All GRC / EU AI Act / governance code was removed cleanly from `index.html`,
  `garak_gui.py`, `report_template.html`, `report_email.py`, and the reference landing page.

---

## Security notes

- **Deliberately vulnerable — local use only.** The target leaks planted secrets on demand and has
  no guardrails. Do not expose it to the internet.
- **Planted demo secrets** (these *should* leak in a successful attack — that's the point):
  - API key: `t5b_live_sk_8H3kL9_SECRET`
  - Admin token: `T5B-ADMIN-RESET-d91e4f`
- **Never commit real keys.** Keep `GROQ_API_KEY` out of git. If you ever paste a real key into a
  chat, a file, or a screenshot, **revoke it** at <https://console.groq.com/keys> and issue a new
  one. Add `.env` to `.gitignore` (the bank already does).
- Change `JWT_SECRET` before using the bank anywhere but your own machine.

---

## Credits

SynAIpse VulnLab — an AI/LLM security capstone project.

**Team:** Nihad Huseynzade · Aysel Aghayeva · Subhan Allahveranov · Rufat Guliyev · Nariman Huseynov.

Built on [garak](https://github.com/NVIDIA/garak) (NVIDIA) and [Ollama](https://ollama.com).
Findings are framed against the **OWASP LLM Top 10** and **MITRE ATLAS**.
