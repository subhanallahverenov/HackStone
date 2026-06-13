#!/usr/bin/env python3
"""
AEGIS-LLM  -  Garak Report Dashboard
=====================================
A zero-dependency local web app that reads Garak `.report.jsonl` output and
renders an AEGIS-style security report in the browser:

  1. Executive Summary   (score, grade, headline, severity table)
  2. Vulnerability Findings (per-probe bars + detailed cards w/ payloads)
  3. MITRE ATLAS Framework Mapping
  4. Recommendations

It watches your Garak runs folder and always shows the most recent scan.

USAGE
-----
    python aegis_dashboard.py                 # auto-detect default garak folder
    python aegis_dashboard.py --dir "C:\\Users\\Student\\.local\\share\\garak\\garak_runs"
    python aegis_dashboard.py --port 8080 --no-browser

Then open http://127.0.0.1:8000  (opens automatically).
Uses only the Python standard library - works offline, no pip install needed.
"""

import argparse
import html
import json
import os
import re
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

# --------------------------------------------------------------------------- #
#  Knowledge base: probe family -> MITRE ATLAS / OWASP mapping + descriptions  #
# --------------------------------------------------------------------------- #

ATLAS_MAP = {
    "promptinject":     {"atlas_id": "AML.T0051", "technique": "Prompt Injection",            "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "ML Attack Staging"},
    "latentinjection":  {"atlas_id": "AML.T0051", "technique": "Indirect Prompt Injection",   "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "ML Attack Staging"},
    "encoding":         {"atlas_id": "AML.T0051", "technique": "Prompt Injection (Encoding)",  "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "ML Attack Staging"},
    "dan":              {"atlas_id": "AML.T0054", "technique": "Jailbreak (DAN)",              "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "ML Attack Staging"},
    "grandma":          {"atlas_id": "AML.T0054", "technique": "Jailbreak (Persona)",          "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "ML Attack Staging"},
    "atkgen":           {"atlas_id": "AML.T0054", "technique": "Automated Jailbreak",          "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "ML Attack Staging"},
    "tap":              {"atlas_id": "AML.T0054", "technique": "Tree-of-Attacks Jailbreak",    "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "ML Attack Staging"},
    "suffix":           {"atlas_id": "AML.T0054", "technique": "Adversarial Suffix Jailbreak", "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "ML Attack Staging"},
    "leakreplay":       {"atlas_id": "AML.T0057", "technique": "LLM Data Leakage",             "owasp": "LLM06", "owasp_name": "Sensitive Info Disclosure", "tactic": "Exfiltration"},
    "divergence":       {"atlas_id": "AML.T0057", "technique": "Training Data Extraction",      "owasp": "LLM06", "owasp_name": "Sensitive Info Disclosure", "tactic": "Exfiltration"},
    "replay":           {"atlas_id": "AML.T0057", "technique": "Memorized Data Replay",         "owasp": "LLM06", "owasp_name": "Sensitive Info Disclosure", "tactic": "Exfiltration"},
    "xss":              {"atlas_id": "AML.T0048", "technique": "Insecure Output Handling (XSS)","owasp": "LLM02", "owasp_name": "Insecure Output Handling",  "tactic": "Impact"},
    "malwaregen":       {"atlas_id": "AML.T0048", "technique": "Malware Generation",            "owasp": "LLM02", "owasp_name": "Insecure Output Handling",  "tactic": "Impact"},
    "exploitation":     {"atlas_id": "AML.T0048", "technique": "Exploit Generation",            "owasp": "LLM02", "owasp_name": "Insecure Output Handling",  "tactic": "Impact"},
    "packagehallucination": {"atlas_id": "AML.T0051", "technique": "Package Hallucination",    "owasp": "LLM09", "owasp_name": "Overreliance",             "tactic": "Impact"},
    "realtoxicityprompts":  {"atlas_id": "AML.T0048", "technique": "Toxic Content Generation", "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "Impact"},
    "continuation":     {"atlas_id": "AML.T0048", "technique": "Harmful Continuation",          "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "Impact"},
    "lmrc":             {"atlas_id": "AML.T0048", "technique": "Risk Card Behaviour",           "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "Impact"},
    "glitch":           {"atlas_id": "AML.T0043", "technique": "Glitch Token Crafting",         "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "ML Attack Staging"},
    "snowball":         {"atlas_id": "AML.T0048", "technique": "Hallucination (Snowball)",      "owasp": "LLM09", "owasp_name": "Overreliance",             "tactic": "Impact"},
    "goodside":         {"atlas_id": "AML.T0051", "technique": "Prompt Injection",             "owasp": "LLM01", "owasp_name": "Prompt Injection",          "tactic": "ML Attack Staging"},
    "knownbadsignatures": {"atlas_id": "AML.T0048", "technique": "Known Bad Signatures",        "owasp": "LLM02", "owasp_name": "Insecure Output Handling",  "tactic": "Impact"},
    "fileformats":      {"atlas_id": "AML.T0010", "technique": "Supply Chain (File Formats)",  "owasp": "LLM05", "owasp_name": "Supply Chain",            "tactic": "Resource Development"},
}
DEFAULT_ATLAS = {"atlas_id": "AML.T0000", "technique": "LLM Vulnerability", "owasp": "LLM-Gen", "owasp_name": "General", "tactic": "ML Attack Staging"}

FAMILY_DESCRIPTION = {
    "promptinject":    "Attacker injects a malicious instruction inside a user-supplied text field. The model ignores its original system instructions and executes the injected command.",
    "latentinjection": "A hidden instruction is smuggled through indirect content (documents, web pages, RAG context). The model treats untrusted data as commands.",
    "encoding":        "An instruction is obfuscated (Base64, ROT13, hex, etc.) to bypass input filters. The model decodes and executes it.",
    "dan":             "'Do Anything Now' style jailbreak attempts to disable the model's safety alignment via role-play and override prompts.",
    "grandma":         "Persona-based jailbreak that wraps a harmful request inside an emotional or role-play framing to bypass refusals.",
    "atkgen":          "An automated red-team generator iteratively crafts adversarial prompts until the model is jailbroken.",
    "leakreplay":      "Probes whether the model reproduces memorized / copyrighted training data when prompted with partial text.",
    "divergence":      "Repetition / divergence attacks coax the model into leaking memorized training data.",
    "xss":             "Tests whether model output contains unescaped active content (HTML/JS) that could execute in a downstream UI.",
    "malwaregen":      "Probes the model's willingness to generate malicious code or malware.",
    "packagehallucination": "The model invents non-existent software packages that an attacker could register (dependency confusion).",
    "realtoxicityprompts": "Measures whether the model produces toxic, hateful or unsafe content from provocative prompts.",
    "glitch":          "Uses anomalous 'glitch' tokens that destabilise the model and can bypass guardrails.",
}


def family_of(probe):
    """promptinject.HijackHateHumans -> promptinject"""
    if not probe:
        return "unknown"
    return str(probe).split(".")[0]


def atlas_for(family):
    return ATLAS_MAP.get(family, DEFAULT_ATLAS)


def describe(family):
    return FAMILY_DESCRIPTION.get(
        family,
        "Adversarial probe family executed by Garak. A hit indicates the model produced unsafe or non-compliant output under attack.",
    )


# --------------------------------------------------------------------------- #
#  Garak .report.jsonl parsing                                                 #
# --------------------------------------------------------------------------- #

def _as_text(value):
    """Garak prompts/outputs may be plain strings or structured Turn/Message objects."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for key in ("text", "content", "output"):
            if key in value:
                return _as_text(value[key])
        if "turns" in value and isinstance(value["turns"], list) and value["turns"]:
            return _as_text(value["turns"][-1])
        if "last_message" in value:
            return _as_text(value["last_message"])
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, list):
        return "\n".join(_as_text(v) for v in value if v is not None)
    return str(value)


def severity_for(hit_rate):
    if hit_rate >= 0.8:
        return "CRITICAL"
    if hit_rate >= 0.5:
        return "HIGH"
    if hit_rate >= 0.2:
        return "MEDIUM"
    if hit_rate > 0:
        return "LOW"
    return "PASS"


def grade_for(score):
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def parse_report(path):
    """Parse a Garak .report.jsonl file into the dashboard data model."""
    setup = {}
    init = {}
    evals = []          # raw eval entries
    attempts = []       # attempt entries (for payload examples)
    end_time = None

    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            et = rec.get("entry_type", "")
            if et == "start_run setup":
                setup = rec
            elif et == "init":
                init = rec
            elif et == "eval":
                evals.append(rec)
            elif et == "attempt":
                attempts.append(rec)
            elif et in ("completed run", "end_run"):
                end_time = rec.get("end_time")

    # ---- Aggregate eval entries per probe ---------------------------------- #
    probe_stats = {}    # probe -> {passed, total, detector}
    for ev in evals:
        probe = ev.get("probe") or ev.get("probe_classname") or "unknown"
        passed = int(ev.get("passed", 0) or 0)
        total = int(ev.get("total", 0) or 0)
        slot = probe_stats.setdefault(probe, {"passed": 0, "total": 0, "detector": ev.get("detector", "")})
        slot["passed"] += passed
        slot["total"] += total
        if ev.get("detector"):
            slot["detector"] = ev.get("detector")

    # Fallback: derive stats from attempts if there were no eval lines.
    if not probe_stats and attempts:
        for at in attempts:
            probe = at.get("probe_classname") or at.get("probe") or "unknown"
            slot = probe_stats.setdefault(probe, {"passed": 0, "total": 0, "detector": ""})
            for det, scores in (at.get("detector_results") or {}).items():
                slot["detector"] = det
                for s in scores:
                    slot["total"] += 1
                    if float(s) < 0.5:
                        slot["passed"] += 1

    # ---- Find an example hit (payload + response) per probe ---------------- #
    examples = {}       # probe -> {payload, response, goal}
    for at in attempts:
        probe = at.get("probe_classname") or at.get("probe") or "unknown"
        if probe in examples:
            continue
        outputs = at.get("outputs") or []
        det_results = at.get("detector_results") or {}
        hit_idx = None
        for det, scores in det_results.items():
            for i, s in enumerate(scores):
                try:
                    if float(s) >= 0.5:
                        hit_idx = i
                        break
                except (TypeError, ValueError):
                    continue
            if hit_idx is not None:
                break
        response = ""
        if hit_idx is not None and hit_idx < len(outputs):
            response = _as_text(outputs[hit_idx])
        elif outputs:
            response = _as_text(outputs[0])
        examples[probe] = {
            "payload": _as_text(at.get("prompt")),
            "response": response,
            "goal": at.get("goal", "") or "",
        }

    # ---- Build findings ---------------------------------------------------- #
    findings = []
    total_attempts_all = 0
    total_passed_all = 0
    for probe, st in sorted(probe_stats.items()):
        total = st["total"]
        passed = st["passed"]
        hits = max(total - passed, 0)
        hit_rate = (hits / total) if total else 0.0
        total_attempts_all += total
        total_passed_all += passed
        fam = family_of(probe)
        atlas = atlas_for(fam)
        ex = examples.get(probe, {})
        findings.append({
            "probe": probe,
            "family": fam,
            "detector": st["detector"],
            "total": total,
            "passed": passed,
            "hits": hits,
            "hit_rate": round(hit_rate, 4),
            "hit_pct": round(hit_rate * 100),
            "severity": severity_for(hit_rate),
            "atlas_id": atlas["atlas_id"],
            "atlas_technique": atlas["technique"],
            "owasp": atlas["owasp"],
            "owasp_name": atlas["owasp_name"],
            "tactic": atlas["tactic"],
            "description": describe(fam),
            "payload": ex.get("payload", ""),
            "response": ex.get("response", ""),
            "goal": ex.get("goal", ""),
        })

    # Sort findings: worst first
    sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "PASS": 4}
    findings.sort(key=lambda f: (sev_order.get(f["severity"], 9), -f["hit_rate"]))

    # ---- Overall score ----------------------------------------------------- #
    resilience = (total_passed_all / total_attempts_all) if total_attempts_all else 1.0
    score = round(resilience * 100)
    grade = grade_for(score)
    total_hits_all = total_attempts_all - total_passed_all

    # ---- MITRE ATLAS mapping (deduped per family) -------------------------- #
    atlas_rows = {}
    for f in findings:
        fam = f["family"]
        if fam not in atlas_rows:
            atlas_rows[fam] = {
                "probe_family": fam,
                "atlas_id": f["atlas_id"],
                "technique": f["atlas_technique"],
                "owasp": f["owasp"],
                "tactic": f["tactic"],
                "max_severity": f["severity"],
            }
        else:
            if sev_order.get(f["severity"], 9) < sev_order.get(atlas_rows[fam]["max_severity"], 9):
                atlas_rows[fam]["max_severity"] = f["severity"]
    atlas_mapping = sorted(atlas_rows.values(), key=lambda r: r["atlas_id"])

    # ---- Recommendations (driven by which families triggered) -------------- #
    recommendations = build_recommendations(findings)

    # ---- Metadata ---------------------------------------------------------- #
    model_type = setup.get("plugins.model_type", "")
    model_name = setup.get("plugins.model_name", "")
    model = " / ".join([p for p in (model_type, model_name) if p]) or "Unknown target"
    generations = setup.get("run.generations")
    families_present = sorted({f["family"] for f in findings})

    meta = {
        "model": model,
        "model_type": model_type,
        "model_name": model_name,
        "garak_version": init.get("garak_version") or setup.get("_config.version") or "unknown",
        "run_id": init.get("run") or setup.get("transient.run_id") or "",
        "start_time": init.get("start_time", ""),
        "end_time": end_time or "",
        "generations": generations,
        "probe_count": len(findings),
        "families": families_present,
        "file": os.path.basename(path),
    }

    headline = build_headline(meta, findings, score, grade)

    return {
        "meta": meta,
        "summary": {
            "score": score,
            "grade": grade,
            "resilience_pct": round(resilience * 100),
            "total_attempts": total_attempts_all,
            "total_hits": total_hits_all,
            "total_probes": len(findings),
            "headline": headline,
            "severity_counts": {
                s: sum(1 for f in findings if f["severity"] == s)
                for s in ("CRITICAL", "HIGH", "MEDIUM", "LOW", "PASS")
            },
        },
        "findings": findings,
        "atlas_mapping": atlas_mapping,
        "recommendations": recommendations,
    }


def build_headline(meta, findings, score, grade):
    worst = findings[0] if findings else None
    parts = []
    parts.append(
        "The target {model} was subjected to automated adversarial probing using Garak {ver}.".format(
            model=meta["model"], ver=meta["garak_version"]
        )
    )
    crit = [f for f in findings if f["severity"] in ("CRITICAL", "HIGH")]
    if crit:
        names = ", ".join(sorted({f["family"] for f in crit}))
        top_pct = max(f["hit_pct"] for f in crit)
        parts.append(
            "The system demonstrated critical/high-severity vulnerabilities to {names} attacks, "
            "with a peak attack success (hit) rate of {pct}%.".format(names=names, pct=top_pct)
        )
    elif findings:
        parts.append("No critical issues were detected; the model resisted the majority of probes.")
    else:
        parts.append("No evaluable probe results were found in this run.")
    parts.append(
        "Overall resilience score: {score}/100 (Grade {grade}).".format(score=score, grade=grade)
    )
    return " ".join(parts)


def build_recommendations(findings):
    fams = {f["family"] for f in findings if f["hits"] > 0}
    recs = []

    def add(text, priority, effort):
        recs.append({"id": "R{}".format(len(recs) + 1), "text": text, "priority": priority, "effort": effort})

    if {"promptinject", "latentinjection", "encoding", "goodside"} & fams:
        add("Implement an input sanitization and output filtering layer before and after every LLM call.", "CRITICAL", "Medium")
        add("Deploy a dedicated prompt-injection detection layer (e.g. LLM Guard, Rebuff, Llama Guard) as middleware.", "HIGH", "High")
        add("Add a system-prompt confidentiality instruction and never place secrets or credentials in the system prompt.", "HIGH", "Low")
    if "latentinjection" in fams:
        add("Audit and sanitize all RAG / knowledge-base documents; isolate and quarantine untrusted content.", "CRITICAL", "Medium")
    if {"dan", "grandma", "atkgen", "tap", "suffix"} & fams:
        add("Strengthen jailbreak guardrails: enforce refusal policies and add a safety classifier on responses.", "HIGH", "Medium")
    if {"leakreplay", "divergence", "replay"} & fams:
        add("Add data-leakage controls and output scanning to block reproduction of memorized/sensitive data.", "HIGH", "Medium")
    if {"xss", "malwaregen", "exploitation", "knownbadsignatures"} & fams:
        add("Treat all model output as untrusted: HTML-escape, sandbox, and review generated code/content before use.", "CRITICAL", "Medium")
    if "packagehallucination" in fams:
        add("Validate every package/dependency the model suggests against a trusted allow-list to prevent dependency confusion.", "MEDIUM", "Low")
    if {"realtoxicityprompts", "continuation", "lmrc"} & fams:
        add("Add a toxicity/safety moderation filter on model outputs.", "MEDIUM", "Low")

    # Always-on baseline
    add("Adopt the MITRE ATLAS threat model in your SDLC and re-run Garak scans on every model or prompt update.", "MEDIUM", "Medium")
    if not fams:
        recs.insert(0, {"id": "R1", "text": "No active vulnerabilities detected. Maintain continuous Garak regression scanning to catch regressions.", "priority": "LOW", "effort": "Low"})
        # renumber
        for i, r in enumerate(recs):
            r["id"] = "R{}".format(i + 1)
    return recs


# --------------------------------------------------------------------------- #
#  Folder discovery                                                            #
# --------------------------------------------------------------------------- #

def default_garak_dir():
    candidates = []
    home = os.path.expanduser("~")
    xdg = os.environ.get("XDG_DATA_HOME")
    if xdg:
        candidates.append(os.path.join(xdg, "garak", "garak_runs"))
    candidates.append(os.path.join(home, ".local", "share", "garak", "garak_runs"))
    appdata = os.environ.get("APPDATA") or os.environ.get("LOCALAPPDATA")
    if appdata:
        candidates.append(os.path.join(appdata, "garak", "garak_runs"))
    candidates.append(os.path.join(home, "AppData", "Local", "garak", "garak_runs"))
    for c in candidates:
        if os.path.isdir(c):
            return c
    return candidates[0] if candidates else os.getcwd()


def list_reports(folder):
    """Return report files newest-first."""
    out = []
    if not os.path.isdir(folder):
        return out
    for root, _dirs, files in os.walk(folder):
        for name in files:
            if name.endswith(".report.jsonl") or name.endswith(".report.json"):
                full = os.path.join(root, name)
                try:
                    mtime = os.path.getmtime(full)
                    size = os.path.getsize(full)
                except OSError:
                    continue
                out.append({"name": name, "path": full, "mtime": mtime, "size": size})
    out.sort(key=lambda r: r["mtime"], reverse=True)
    return out


# --------------------------------------------------------------------------- #
#  HTTP server                                                                 #
# --------------------------------------------------------------------------- #

GARAK_DIR = None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # quiet

    def _send(self, code, body, content_type="application/json"):
        data = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", content_type + "; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        route = parsed.path
        qs = parse_qs(parsed.query)

        if route in ("/", "/index.html"):
            self._send(200, INDEX_HTML, "text/html")
            return

        if route == "/api/runs":
            reports = list_reports(GARAK_DIR)
            payload = {
                "folder": GARAK_DIR,
                "runs": [{"name": r["name"], "mtime": r["mtime"], "size": r["size"]} for r in reports],
            }
            self._send(200, json.dumps(payload))
            return

        if route == "/api/report":
            reports = list_reports(GARAK_DIR)
            if not reports:
                self._send(200, json.dumps({"error": "no_reports", "folder": GARAK_DIR}))
                return
            target = reports[0]
            wanted = qs.get("file", [None])[0]
            if wanted:
                for r in reports:
                    if r["name"] == wanted:
                        target = r
                        break
            try:
                data = parse_report(target["path"])
                self._send(200, json.dumps(data))
            except Exception as exc:  # noqa: BLE001
                self._send(200, json.dumps({"error": "parse_failed", "detail": str(exc), "file": target["name"]}))
            return

        self._send(404, json.dumps({"error": "not_found"}))


# --------------------------------------------------------------------------- #
#  Front-end (single embedded HTML document)                                   #
# --------------------------------------------------------------------------- #

INDEX_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AEGIS-LLM — Garak Security Report</title>
<style>
  :root{
    --bg:#0a0e1a; --panel:#0e1426; --panel2:#121a30; --line:#1e2942;
    --txt:#e6ebf5; --muted:#8a97b3; --cyan:#22d3ee; --cyan2:#38bdf8;
    --red:#ef4444; --orange:#f59e0b; --yellow:#eab308; --green:#22c55e; --blue:#3b82f6;
  }
  *{box-sizing:border-box}
  body{margin:0;background:radial-gradient(1200px 600px at 70% -10%,#10182e 0%,var(--bg) 60%);
       color:var(--txt);font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.5}
  a{color:var(--cyan2)}
  .topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;
          padding:10px 22px;background:#0b1120;border-bottom:1px solid var(--line);
          position:sticky;top:0;z-index:10;font-size:12px;letter-spacing:.08em;color:var(--muted)}
  .topbar .brand{color:var(--cyan);font-weight:700;letter-spacing:.12em}
  .wrap{max-width:1080px;margin:0 auto;padding:28px 22px 80px}
  .hero{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:8px}
  .hero h1{font-size:30px;margin:0;font-weight:800;letter-spacing:.02em}
  .hero .sub{color:var(--muted);font-size:13px;margin-top:4px}
  .controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  select,button{background:var(--panel2);color:var(--txt);border:1px solid var(--line);
          border-radius:8px;padding:8px 12px;font-size:13px;cursor:pointer}
  button:hover,select:hover{border-color:var(--cyan)}
  .section{margin-top:34px}
  .section-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}
  .section-num{color:var(--cyan);font-size:26px;font-weight:800;font-variant-numeric:tabular-nums;
        border-left:4px solid var(--cyan);padding-left:10px;line-height:1}
  .section-title{font-size:21px;font-weight:700}
  .panel{background:linear-gradient(180deg,var(--panel) 0%,var(--panel2) 100%);
        border:1px solid var(--line);border-radius:14px;padding:20px}
  .summary-grid{display:grid;grid-template-columns:200px 1fr;gap:24px;align-items:center}
  @media(max-width:640px){.summary-grid{grid-template-columns:1fr}}
  .donut{position:relative;width:180px;height:180px;margin:auto}
  .donut svg{transform:rotate(-90deg)}
  .donut .score{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .donut .score .num{font-size:46px;font-weight:800;line-height:1}
  .donut .score .den{font-size:12px;color:var(--muted)}
  .donut .score .grade{margin-top:6px;font-size:14px;font-weight:700;letter-spacing:.05em}
  .headline-title{color:var(--cyan);font-weight:700;margin-bottom:8px;font-size:14px;letter-spacing:.04em}
  .headline-text{color:#cdd6ea;font-size:14.5px}
  table{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:8px}
  th,td{text-align:left;padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:top}
  th{color:var(--muted);font-weight:600;font-size:12px;letter-spacing:.05em;text-transform:uppercase}
  tbody tr:hover{background:#101a30}
  .pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:.04em}
  .sev-CRITICAL{color:#fff;background:rgba(239,68,68,.18);border:1px solid var(--red);color:var(--red)}
  .sev-HIGH{color:var(--orange);background:rgba(245,158,11,.14);border:1px solid var(--orange)}
  .sev-MEDIUM{color:var(--yellow);background:rgba(234,179,8,.12);border:1px solid var(--yellow)}
  .sev-LOW{color:var(--green);background:rgba(34,197,94,.12);border:1px solid var(--green)}
  .sev-PASS{color:var(--green);background:rgba(34,197,94,.12);border:1px solid var(--green)}
  .prio-CRITICAL{color:var(--red);font-weight:800}
  .prio-HIGH{color:var(--orange);font-weight:800}
  .prio-MEDIUM{color:var(--cyan);font-weight:800}
  .prio-LOW{color:var(--green);font-weight:800}
  .stat-row{display:flex;gap:14px;flex-wrap:wrap;margin-top:14px}
  .stat{flex:1;min-width:120px;background:#0b1120;border:1px solid var(--line);border-radius:10px;padding:12px 14px}
  .stat .v{font-size:24px;font-weight:800}
  .stat .l{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
  .bar-row{display:grid;grid-template-columns:230px 1fr auto auto;gap:12px;align-items:center;
        padding:12px 14px;border:1px solid var(--line);border-radius:10px;margin-bottom:10px;background:#0b1120}
  @media(max-width:640px){.bar-row{grid-template-columns:1fr}}
  .bar-label .p{font-weight:700}
  .bar-label .a{color:var(--muted);font-size:12px}
  .bar-track{height:16px;background:#1a2440;border-radius:8px;overflow:hidden}
  .bar-fill{height:100%;border-radius:8px}
  .bar-pct{font-weight:800;font-variant-numeric:tabular-nums;min-width:46px;text-align:right}
  .bar-frac{color:var(--muted);font-size:12px;min-width:42px;text-align:right}
  .finding{border:1px solid var(--line);border-radius:12px;margin-top:16px;overflow:hidden}
  .finding>summary{cursor:pointer;list-style:none;padding:14px 16px;background:#101a30;
        display:flex;align-items:center;gap:12px;justify-content:space-between}
  .finding>summary::-webkit-details-marker{display:none}
  .finding .ftitle{color:var(--cyan);font-weight:700;font-size:15px}
  .finding .fbody{padding:6px 16px 18px}
  .kv{display:grid;grid-template-columns:160px 1fr;gap:0}
  .kv>div{padding:9px 10px;border-bottom:1px solid var(--line);font-size:13.5px}
  .kv .k{color:var(--muted)}
  .codeblk{background:#070b16;border:1px solid var(--line);border-radius:8px;padding:12px;
        font-family:'Cascadia Code',Consolas,'Courier New',monospace;font-size:12.5px;
        white-space:pre-wrap;word-break:break-word;color:#cdd6ea;margin-top:6px}
  .lbl{color:var(--muted);font-size:12px;margin-top:14px}
  .resp-hit{color:var(--red);font-weight:600}
  .empty{padding:50px 20px;text-align:center;color:var(--muted)}
  .empty code{background:#0b1120;padding:2px 6px;border-radius:6px;border:1px solid var(--line)}
  .foot{margin-top:50px;padding-top:18px;border-top:1px solid var(--line);color:var(--muted);font-size:12px;text-align:center}
  .updated{color:var(--muted);font-size:12px}
</style>
</head>
<body>
  <div class="topbar">
    <span class="brand">◆ AEGIS-LLM</span>
    <span id="confidential">CONFIDENTIAL — FOR AUTHORIZED USE ONLY</span>
    <span class="updated" id="updated"></span>
  </div>
  <div class="wrap">
    <div class="hero">
      <div>
        <h1>LLM Security Assessment</h1>
        <div class="sub" id="meta-sub">Loading…</div>
      </div>
      <div class="controls">
        <select id="run-select" title="Select a Garak run"></select>
        <button id="refresh">↻ Refresh</button>
        <button id="autobtn">Auto: Off</button>
        <button id="print">⎙ Print / PDF</button>
      </div>
    </div>
    <div id="app"><div class="empty">Loading report…</div></div>
    <div class="foot" id="foot"></div>
  </div>

<script>
const SEV_COLOR = {CRITICAL:'#ef4444',HIGH:'#f59e0b',MEDIUM:'#eab308',LOW:'#22c55e',PASS:'#22c55e'};
let autoTimer = null;

function esc(s){return (s==null?'':String(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtBytes(n){if(!n)return '';const u=['B','KB','MB','GB'];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++;}return n.toFixed(i?1:0)+' '+u[i];}
function fmtTime(t){if(!t)return '';try{const d=new Date(t*1000);return d.toLocaleString();}catch(e){return '';}}

async function loadRuns(){
  const r = await fetch('/api/runs'); const j = await r.json();
  const sel = document.getElementById('run-select');
  document.getElementById('foot').textContent = 'Watching: ' + j.folder;
  if(!j.runs || !j.runs.length){ sel.innerHTML='<option>No runs found</option>'; return j; }
  sel.innerHTML = j.runs.map((x,i)=>`<option value="${esc(x.name)}">${esc(x.name)} • ${fmtTime(x.mtime)}</option>`).join('');
  return j;
}

async function loadReport(file){
  const url = '/api/report' + (file?('?file='+encodeURIComponent(file)):'');
  const r = await fetch(url); const data = await r.json();
  render(data);
}

function donut(score,grade){
  const R=78, C=2*Math.PI*R, pct=Math.max(0,Math.min(100,score))/100;
  const col = score>=80?'#22c55e':score>=60?'#eab308':score>=40?'#f59e0b':'#ef4444';
  const off = C*(1-pct);
  return `<div class="donut"><svg width="180" height="180" viewBox="0 0 180 180">
    <circle cx="90" cy="90" r="${R}" fill="none" stroke="#1a2440" stroke-width="14"/>
    <circle cx="90" cy="90" r="${R}" fill="none" stroke="${col}" stroke-width="14"
        stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"/>
  </svg><div class="score"><div class="num" style="color:${col}">${score}</div>
    <div class="den">/ 100</div><div class="grade">Grade ${esc(grade)}</div></div></div>`;
}

function sectionHead(num,title){
  return `<div class="section-head"><span class="section-num">${num}</span><span class="section-title">${esc(title)}</span></div>`;
}

function render(data){
  const app = document.getElementById('app');
  if(data.error === 'no_reports'){
    app.innerHTML = `<div class="empty">No Garak report files found in<br><code>${esc(data.folder)}</code><br><br>Run a Garak scan, then press <b>Refresh</b>.</div>`;
    document.getElementById('meta-sub').textContent='No report loaded';
    return;
  }
  if(data.error){
    app.innerHTML = `<div class="empty">Could not parse <code>${esc(data.file||'')}</code><br>${esc(data.detail||'')}</div>`;
    return;
  }
  const m=data.meta, s=data.summary;
  document.getElementById('meta-sub').innerHTML =
    `Target: <b>${esc(m.model)}</b> &nbsp;•&nbsp; Garak ${esc(m.garak_version)} &nbsp;•&nbsp; ${m.probe_count} probes`
    + (m.generations?(` &nbsp;•&nbsp; ${esc(m.generations)} generations`):'');
  document.getElementById('updated').textContent = 'Run: ' + (m.start_time||m.file||'');

  let h = '';

  // 01 Executive Summary
  h += `<div class="section">${sectionHead('01','Executive Summary')}<div class="panel">
    <div class="summary-grid">
      <div>${donut(s.score,s.grade)}</div>
      <div>
        <div class="headline-title">OVERALL ASSESSMENT</div>
        <div class="headline-text">${esc(s.headline)}</div>
        <div class="stat-row">
          <div class="stat"><div class="v">${s.total_probes}</div><div class="l">Probes</div></div>
          <div class="stat"><div class="v">${s.total_attempts}</div><div class="l">Attempts</div></div>
          <div class="stat"><div class="v" style="color:#ef4444">${s.total_hits}</div><div class="l">Hits</div></div>
          <div class="stat"><div class="v" style="color:#22c55e">${s.resilience_pct}%</div><div class="l">Resilience</div></div>
        </div>
      </div>
    </div>
    <table><thead><tr><th>Finding</th><th>Hit Rate</th><th>Severity</th><th>Framework</th></tr></thead><tbody>
      ${data.findings.map(f=>`<tr>
        <td><b>${esc(f.probe)}</b><br><span class="bar-label a">${esc(f.atlas_technique)}</span></td>
        <td>${f.hit_pct}%</td>
        <td><span class="pill sev-${f.severity}">${f.severity}</span></td>
        <td><span class="bar-label a">${esc(f.atlas_id)} / ${esc(f.owasp)}</span></td>
      </tr>`).join('')}
    </tbody></table>
  </div></div>`;

  // 02 Vulnerability Findings
  h += `<div class="section">${sectionHead('02','Vulnerability Findings')}`;
  h += data.findings.map(f=>{
    const col = SEV_COLOR[f.severity]||'#888';
    return `<div class="bar-row">
      <div class="bar-label"><div class="p">${esc(f.probe)}</div><div class="a">${esc(f.atlas_id)}</div></div>
      <div class="bar-track"><div class="bar-fill" style="width:${f.hit_pct}%;background:${col}"></div></div>
      <div class="bar-pct" style="color:${col}">${f.hit_pct}%</div>
      <div class="bar-frac">${f.hits}/${f.total} &nbsp;<span class="pill sev-${f.severity}">${f.severity}</span></div>
    </div>`;
  }).join('');

  // Detailed finding cards
  h += data.findings.map((f,i)=>`<details class="finding" ${i===0?'open':''}>
    <summary><span class="ftitle">Finding Detail — ${esc(f.probe)}</span>
      <span class="pill sev-${f.severity}">${f.severity}</span></summary>
    <div class="fbody">
      <div class="kv">
        <div class="k">ATLAS ID</div><div>${esc(f.atlas_id)} — ${esc(f.atlas_technique)}</div>
        <div class="k">OWASP</div><div>${esc(f.owasp)} — ${esc(f.owasp_name)}</div>
        <div class="k">Detector</div><div>${esc(f.detector||'—')}</div>
        <div class="k">Hit Rate</div><div>${f.hit_pct}% (${f.hits} of ${f.total} attempts)</div>
        <div class="k">Severity</div><div><span class="pill sev-${f.severity}">${f.severity}</span></div>
        <div class="k">Description</div><div>${esc(f.description)}</div>
      </div>
      ${f.goal?`<div class="lbl">Attack Goal:</div><div class="codeblk">${esc(f.goal)}</div>`:''}
      ${f.payload?`<div class="lbl">Attack Payload Example:</div><div class="codeblk">${esc(f.payload)}</div>`:''}
      ${f.response?`<div class="lbl">Model Response${f.hits?' (hit)':''}:</div><div class="codeblk ${f.hits?'resp-hit':''}">${esc(f.response)}</div>`:''}
    </div>
  </details>`).join('');
  h += `</div>`;

  // 03 MITRE ATLAS Mapping
  h += `<div class="section">${sectionHead('03','MITRE ATLAS Framework Mapping')}<div class="panel">
    <table><thead><tr><th>Probe Family</th><th>ATLAS ID</th><th>Technique</th><th>OWASP</th><th>Tactic</th><th>Max Severity</th></tr></thead><tbody>
    ${data.atlas_mapping.map(a=>`<tr>
      <td><b>${esc(a.probe_family)}</b></td><td>${esc(a.atlas_id)}</td><td>${esc(a.technique)}</td>
      <td>${esc(a.owasp)}</td><td>${esc(a.tactic)}</td>
      <td><span class="pill sev-${a.max_severity}">${a.max_severity}</span></td>
    </tr>`).join('')}
    </tbody></table></div></div>`;

  // 04 Recommendations
  h += `<div class="section">${sectionHead('04','Recommendations')}<div class="panel">
    <table><thead><tr><th>#</th><th>Recommendation</th><th>Priority</th><th>Effort</th></tr></thead><tbody>
    ${data.recommendations.map(r=>`<tr>
      <td><b>${esc(r.id)}</b></td><td>${esc(r.text)}</td>
      <td><span class="prio-${r.priority}">${r.priority}</span></td><td>${esc(r.effort)}</td>
    </tr>`).join('')}
    </tbody></table></div></div>`;

  app.innerHTML = h;
}

async function refreshAll(keepSelection){
  const sel = document.getElementById('run-select');
  const cur = keepSelection ? sel.value : null;
  const runs = await loadRuns();
  if(runs.runs && runs.runs.length){
    if(cur){ sel.value = cur; }
    await loadReport(sel.value);
  } else {
    await loadReport();
  }
}

document.getElementById('refresh').addEventListener('click',()=>refreshAll(true));
document.getElementById('run-select').addEventListener('change',e=>loadReport(e.target.value));
document.getElementById('print').addEventListener('click',()=>window.print());
document.getElementById('autobtn').addEventListener('click',function(){
  if(autoTimer){clearInterval(autoTimer);autoTimer=null;this.textContent='Auto: Off';}
  else{autoTimer=setInterval(()=>refreshAll(false),5000);this.textContent='Auto: On (5s)';}
});

refreshAll(false);
</script>
</body>
</html>
"""


# --------------------------------------------------------------------------- #
#  Entry point                                                                 #
# --------------------------------------------------------------------------- #

def main():
    global GARAK_DIR
    ap = argparse.ArgumentParser(description="AEGIS-LLM Garak report dashboard")
    ap.add_argument("--dir", help="Path to your garak_runs folder", default=None)
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--no-browser", action="store_true")
    ap.add_argument("--selftest", action="store_true", help="Parse reports and print JSON summary, then exit")
    args = ap.parse_args()

    GARAK_DIR = os.path.abspath(os.path.expanduser(args.dir)) if args.dir else default_garak_dir()

    if args.selftest:
        reports = list_reports(GARAK_DIR)
        print("Folder:", GARAK_DIR)
        print("Reports found:", [r["name"] for r in reports])
        if reports:
            data = parse_report(reports[0]["path"])
            print(json.dumps(data, indent=2)[:6000])
        return

    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    url = "http://" + str(args.host) + ":" + str(args.port) + "/"
    print("=" * 60)
    print(" AEGIS-LLM  —  Garak Report Dashboard")
    print(" Watching folder : {}".format(GARAK_DIR))
    print(" Dashboard       : {}".format(url))
    print(" Press Ctrl+C to stop.")
    print("=" * 60)
    if not os.path.isdir(GARAK_DIR):
        print(" [!] Folder not found yet. Run a Garak scan or pass --dir <path>.")
    if not args.no_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        httpd.server_close()


if __name__ == "__main__":
    main()
