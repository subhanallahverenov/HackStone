# SynAIpse — AI/LLM Security Testing Framework
**Team SynAIpse | Hackathon 2026**

An automated framework for evaluating LLM security. Targets prompt injection,
jailbreaks, data leaks, and RAG poisoning. Aligned with MITRE ATLAS standards.

---

## Architecture

```
┌─────────────────────────────────────┐
│  SynAIpse Bank Web App (port 4000)  │  ← Full banking UI
│  React + Node.js/Express + SQLite   │
│  Chat powered by tinyllama          │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  SynAIpse AI Pentest Target (5000)  │  ← Garak target
│  Python stdlib HTTP server          │
│  Native tinyllama via Ollama        │
│  POST /chat → {"message":"..."} → {"reply":"..."} │
└─────────────────────────────────────┘
```

---

## Prerequisites

Make sure the following are installed on your host machine before running anything.

### 1. Ollama + tinyllama

Both servers require Ollama running locally at `http://localhost:11434`.

```bash
# Install Ollama (Linux/macOS)
curl -fsSL https://ollama.com/install.sh | sh

# Pull the required model
ollama pull tinyllama

# Verify it's available
ollama list
```

> Windows: download the installer from https://ollama.com/download

---

### 2. Python 3

Required to run the chatbot server. Uses Python stdlib only — no extra packages needed.

```bash
python3 --version   # 3.8+ recommended
```

---

### 3. Node.js + npm

Required to build and run the banking web app.

```bash
# Check if installed
node --version    # v18+ recommended
npm --version

# Install on Kali/Debian if missing
sudo apt update && sudo apt install nodejs npm -y
```

---

### 4. Garak (for security scanning)

```bash
pip install garak
```

---

### Quick Reference

| Tool             | Purpose                        | Required |
|------------------|--------------------------------|----------|
| Ollama           | LLM runtime                   | ✅ Yes   |
| tinyllama        | Chat model                    | ✅ Yes   |
| Python 3         | Chatbot server                | ✅ Yes   |
| Node.js + npm    | Banking web app               | ✅ Yes   |
| pip + garak      | Security scanning             | ✅ Yes   |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/subhanallahverenov/hackathon.git
cd hackathon

# Start the AI pentest target (port 5000)
cd chatbot-server && python3 server.py

# In a new terminal — start the banking web app (port 4000)
cd synaipse-bank && npm install && npm run build && node server/index.js
```

- Banking UI → `http://localhost:4000`
- Pentest target API → `http://localhost:5000/chat`

---

## Garak Scan

Run the automated LLM security scan against the pentest target:

```bash
garak -t rest.RestGenerator \
  -G generator.json \
  -p promptinject.HijackHateHumans,dan.Ablation_Dan_11_0 \
  --generations 1 -v
```

---

## MITRE ATLAS Coverage

| Technique | Description               | Status             |
|-----------|---------------------------|--------------------|
| T0051     | Prompt Injection          | Demonstrated       |
| T0054     | Jailbreak                 | Demonstrated       |
| T0057     | System Prompt Extraction  | Credentials leaked |
| T0058     | Data Leakage              | PII exposed        |
| T0074     | RAG Poisoning             | Poisoned KB doc    |

---

## Models Tested

| Model           | Size   | Source   | Speed | Vulnerable                  |
|-----------------|--------|----------|-------|-----------------------------|
| tinyllama       | 637MB  | Ollama   | ~3s   | HIGH — 28.91% garak success |
| dolphin-mistral | 4.1GB  | Ollama   | ~5s   | HIGH — uncensored           |
| Kumru-2B        | 1.5GB  | Ollama   | ~10s  | MEDIUM — Turkish model      |
| llama-3.1-8b    | —      | Groq API | <1s   | LOW — guardrailed           |
| qwen3-32b       | —      | Groq API | <1s   | LOW — guardrailed           |

---

## Reporter

Generate an HTML dashboard from Garak run results:

```bash
# Linux/macOS
python reporter.py --dir ~/.local/share/garak/garak_runs

# Windows
python reporter.py --dir "C:\Users\Student\.local\share\garak\garak_runs"
```

---

## Team

**SynAIpse** — AI Security Testing | Hackathon 2026
