#!/usr/bin/env python3
"""Run the skill's evals with any agent CLI that reads a prompt on stdin.

  run_evals.py trigger [skill]    would the skill load for each query?
  run_evals.py behavior [skill]   does the skill behave as the checklist says?

The agent command comes from SKILL_EVAL_CMD, for example
  SKILL_EVAL_CMD="codex exec -" run_evals.py trigger
and defaults to the Claude CLI with the sonnet model and no tools.
Trigger results show whether the description is too broad or too narrow.
Behavior results are a model-graded smoke test, not proof: read the failures.
"""
import json
import os
import re
import shlex
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CMD = shlex.split(os.environ.get("SKILL_EVAL_CMD", "claude -p --model sonnet --tools ''"))


def ask(prompt, system=None):
    if system:
        prompt = f"{system}\n\n# User message\n{prompt}"
    try:
        return subprocess.run(CMD, input=prompt, capture_output=True, text=True, timeout=180).stdout.strip()
    except subprocess.TimeoutExpired:
        return None  # callers record a failure


def frontmatter(skill_dir):
    text = (skill_dir / "SKILL.md").read_text()
    head = text.split("---")[1]
    return {k.strip(): v.strip() for k, _, v in (l.partition(":") for l in head.splitlines() if ":" in l)}


def trigger(skill_dir):
    fm = frontmatter(skill_dir)
    cases = json.loads((skill_dir / "evals" / "trigger-queries.json").read_text())

    def run(case):
        reply = ask(
            f"You have one skill available.\nName: {fm['name']}\nDescription: {fm['description']}\n\n"
            f"User message: {case['query']}\n\nWould you load this skill to handle the message? Answer only YES or NO."
        )
        return case, None if reply is None else reply.upper().startswith("YES")

    with ThreadPoolExecutor(8) as pool:
        results = list(pool.map(run, cases))
    bad = [(c["query"], got) for c, got in results if got != c["should_trigger"]]
    print(f"{skill_dir.name}: {len(results) - len(bad)}/{len(results)} trigger cases correct")
    for q, got in bad:
        print(f"  WRONG ({'timed out' if got is None else 'loaded' if got else 'not loaded'}): {q}")
    return not bad


def grade(verdict, count):
    """Failure notes for a judge reply. A pass needs exactly one `N: PASS` line per checklist item."""
    marks = {}
    for line in verdict.splitlines():
        m = re.fullmatch(r"[`*\s]*(\d+)\s*:\s*(PASS|FAIL)\b.*", line.strip(), re.I)
        if not m:
            if line.strip():
                return [f"malformed judge output: {line.strip()[:60]!r}"]
            continue
        n = int(m.group(1))
        if n in marks or not 1 <= n <= count:
            return [f"unexpected or repeated item {n} in judge output"]
        marks[n] = m.group(2).upper()
    if len(marks) != count:
        return [f"judge returned {len(marks)} of {count} items"]
    return [f"{n}: FAIL" for n in sorted(marks) if marks[n] == "FAIL"]


def behavior(skill_dir):
    cases = json.loads((skill_dir / "evals" / "behavior-cases.json").read_text())
    parts = [(skill_dir / "SKILL.md").read_text()]
    for ref in sorted((skill_dir / "references").glob("*.md")):
        parts.append(f"\n\n# references/{ref.name}\n" + ref.read_text())
    system = (
        "You are an agent with this skill loaded. You cannot run tools in this test: "
        "when the skill says to read or write a file, say what you would read or write.\n\n" + "".join(parts)
    )

    def run(case):
        out = ask(case["prompt"], system)
        if out is None:
            return case, ["timed out answering the case"]
        items = "\n".join(f"{i + 1}. {c}" for i, c in enumerate(case["checklist"]))
        verdict = ask(
            f"Reply under test:\n---\n{out}\n---\nFor each numbered requirement, answer PASS or FAIL, "
            f"one per line, in the form `N: PASS` or `N: FAIL`, with no other text.\n{items}"
        )
        if verdict is None:
            return case, ["timed out grading the reply"]
        return case, grade(verdict, len(case["checklist"]))

    with ThreadPoolExecutor(4) as pool:
        results = list(pool.map(run, cases))
    ok = 0
    for case, fails in results:
        if fails:
            notes = [case["checklist"][int(f.split(":")[0]) - 1] if re.fullmatch(r"\d+: FAIL", f) else f for f in fails]
            print(f"  FAIL {case['name']}: " + "; ".join(notes))
        else:
            ok += 1
    print(f"{skill_dir.name}: {ok}/{len(results)} behavior cases passed")
    return ok == len(results)


def main(argv):
    if len(argv) < 2 or argv[1] not in ("trigger", "behavior"):
        print(__doc__)
        return 2
    skills = [ROOT / "skills" / argv[2]] if len(argv) > 2 else sorted((ROOT / "skills").iterdir())
    func = trigger if argv[1] == "trigger" else behavior
    return 0 if all([func(s) for s in skills]) else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
