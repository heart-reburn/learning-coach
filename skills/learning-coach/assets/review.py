#!/usr/bin/env python3
"""Spaced review from local files. No server, no free-text parsing.

Inputs
  concept-registry.json  hand-written list: [{slug, title, unit, page, questions: ["02a.q2", ...]}]
                         (or {"concepts": [...]}). A question id is "<page>.q<number>".
  results.json           attempt records, one per page taken:
                         [{page, kind, at, questions: [{q, sure, reasonMark, right, credit, opened?, id?}]}]
                         A review page's questions carry id (the source question) so they map to a concept.

Commands
  review.py add    results.json "<result line>" [--date YYYY-MM-DD] [--ids "q1=02a.q2,..."]
  review.py queue  --registry R --results F [--out review-queue.csv] [--today D] [--gaps 1,3,7,14,30] [--deadline D]
  review.py page   --queue review-queue.csv --registry R --results F --pages lessons drills --out drills/0009-review.html
                   [--size 12] [--today D]

The spacing rule (one place, used by queue and page)
  Each concept has a rung, starting at 0. One page's questions on a concept give one verdict:
    miss  any question wrong (or partial credit): rung 0, lapses + 1, streak 0
    hold  all right but one was guessing, had a wrong reason mark, or opened a term: rung unchanged, streak 0
    good  all right, sure, reason right: rung + 1, streak + 1
  Next review = last date + gaps[rung] days, never later than the deadline. A rung past the last gap is solid
  (no review due). Status: new (never asked), solid, shaky (last verdict miss, or rung below 2), ok.
"""
import argparse, csv, datetime as dt, json, os, random, re, subprocess, sys, html

COLS = ["concept", "title", "unit", "page", "last_result", "last_date", "rung", "lapses", "streak", "errors", "due", "status"]
DEFAULT_GAPS = [1, 3, 7, 14, 30]


def unit_key(u):
    s = str(u).strip()
    return s.zfill(2) if s.isdigit() else s


def load_registry(path):
    d = json.load(open(path, encoding="utf8"))
    reg = d["concepts"] if isinstance(d, dict) else d
    out = []
    for c in reg:
        out.append({"slug": c["slug"], "title": c.get("title", c["slug"]), "unit": unit_key(c.get("unit", "")),
                    "page": c.get("page", ""), "questions": list(c.get("questions", []))})
    return out


def judge(q):
    if not q.get("right") and not (q.get("credit", 0) >= 1):
        return "miss"
    if not q.get("sure") or q.get("reasonMark") in ("wrong", "partly") or q.get("opened"):
        return "hold"
    return "good"


def error_type(q):
    if q.get("right"):
        if q.get("sure") and q.get("reasonMark") != "right":
            return "right, reason not right"
        return "unknown term" if q.get("opened") else None
    if q.get("opened"):
        return "unknown term"
    return "wrong but sure" if q.get("sure") else "wrong, guessing"


def add_days(iso, n):
    return (dt.date.fromisoformat(iso) + dt.timedelta(days=n)).isoformat()


def qid(a, q):
    return q.get("id") or a["page"] + "." + q["q"]


def concept_state(attempts, registry, gaps, deadline=None):
    qmap = {}
    for c in registry:
        for q in c["questions"]:
            qmap[q] = c["slug"]
    st = {}
    for a in sorted(attempts, key=lambda a: a.get("at", "")):
        date = (a.get("at") or "")[:10]
        by = {}
        for q in a.get("questions", []):
            c = qmap.get(qid(a, q))
            if c:
                by.setdefault(c, []).append(q)
        for c, qs in by.items():
            s = st.setdefault(c, {"rung": 0, "lapses": 0, "streak": 0, "seen": 0, "errors": [], "missed": [], "asked": []})
            vs = [judge(q) for q in qs]
            v = "miss" if "miss" in vs else "hold" if "hold" in vs else "good"
            for q in qs:
                s["asked"].append(qid(a, q))
                if judge(q) == "miss":
                    s["missed"].append(qid(a, q))
                e = error_type(q)
                if e and e not in s["errors"]:
                    s["errors"].append(e)
            if v == "miss":
                s["rung"], s["streak"] = 0, 0
                s["lapses"] += 1
            elif v == "good":
                s["rung"] = min(s["rung"] + 1, len(gaps))
                s["streak"] += 1
            else:
                s["streak"] = 0
            s["seen"] += 1
            s["last"], s["verdict"] = date, v
            if s["rung"] >= len(gaps):
                s["due"] = ""
            else:
                d = add_days(date, gaps[s["rung"]])
                s["due"] = min(d, deadline) if deadline else d
            s["status"] = "solid" if s["rung"] >= len(gaps) else "shaky" if v == "miss" or s["rung"] < 2 else "ok"
    return st


