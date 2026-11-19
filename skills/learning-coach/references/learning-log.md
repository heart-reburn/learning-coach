# Progress file

Keep one file per subject, named `learning-log-<subject>.md`, in the learner's working folder. A separate working folder per subject is fine; the name stays the same. Read it at the start of every session and update it at the end. It is the only memory between sessions.

```markdown
# Learning log: <subject>

Goal: <what the learner wants to be able to do, and by when>
Out of scope: <what this goal deliberately leaves out, if anything>
Schedule: <sessions per week and usual length>
Placement: <starting level, date, and "unverified" if you could not check the facts>
Formal test: <none, or the exam name and date>; item format: <option count, whether items state how many to pick, seconds per item; from the official exam guide, or the learner's answer if none was found>
Source: <the book, course or guide the map follows>
Lesson pages: <on or off; language, if not English only>
Reason line on lesson pages: <on or off> (drills always on)
Drill step: <single choice, multi-select, short answer, or design case>
Last lesson: <number>   Last drill: <number>
Current level: <1-6, name>
Pass criteria for this level: <from levels.md, made specific to the subject>

## Course map
| Unit or chapter | Area | Status | Planned date |
|---|---|---|---|

## Review queue
| Idea | What was wrong | Review dates | Last result |
|---|---|---|---|

## Sessions
| Date | Kind | Level | Minutes | Predicted | Actual | Sure and right | Wrong but sure | Right answer, reason not right | Right but guessing | Errors and why |
|---|---|---|---|---|---|---|---|---|---|---|

## Checks
| Date | Level | Teach-back score | Gaps named | Rebuild (pass, fail, not yet) | Passed? |
|---|---|---|---|---|---|
```

**Course map.** Built on the first invocation for a subject, before any lesson. One row per unit or chapter of the chosen source, in the source's order. Area is the source's own name for the domain or part it belongs to. Status is "not started", "learning" or "done". Planned date is when the unit is due to be studied. A chapter split into parts gets one row per part (01a, 01b), each about 20 minutes. Later sessions only change a row's status and date; they do not rebuild the map. If the formal test is settled as "none", say so on that line and make no mock exams.

**Review queue.** One row per idea, not per question number: the idea, and what exactly was wrong ("treats the retry limit as a timeout", not "q6"). Review dates are 1, 3 and 7 days after the miss; strike a date when it is done and set Last result. A drill tests the same idea in a new scenario.

One row per session. No row means it didn't happen. Kind is "Study", "Lesson 0001" or "Drill 0003".

A page's result line becomes one session row:
- Kind and number come from the result line; actual is its score (partial credit counts). Pages do not collect predictions: the coach asks for the predicted score in chat before the learner opens the page and records it in Predicted.
- Sure and right is the line's count and share: questions right, marked sure, with a right reason. It is the score that counts for the drill target.
- Wrong but sure, right answer with a reason not right, and right but guessing list the question numbers in those columns. The coach reads the reason lines one by one and may correct a self-mark that is too generous.
- Errors and why holds the missed questions with the learner's one-line reasons, wrong but sure and wrong-reason ones first. A result line marked unfinished is not a session score: ask the learner to finish the page.
- Each wrong but sure, wrong-reason, missed and right-but-guessing question becomes or updates a Review queue entry by idea, with the first review one day later. Wrong but sure and wrong-reason ones rank first. The recall self-marks update Last result there.
- Update the last lesson or drill number, the map row's status, and the drill step by the rule in `levels.md`.

A page score never passes a level; a check row does, only when the teach-back score and the rebuild both pass.
