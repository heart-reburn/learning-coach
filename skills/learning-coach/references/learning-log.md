# Progress file

Keep one file per subject, named `learning-log-<subject>.md`, in the learner's working folder. A separate working folder per subject is fine; the name stays the same. Read it at the start of every session and update it at the end. It is the only memory between sessions.

```markdown
# Learning log: <subject>

Goal: <what the learner wants to be able to do, and by when>
Out of scope: <what this goal deliberately leaves out, if anything>
Schedule: <sessions per week and usual length>
Placement: <starting level, date, and "unverified" if you could not check the facts>
Lesson pages: <on or off; language, if not English only>
Reason line on lesson pages: <on or off> (drills always on)
Drill step: <mixed choice, mostly multi-select, short answer, or design case>
Last lesson: <number>   Last drill: <number>
Current level: <1-6, name>
Pass criteria for this level: <from levels.md, made specific to the subject>

## Review due
| Material | Next review | Last result |
|---|---|---|

## Sessions
| Date | Kind | Level | Minutes | Actual | Wrong but sure | Right but guessing | Errors and why |
|---|---|---|---|---|---|---|---|

## Checks
| Date | Level | Teach-back score | Gaps named | Rebuild (pass, fail, not yet) | Passed? |
|---|---|---|---|---|---|
```

One row per session. No row means it didn't happen. Kind is "Study", "Lesson 0001", "Drill 0003" or "Deck <id>".

A page's result line becomes one session row:
- Kind and number come from the result line; actual is its score.
- Wrong but sure and right but guessing list the question numbers in those columns.
- Errors and why holds the missed questions with the learner's one-line reasons, sure ones first. A result line marked unfinished is not a session score: ask the learner to finish the page.
- Missed questions and right-but-guessing ones go to Review due at a short interval of one day (the first review step). The recall self-marks update Last result there.
- Update the last lesson or drill number, and the drill step by the rule in `levels.md`.

A page score never passes a level; a check row does, only when the teach-back score and the rebuild both pass.