def rows(registry, st):
    out = []
    for c in registry:
        s = st.get(c["slug"])
        if not s:
            out.append({"concept": c["slug"], "title": c["title"], "unit": c["unit"], "page": c["page"], "last_result": "", "last_date": "",
                        "rung": 0, "lapses": 0, "streak": 0, "errors": "", "due": "", "status": "new"})
        else:
            out.append({"concept": c["slug"], "title": c["title"], "unit": c["unit"], "page": c["page"], "last_result": s["verdict"],
                        "last_date": s["last"], "rung": s["rung"], "lapses": s["lapses"], "streak": s["streak"],
                        "errors": "; ".join(s["errors"]), "due": s["due"], "status": s["status"]})
    return out


def read_json(p):
    return json.load(open(p, encoding="utf8"))


def cmd_queue(a):
    reg = load_registry(a.registry)
    attempts = read_json(a.results) if os.path.exists(a.results) else []
    gaps = [int(x) for x in a.gaps.split(",")]
    st = concept_state(attempts, reg, gaps, a.deadline)
    rs = rows(reg, st)
    with open(a.out, "w", newline="", encoding="utf8") as f:
        w = csv.DictWriter(f, COLS)
        w.writeheader()
        w.writerows(rs)
    today = a.today or dt.date.today().isoformat()
    due = [r for r in rs if r["due"] and r["due"] <= today and r["status"] != "solid"]
    known = {q for c in reg for q in c["questions"]}
    unmapped = {qid(x, q) for x in attempts for q in x.get("questions", []) if qid(x, q) not in known}
    noq = [c["slug"] for c in reg if not c["questions"]]
    print(f"wrote {a.out}: {len(rs)} concepts, {len(due)} due on {today}")
    if unmapped:
        print(f"warning: {len(unmapped)} answered questions are in no concept (add them to the registry): {sorted(unmapped)[:8]}")
    if noq:
        print(f"warning: {len(noq)} concepts have no question: {noq[:8]}")


def cmd_add(a):
    line = a.line
    m = re.match(r"\s*(\w+)\s+(\S+)\s*\|", line)
    if not m:
        sys.exit("not a result line")
    kind, page = m.group(1).lower(), m.group(2)
    marks_part = line.split("| marks:", 1)[1].split("| answers changed")[0].split("| page feedback")[0] if "| marks:" in line else ""
    missed = set(re.findall(r"q\d+", (re.search(r"missed: ([^|]*)", line) or [0, ""])[1]))
    partial = {k: v for k, v in re.findall(r"(q\d+) ([\d.]+|half|partly)", (re.search(r"partial credit: ([^|]*)", line) or [0, ""])[1])}
    ids = dict(x.split("=") for x in a.ids.split(",")) if a.ids else {}
    if not ids:
        ix = re.search(r"\| ids: ([^|]*)", line)
        ids = dict(x.strip().split(" ") for x in ix.group(1).split(";")) if ix else {}
    qs = []
    for part in [p.strip() for p in marks_part.split(";") if p.strip()]:
        mm = re.match(r"(q\d+) (sure|guessing)(?: \(term opened\))?, reason (right|partly|wrong)", part)
        if not mm:
            continue
        k = mm.group(1)
        right = k not in missed or (k in partial)
        credit = 0 if k in missed and k not in partial else 1
        if k in partial:
            right, credit = False, 0.5
        rec = {"q": k, "sure": mm.group(2) == "sure", "reasonMark": mm.group(3), "opened": "(term opened)" in part, "right": right and k not in missed, "credit": credit}
        if k in ids:
            rec["id"] = ids[k]
        qs.append(rec)
    if not qs:
        sys.exit("no marks found in the result line")
    at = (a.date or dt.date.today().isoformat()) + "T12:00:00.000Z"
    data = read_json(a.results) if os.path.exists(a.results) else []
    data.append({"page": page, "kind": kind, "at": at, "questions": qs})
    json.dump(data, open(a.results, "w", encoding="utf8"), indent=1, ensure_ascii=False)
    print(f"added {page} with {len(qs)} questions to {a.results}")


def lesson_questions(path):
    js = r"""const fs=require('fs'),vm=require('vm');const out={};
for(const f of process.argv.slice(1)){const h=fs.readFileSync(f,'utf8');const m=h.match(/<script>\s*(window\.LESSON[\s\S]*?)<\/script>/);if(!m)continue;
const w={};try{vm.runInNewContext(m[1],{window:w},{timeout:1000});}catch(e){continue}
const d=h.match(/<html[^>]*>/);out[f]={L:w.LESSON,html:d?d[0]:''};}
console.log(JSON.stringify(out));"""
    return json.loads(subprocess.check_output(["node", "-e", js] + path))


def find_page_file(page, dirs):
    for d in dirs:
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if f.endswith(".html") and (f[:-5] == page or f.startswith(page + "-")):
                return os.path.join(d, f)
    return None


