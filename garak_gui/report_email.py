#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SynAIpse Scanner - report export + email (standard library only).

Provides:
  * build_pdf_report(data)  -> bytes   : a clean multi-page PDF (no deps)
  * send_email_report(...)  -> (ok, info)
  * smtp_configured()       -> bool

`data` is the dict produced by garak_gui.build_report_data().
No third-party packages are used, so this runs in the same minimal
Python environment that hosts garak.
"""
import os
import re
import smtplib
from datetime import datetime
from email.message import EmailMessage


# ---------------------------------------------------------------------------
# SMTP configuration (read at call-time so launcher .bat env vars are picked up)
# ---------------------------------------------------------------------------
def _smtp_cfg():
    return {
        "host": os.environ.get("SMTP_HOST", "").strip(),
        "port": int(os.environ.get("SMTP_PORT", "587") or 587),
        "user": os.environ.get("SMTP_USER", "").strip(),
        "pass": os.environ.get("SMTP_PASS", "").strip(),
        "tls": os.environ.get("SMTP_TLS", "true").strip().lower() not in ("0", "false", "no"),
        "from": (os.environ.get("EMAIL_FROM", "").strip() or os.environ.get("SMTP_USER", "").strip()),
        "to": os.environ.get("EMAIL_TO", "").strip(),
    }


def smtp_configured():
    c = _smtp_cfg()
    return bool(c["host"] and c["from"])


def default_recipient():
    return _smtp_cfg()["to"]


# ---------------------------------------------------------------------------
# Tiny helpers
# ---------------------------------------------------------------------------
def _oneline(s, limit=260):
    t = re.sub(r"\s+", " ", str(s or "")).strip()
    return (t[:limit] + "...") if len(t) > limit else t


def _pdf_escape(s):
    return str(s).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


# ---------------------------------------------------------------------------
# Pure-stdlib PDF generator (Helvetica, multi-page, auto-wrap)
# ---------------------------------------------------------------------------
PW, PH = 612, 792            # US Letter
ML, MR, MT, MB = 54, 54, 56, 56
USABLE = PW - ML - MR

# kind -> (font, size, (r,g,b), gap_before, gap_after)
_SPEC = {
    "h1":     ("F2", 19, (0.05, 0.06, 0.09), 10, 7),
    "h2":     ("F2", 13, (0.10, 0.10, 0.16), 16, 5),
    "h3":     ("F2", 11, (0.12, 0.12, 0.18), 9, 2),
    "body":   ("F1", 10, (0.16, 0.17, 0.22), 0, 3),
    "small":  ("F1", 8,  (0.45, 0.47, 0.52), 0, 2),
    "bullet": ("F1", 10, (0.16, 0.17, 0.22), 0, 3),
}
_SEV_COLOR = {
    "CRITICAL": (0.78, 0.13, 0.13),
    "HIGH":     (0.85, 0.42, 0.05),
    "MEDIUM":   (0.74, 0.60, 0.03),
    "LOW":      (0.20, 0.45, 0.20),
    "PASS":     (0.20, 0.55, 0.30),
}


def _wrap(text, size, indent=0):
    avail = USABLE - indent
    maxc = max(8, int(avail / (size * 0.52)))
    out, cur = [], ""
    for w in str(text).split():
        while len(w) > maxc:
            if cur:
                out.append(cur)
                cur = ""
            out.append(w[:maxc])
            w = w[maxc:]
        if not cur:
            cur = w
        elif len(cur) + 1 + len(w) <= maxc:
            cur += " " + w
        else:
            out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out or [""]


def build_pdf_report(data):
    data = data or {}
    meta = data.get("meta", {}) or {}
    summary = data.get("summary", {}) or {}
    findings = data.get("findings", []) or []
    recs = data.get("recommendations", []) or []
    about = (data.get("about") or {}).get("paragraphs", []) or []

    # token stream: (kind, text, indent, color_override)
    toks = []

    def add(kind, text="", indent=0, color=None):
        toks.append((kind, text, indent, color))

    add("h1", "SynAIpse - LLM Vulnerability Report")
    add("small", "Generated " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    add("h2", "Target")
    add("body", "Model / target:  %s" % meta.get("model", "?"))
    add("body", "garak %s    Run ID: %s" % (meta.get("garak_version", "?"), meta.get("run_id", "") or "-"))
    add("body", "Probes: %s    Generations: %s" % (meta.get("probe_count", ""), meta.get("generations", "") or "-"))

    add("h2", "Overall result")
    grade = summary.get("grade", "-")
    gcol = (0.20, 0.55, 0.30) if grade in ("A", "B") else (0.74, 0.60, 0.03) if grade == "C" else (0.78, 0.13, 0.13)
    add("h1", "Grade %s    Resilience %d / 100" % (grade, summary.get("score", 0)), color=gcol)
    add("body", "Attacks succeeded in %d of %d attempts across %d probe(s)."
        % (summary.get("total_hits", 0), summary.get("total_attempts", 0), summary.get("total_probes", 0)))

    if about:
        add("h2", "About these vulnerabilities")
        for p in about:
            add("body", p)

    add("h2", "Findings by severity")
    if not findings:
        add("body", "No findings were parsed from the report.")
    for f in findings:
        sev = f.get("severity", "?")
        add("h3", "[%s]  %s   -   %d%% hit" % (sev, f.get("probe", "?"), f.get("hit_pct", 0)),
            color=_SEV_COLOR.get(sev))
        add("body", "OWASP %s %s  |  MITRE ATLAS %s  |  %d/%d attacks succeeded"
            % (f.get("owasp", ""), f.get("owasp_name", ""), f.get("atlas_id", ""),
               f.get("hits", 0), f.get("total", 0)))
        if f.get("description"):
            add("body", f.get("description"))
        if f.get("payload"):
            add("bullet", "Example prompt: " + _oneline(f["payload"]), indent=14)
        if f.get("response"):
            add("bullet", "Model response: " + _oneline(f["response"]), indent=14)

    if recs:
        add("h2", "Recommended remediations")
        for r in recs:
            add("bullet", "[%s | effort: %s] %s"
                % (r.get("priority", ""), r.get("effort", ""), r.get("text", "")), indent=14)

    # --- layout into pages ---
    pages, cur = [], []
    y = PH - MT

    def flush():
        if cur:
            pages.append(list(cur))

    for kind, text, indent, color in toks:
        font, size, base_color, gap_b, gap_a = _SPEC[kind]
        col = color or base_color
        y -= gap_b
        prefix = "-  " if kind == "bullet" else ""
        lines = _wrap(prefix + str(text) if prefix else str(text), size, indent)
        lh = size * 1.4
        for idx, ln in enumerate(lines):
            if y - lh < MB:
                flush()
                cur = []
                y = PH - MT
            x = ML + indent + (14 if (kind == "bullet" and idx > 0) else 0)
            r, g, b = col
            cur.append("%.3f %.3f %.3f rg BT /%s %d Tf 1 0 0 1 %.1f %.1f Tm (%s) Tj ET"
                       % (r, g, b, font, size, x, y, _pdf_escape(ln)))
            y -= lh
        y -= gap_a
    flush()
    if not pages:
        pages = [[]]

    # --- assemble PDF objects ---
    catalog_id, pages_id, f1_id, f2_id = 1, 2, 3, 4
    body = {}
    kids, next_id = [], 5
    for pg in pages:
        stream = ("\n".join(pg)).encode("latin-1", "replace")
        cid, pid = next_id, next_id + 1
        next_id += 2
        body[cid] = b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream"
        body[pid] = ("<< /Type /Page /Parent %d 0 R /MediaBox [0 0 %d %d] "
                     "/Resources << /Font << /F1 %d 0 R /F2 %d 0 R >> >> /Contents %d 0 R >>"
                     % (pages_id, PW, PH, f1_id, f2_id, cid)).encode()
        kids.append("%d 0 R" % pid)

    body[catalog_id] = ("<< /Type /Catalog /Pages %d 0 R >>" % pages_id).encode()
    body[pages_id] = ("<< /Type /Pages /Count %d /Kids [%s] >>" % (len(pages), " ".join(kids))).encode()
    body[f1_id] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    body[f2_id] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"

    total = next_id - 1
    out = bytearray(b"%PDF-1.4\n")
    offsets = {}
    for i in range(1, total + 1):
        offsets[i] = len(out)
        out += ("%d 0 obj\n" % i).encode() + body[i] + b"\nendobj\n"
    xref_pos = len(out)
    out += ("xref\n0 %d\n" % (total + 1)).encode()
    out += b"0000000000 65535 f \n"
    for i in range(1, total + 1):
        out += ("%010d 00000 n \n" % offsets[i]).encode()
    out += ("trailer\n<< /Size %d /Root %d 0 R >>\nstartxref\n%d\n%%%%EOF"
            % (total + 1, catalog_id, xref_pos)).encode()
    return bytes(out)


# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
def send_email_report(to_addr, subject, body_text, html_str, pdf_bytes,
                      html_name="SynAIpse-report.html", pdf_name="SynAIpse-report.pdf"):
    c = _smtp_cfg()
    to_addr = (to_addr or c["to"]).strip()
    if not (c["host"] and c["from"]):
        return False, "SMTP is not configured (set SMTP_HOST / EMAIL_FROM)."
    if not to_addr:
        return False, "No recipient address provided."

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = c["from"]
    msg["To"] = to_addr
    msg.set_content(body_text)
    if html_str is not None:
        msg.add_attachment(html_str, subtype="html", filename=html_name)
    if pdf_bytes is not None:
        msg.add_attachment(pdf_bytes, maintype="application", subtype="pdf", filename=pdf_name)

    if c["port"] == 465:
        with smtplib.SMTP_SSL(c["host"], c["port"], timeout=30) as s:
            if c["user"]:
                s.login(c["user"], c["pass"])
            s.send_message(msg)
    else:
        with smtplib.SMTP(c["host"], c["port"], timeout=30) as s:
            if c["tls"]:
                s.starttls()
            if c["user"]:
                s.login(c["user"], c["pass"])
            s.send_message(msg)
    return True, "sent"
