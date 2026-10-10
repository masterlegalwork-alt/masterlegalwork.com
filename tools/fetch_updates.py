#!/usr/bin/env python3
"""Fetch public legal RSS feeds and write updates/updates.json (headline, short excerpt, link, source, date).
Headlines and short excerpts only, with attribution and a link to the source; full articles are never copied.
Run by the scheduled GitHub Action (.github/workflows/legal-updates.yml) or by hand: python3 tools/fetch_updates.py <site_dir>"""
import json, re, sys, html, urllib.request, datetime, email.utils, xml.etree.ElementTree as ET
OUT = (sys.argv[1] if len(sys.argv) > 1 else "site") + "/updates/updates.json"
FEEDS = [
    ("LiveLaw", "https://www.livelaw.in/google_feeds.xml", None),
    ("Bar & Bench", "https://www.barandbench.com/feed", None),
    ("Verdictum", "https://www.verdictum.in/feed", None),
    ("LawTrend", "https://lawtrend.in/feed/", None),
    ("Indian Kanoon (Supreme Court judgments)", "https://indiankanoon.org/feeds/latest/supremecourt/", "Supreme Court"),
    ("PIB (Government of India)", "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3", "Legislation"),
]
CATS = [
    ("Supreme Court", r"\bsupreme court\b|\bSC\b|\bCJI\b"),
    ("High Courts", r"high court|\bHC\b"),
    ("Legislation", r"\bbill\b|\bact,? 20\d\d|amendment|ordinance|notification|parliament|rules,? 20\d\d|\bBNS\b|\bBNSS\b|\bBSA\b|ministry of law|law commission"),
    ("Consumer", r"consumer|NCDRC|deficiency in service"),
    ("Criminal", r"\bbail\b|\bFIR\b|criminal|accused|NDPS|PMLA|murder|chargesheet|quash"),
]
PIB_KEEP = r"law and justice|legislat|\bbill\b|\bact\b|court|judicia|legal|justice|tribunal|amendment"
MAX_PER_CAT, EXCERPT = 8, 220

def clean(s):
    s = re.sub(r"<[^>]+>", " ", html.unescape(s or ""))
    s = re.sub(r"\s+", " ", s).strip()
    return (s[:EXCERPT].rsplit(" ", 1)[0] + "\u2026") if len(s) > EXCERPT else s

def when(s):
    try: return email.utils.parsedate_to_datetime(s).astimezone(datetime.timezone.utc).isoformat()
    except Exception: return ""

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as r: return r.read()

items, status = [], []
for src, url, force in FEEDS:
    try:
        root = ET.fromstring(fetch(url)); n = 0
        for it in root.iter("item"):
            t = clean(it.findtext("title")); l = (it.findtext("link") or "").strip()
            if not t or not l.startswith("http"): continue
            d = clean(it.findtext("description"))
            if src.startswith("PIB") and not re.search(PIB_KEEP, t + " " + d, re.I): continue
            cats = [force] if force else [c for c, rx in CATS if re.search(rx, t + " " + d, 0 if c == "Supreme Court" else re.I) or (c == "Supreme Court" and re.search(r"supreme court", t + " " + d, re.I))]
            for cat in (cats or ["Other"]):
                items.append({"title": t, "excerpt": d if d != t else "", "link": l, "source": src, "date": when(it.findtext("pubDate")), "category": cat})
            n += 1
        status.append({"source": src, "ok": True, "items": n})
    except Exception as e:
        status.append({"source": src, "ok": False, "error": str(e)[:120]})
seen, out = set(), {}
for it in sorted(items, key=lambda x: x["date"], reverse=True):
    k = it["category"] + it["title"].lower()[:90]
    if k in seen: continue
    seen.add(k); out.setdefault(it["category"], [])
    if len(out[it["category"]]) < MAX_PER_CAT: out[it["category"]].append(it)
order = ["Supreme Court", "High Courts", "Legislation", "Consumer", "Criminal", "Other"]
data = {"generated": datetime.datetime.now(datetime.timezone.utc).isoformat(), "categories": [{"name": c, "items": out.get(c, [])} for c in order if out.get(c)], "feeds": status,
        "note": "Headlines and short excerpts from public RSS feeds, with links to the original sources. Not legal advice; Master Legal Work is not responsible for third-party content."}
import os; os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(data, open(OUT, "w"), ensure_ascii=False, indent=1)
print("wrote", OUT, {c["name"]: len(c["items"]) for c in data["categories"]}, [s for s in status if not s["ok"]])
