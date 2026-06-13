# SynAIpse — AI/LLM Security Testing Framework

**Team SynAIpse | Hackathon 2026**

An automated framework for evaluating LLM security. Targets prompt injection, 
jailbreaks, data leaks, and RAG poisoning. Aligned with MITRE ATLAS standards.

---

## Architecture

```
┌─────────────────────────────────────┐
│  SynAIpse Bank Web App (port 4000)   │  ← Full banking UI
│  React + Node.js/Express + SQLite  │
│  Chat powered by tinyllama    │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  SynAIpse AI Pentest Target (5000) │  ← Garak target
│  Python stdlib HTTP server          │
│  Native tinyllama via Ollama        │
│  Native LLM via Ollama              │
│  POST /chat → {"message":"..."} → {"reply":"..."} │
└─────────────────────────────────────┘
```

---

## Quick Start

```bash
# Start the AI pentest target
cd chatbot-server && python3 server.py

# Start the banking web app
cd synaipse-bank && npm install && npm run build && node server/index.js
```

## Garak Scan

```bash
garak --target_type rest -G garak_config.json \
      --probes promptinject,leakreplay,dan,encoding
```

---

## MITRE ATLAS Coverage

| Technique | Description | Status |
|-----------|-------------|--------|
| T0051 | Prompt Injection | Demonstrated |
| T0054 | Jailbreak | Demonstrated |
| T0057 | System Prompt Extraction | Credentials leaked |
| T0058 | Data Leakage | PII exposed |
| T0074 | RAG Poisoning | Poisoned KB doc |

---

## Models Tested

| Model | Size | Source | Speed | Vulnerable |
|-------|------|--------|-------|------------|
| tinyllama | 637MB | Ollama | ~3s | HIGH — 28.91% garak success |
| dolphin-mistral | 4.1GB | Ollama | ~5s | HIGH — uncensored |
| Kumru-2B | 1.5GB | Ollama | ~10s | MEDIUM — Turkish model |
| llama-3.1-8b | — | Groq API | <1s | LOW — guardrailed |
| qwen3-32b | — | Groq API | <1s | LOW — guardrailed |

---

## Reporter
```bash
python aegis_dashboard.py --dir "C:\Users\Student.local\share\garak\garak_runs"
```
## Team

**SynAIpse** — AI Security Testing | Hackathon 2026
