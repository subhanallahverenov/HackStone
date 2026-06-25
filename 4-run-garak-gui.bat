@echo off
REM ============================================================
REM  Launches the garak GUI using the garak venv, so it uses
REM  'python -m garak' instead of the broken garak.EXE.
REM  Start 2-run-vuln-chatbot.bat first (the scan targets :5000).
REM ============================================================
set "VENV=%USERPROFILE%\garak-env"
if not exist "%VENV%\Scripts\activate.bat" (
  echo [!] garak-env not found. Run 1-setup-garak.bat first.
  pause & exit /b 1
)
call "%VENV%\Scripts\activate.bat"

REM ============================================================
REM  OPTIONAL: email the scan report automatically.
REM  Fill these in to enable the "Send email" button. If you
REM  leave them blank, the Email button still works but just
REM  SAVES the PDF + HTML to garak_gui\reports\ for download.
REM  Gmail: turn on 2FA, then create an App Password and paste
REM  it into SMTP_PASS (NOT your normal password).
REM ============================================================
set "SMTP_HOST="
set "SMTP_PORT=587"
set "SMTP_USER="
set "SMTP_PASS="
set "SMTP_TLS=true"
set "EMAIL_FROM="
set "EMAIL_TO="

cd /d "%~dp0garak_gui"
echo [*] Opening the scanner at http://127.0.0.1:8800 ...
python garak_gui.py
pause
