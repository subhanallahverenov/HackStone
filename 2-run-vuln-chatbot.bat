@echo off
REM ============================================================
REM  Starts the VULNERABLE chatbot target on port 5000.
REM
REM  The BANK chatbot's brain is ALWAYS TinyLlama (local, via Ollama).
REM  Groq is NOT wired into the bank. Groq is a SEPARATE model that you
REM  can scan on its own from the garak GUI (choose "Groq" in the scanner).
REM
REM    * Bank chatbot   ->  TinyLlama (local)                 [always]
REM    * garak scanner  ->  pick TinyLlama (the bank's AI)  OR  Groq (separate)
REM ============================================================

REM ---- Bank backend is LOCKED to the local model (tinyllama) ----
set AI_PROVIDER=ollama
set OLLAMA_MODEL=tinyllama

REM ---- Groq = SEPARATE cloud model, only used when you select it in the scanner ----
REM     Optional: paste a free key from https://console.groq.com/keys
set GROQ_API_KEY=
set OPENAI_MODEL=llama-3.1-8b-instant

set MAX_TOKENS=80
cd /d "%~dp0vuln-chatbot"
python server.py
if errorlevel 9009 (
  echo [!] 'python' not found on PATH. Try installing Python or use 'py server.py'.
)
pause
