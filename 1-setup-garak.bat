@echo off
setlocal
REM ============================================================
REM  ONE-TIME: install garak in a clean Python 3.12 environment
REM  (garak does NOT support Python 3.14). Requires internet.
REM ============================================================
set "VENV=%USERPROFILE%\garak-env"
if not exist "%VENV%\Scripts\python.exe" (
  echo [*] Creating a Python 3.12 environment for garak...
  py -3.12 -m venv "%VENV%"
  if errorlevel 1 (
    echo.
    echo [!] Python 3.12 is not installed. Install it, then run this again:
    echo       winget install Python.Python.3.12
    echo     or https://www.python.org/downloads/release/python-3120/
    pause & exit /b 1
  )
)
call "%VENV%\Scripts\activate.bat"
echo [*] Installing garak ^(one-time, ~1-2 GB download, please wait^)...
python -m pip install -U pip
python -m pip install -U garak
echo.
echo [*] Verifying garak...
python -m garak --version
if errorlevel 1 (
  echo [!] garak did not install correctly. Scroll up for the error.
  pause & exit /b 1
)
echo.
echo ============================================================
echo  SUCCESS. Next: 2-run-vuln-chatbot.bat, then 4-run-garak-gui.bat
echo ============================================================
pause
