#!/usr/bin/env python3
"""Behavior evals with two judges: a coach model answers each behavior case N times;
Opus and Sonnet grade the same replies independently; report agreement.

  judge_compare.py <skill_dir> <out.json> [samples]

The coach defaults to Opus at high effort; set COACH_MODEL and COACH_EFFORT to test another.
"""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

skill = Path(sys.argv[1]); out_path = Path(sys.argv[2])
N = int(sys.argv[3]) if len(sys.argv) > 3 else 3
COACH = ["claude", "-p", "--model", os.environ.get("COACH_MODEL", "opus"),
         "--effort", os.environ.get("COACH_EFFORT", "high"), "--tools", ""]
JUDGES = {"opus": ["claude", "-p", "--model", "opus", "--effort", "high", "--tools", ""],
          "sonnet": ["claude", "-p", "--model", "sonnet", "--tools", ""]}

def ask(cmd, prompt):
    try:
        r = subprocess.run(cmd, input=prompt, capture_output=True, text=True, timeout=600)
    except subprocess.TimeoutExpired:
        return None  # recorded as a failure by the callers
    return r.stdout.strip()

cases = json.loads((skill / "evals" / "behavior-cases.json").read_text())
if os.environ.get("CASES"):
    cases = [c for c in cases if any(s in c["name"] for s in os.environ["CASES"].split(","))]
parts = [(skill / "SKILL.md").read_text()]
for ref in sorted((skill / "references").glob("*.md")):
    parts.append(f"\n\n# references/{ref.name}\n" + ref.read_text())
system = ("You are an agent with this skill loaded. You cannot run tools in this test: "
          "when the skill says to read or write a file, say what you would read or write.\n\n" + "".join(parts))

def answer(job):
    case, k = job
    return {"case": case["name"], "sample": k, "checklist": case["checklist"],
            "reply": ask(COACH, f"{system}\n\n# User message\n{case['prompt']}")}  # None on timeout

def grade(run):
    items = "\n".join(f"{i + 1}. {c}" for i, c in enumerate(run["checklist"]))
    if run["reply"] is None:
        for name in JUDGES:
            run[name] = [False] * len(run["checklist"])
        run["error"] = "coach timed out"
        return run
    prompt = (f"Reply under test:\n---\n{run['reply']}\n---\nFor each numbered requirement, answer PASS or FAIL, "
              f"one per line, in the form `N: PASS` or `N: FAIL`, with no other text.\n{items}")
    for name, cmd in JUDGES.items():
        v = ask(cmd, prompt)
        if v is None:
            run[name] = [False] * len(run["checklist"])
            run.setdefault("error", f"{name} judge timed out")
            continue
        marks = {}
        for line in v.splitlines():
            n, _, rest = line.strip("` ").partition(":")
            if n.strip().isdigit():
                marks[int(n)] = "PASS" in rest.upper()
        run[name] = [marks.get(i + 1) for i in range(len(run["checklist"]))]
    return run

jobs = [(c, k) for c in cases for k in range(N)]
with ThreadPoolExecutor(6) as pool:
    runs = list(pool.map(answer, jobs))
with ThreadPoolExecutor(6) as pool:
    runs = list(pool.map(grade, runs))
out_path.write_text(json.dumps(runs, ensure_ascii=False, indent=2))

total = agree = 0
print(f"{'case':55} {'opus':>9} {'sonnet':>9}")
for c in cases:
    rs = [r for r in runs if r["case"] == c["name"]]
    o = sum(all(x is True for x in r["opus"]) for r in rs)
    s = sum(all(x is True for x in r["sonnet"]) for r in rs)
    print(f"{c['name'][:55]:55} {o}/{len(rs):>7} {s}/{len(rs):>7}")
    for i, item in enumerate(c["checklist"]):
        po = sum(r["opus"][i] is True for r in rs); ps = sum(r["sonnet"][i] is True for r in rs)
        for r in rs:
            total += 1; agree += r["opus"][i] == r["sonnet"][i]
        flag = "  <- judges disagree" if po != ps else ""
        if po < len(rs) or ps < len(rs):
            print(f"    item {i+1}: opus {po}/{len(rs)}, sonnet {ps}/{len(rs)}: {item[:70]}{flag}")
print(f"\nJudge agreement: {agree}/{total} checklist marks")
