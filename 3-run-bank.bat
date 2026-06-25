@echo off
REM ============================================================
REM  Runs the demo bank. Its chatbot talks to the vulnerable
REM  :5000 target, so start 2-run-vuln-chatbot.bat first.
REM  Requires Node.js (https://nodejs.org).
REM ============================================================
cd /d "%~dp0bank"
if not exist node_modules (
  echo [*] Installing bank dependencies ^(first run only, ~1 min^)...
  call npm install --legacy-peer-deps
  if errorlevel 1 (
    echo.
    echo [!] npm install failed. Try once manually:  npm install --legacy-peer-deps
    pause & exit /b 1
  )
)
echo [*] Starting bank: API on http://localhost:4000  +  Web on http://localhost:5173
call npm run dev
pause