def cmd_page(a):
    reg = {c["slug"]: c for c in load_registry(a.registry)}
    today = a.today or dt.date.today().isoformat()
    qrows = list(csv.DictReader(open(a.queue, encoding="utf8")))
    live = [r for r in qrows if r["status"] != "solid" and r["status"] != "new"]
    live.sort(key=lambda r: (0 if r["due"] and r["due"] <= today else 1, int(r["rung"]), -int(r["lapses"]), r["last_date"]))
    attempts = read_json(a.results) if a.results and os.path.exists(a.results) else []
    st = concept_state(attempts, list(reg.values()), DEFAULT_GAPS)
    picks = []
    for r in live:
        c = reg[r["concept"]]
        s = st.get(c["slug"], {"asked": [], "missed": [], "errors": []})
        pool = list(c["questions"])
        random.shuffle(pool)
        fresh = [q for q in pool if q not in s["asked"]]
        old = [q for q in pool if q in s["asked"] and q not in s["missed"]]
        back = [q for q in pool if q in s["missed"]]
        order = fresh + old + back if "wrong but sure" in s["errors"] else fresh + back + old
        picks += [(c["slug"], q) for q in order[:2]]
        if len(picks) >= a.size:
            break
    picks = picks[: a.size]
    if not picks:
        sys.exit("nothing to review: no concept is shaky, ok or due")
    files = {}
    for slug, q in picks:
        page = q.split(".")[0]
        files[page] = find_page_file(page, a.pages)
    missing = [p for p, f in files.items() if not f]
    if missing:
        print("warning: no page file found for " + ", ".join(missing) + "; those questions are skipped (pass the folder with --pages)", file=sys.stderr)
        picks = [(s, q) for s, q in picks if files[q.split(".")[0]]]
        if not picks:
            sys.exit("no question could be loaded")
    src = lesson_questions(sorted({f for f in files.values() if f}))
    questions, gloss, htag = [], {}, ""
    for slug, q in picks:
        page, n = q.split(".")
        L = src[files[page]]["L"]
        htag = htag or src[files[page]]["html"]
        scored = [x for x in L["questions"] if x.get("sample") is not True]
        item = dict(scored[int(n[1:]) - 1])
        item["id"], item["concept"] = q, slug
        item.pop("at", None)
        questions.append(item)
        for g in L.get("glossary", []):
            t = g["term"]["en"] if isinstance(g["term"], dict) else g["term"]
            gloss.setdefault(t, g)
    bil = re.search(r'data-l2="[^"]*"( data-l2-name="[^"]*")?', htag)
    attrs = (" " + bil.group(0)) if bil else ""
    lang_tag = '<script src="../assets/lang.js"></script>\n' if bil else ""
    lesson = {"id": "review-" + today, "kind": "review", "reason": True, "concepts": sorted({s for s, _ in picks}),
              "glossary": list(gloss.values()), "recall": [], "questions": questions}
    page = f"""<!doctype html>
<html lang="en"{attrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Review {today}</title>
{lang_tag}<link rel="stylesheet" href="../assets/lesson.css">
</head>
<body>
<main>
<noscript><p class="note">This page needs JavaScript.</p></noscript>
<h1>Review round</h1>
<p class="meta">{len(questions)} questions on {len(lesson['concepts'])} concepts that are due or weakest · built {today}</p>
<h2>Terms on this page</h2>
<div id="glossary"></div>
<h2>Practice</h2>
<div class="note"><strong>Closed book.</strong> Do not open any source while you answer.</div>
<div id="quiz"></div>
<h2>Feedback on this page</h2>
<div id="feedback"></div>
<h2>Your result</h2>
<p>Copy this line and paste it to your coach.</p>
<div class="result" id="result"></div>
<p class="row" style="margin-top:.6rem"><button id="copy">Copy result</button></p>
</main>
<script>
window.LESSON = {json.dumps(lesson, ensure_ascii=False, indent=1).replace("</", "<\\/")};
</script>
<script src="../assets/quiz.js"></script>
</body>
</html>
"""
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    open(a.out, "w", encoding="utf8").write(page)
    print(f"built {a.out} for {today}: {len(questions)} questions, {len(lesson['concepts'])} concepts, {sum(1 for r in live if r['due'] and r['due'] <= today)} concepts due")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest="cmd", required=True)
    q = sp.add_parser("queue")
    q.add_argument("--registry", required=True); q.add_argument("--results", required=True)
    q.add_argument("--out", default="review-queue.csv"); q.add_argument("--today")
    q.add_argument("--gaps", default=",".join(map(str, DEFAULT_GAPS))); q.add_argument("--deadline")
    q.set_defaults(f=cmd_queue)
    ad = sp.add_parser("add")
    ad.add_argument("results"); ad.add_argument("line"); ad.add_argument("--date"); ad.add_argument("--ids")
    ad.set_defaults(f=cmd_add)
    pg = sp.add_parser("page")
    pg.add_argument("--queue", required=True); pg.add_argument("--registry", required=True); pg.add_argument("--results")
    pg.add_argument("--pages", nargs="+", required=True); pg.add_argument("--out", required=True)
    pg.add_argument("--size", type=int, default=12); pg.add_argument("--today")
    pg.set_defaults(f=cmd_page)
    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
