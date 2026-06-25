# SynAIpse Scanner — LLM Security Console

A zero-dependency local web UI for running the [garak](https://github.com/NVIDIA/garak)
LLM vulnerability scanner against a REST chatbot target. Built for hackathon demos:
beautiful dark "red-team console" with host/port inputs, attack-grouped probe
selection, live output streaming, and a parsed pass/fail risk dashboard.

## Requirements
- Python 3.8+ (uses only the standard library — no `pip install` needed)
- `garak` installed and on your PATH (the same one you already run from the terminal)
- Your chatbot backend running (e.g. `python server.py` → tinyllama on :5000)
- Ollama running if your target uses it

## Run it
```
cd <this folder>
python garak_gui.py
```
Then open **http://127.0.0.1:8800** in your browser.

(To use a different UI port: set `GARAK_GUI_PORT`, e.g. `set GARAK_GUI_PORT=9000` on Windows.)

## How to use
1. **Target** card — fill in Host, Port, Path (`/chat`), request field (`message`)
   and response field (`reply`). The app writes `garak_gui_generator.json` for you.
2. **Attack & vulnerability probes** — expand a category (e.g. *Prompt Injection*,
   *Jailbreak & DAN*, *Data Leakage*…) and tick the probes you want. Use
   *Recommended only* to hide the slow 💤 "Full" variants, or the search box to filter.
3. **Run options** — set generations, parallel attempts, optional report prefix/seed.
4. Click **Preview command** to see the exact `garak` command + generator.json,
   or **Run Scan** to execute. Output streams live; when it finishes you get a
   **resilience score** and a per-probe pass/fail breakdown.

## Notes
- The app shells out to `garak` (falls back to `python -m garak`). It does **not**
  reimplement garak — it builds the command, runs it, and parses the
  `*.report.jsonl` it produces.
- `📜 fast` = default/quick probe, `💤 slow` = extended ("Full") variant that sends
  far more prompts. Start with recommended probes for demos.
- Probe categories are a curated grouping of garak's modules into intuitive attack
  classes (mapped loosely to OWASP LLM Top 10). Edit `CATEGORIES` in `index.html`
  to re-group or add probes.

## Files
- `garak_gui.py` — the standard-library web server / launcher
- `index.html` — the full UI (HTML + CSS + JS, including the probe taxonomy)
