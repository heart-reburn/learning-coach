# Placement and pacing

## Placement test (up to 25 minutes per subject)

Closed book, no help, no recommended answers shown. You write each task in the learner's own subject, one at a time, and keep a private checklist for it. Each step maps to the evidence for one level in `levels.md`. Score as the share of checklist points covered correctly, at the pass mark in `levels.md`. Pitch each task at the pass criteria for its level, not at the practice band. Stop at the first step the learner fails: that is the starting level. If they clear all six, start at Level 6 work: real projects, teaching others, and spaced review of earlier material. Record the result and date in the progress file.

1. **Recall (4 minutes):** "Write every core fact you know about <subject>." Keep a checklist of eight to ten core facts; the pass mark is at least 80% of them. Under it: start at Level 1.
2. **Explain (4 minutes):** "Explain why <a core concept in the subject> works, to a smart 12-year-old." Under the pass mark: start at Level 2.
3. **Use (5 minutes):** one new, small task in the subject, solved with no reference. Under the pass mark: start at Level 3.
4. **Diagnose (4 minutes):** a flawed sample answer, design or attempt in the subject. Find the cause and the fix. Under the pass mark: start at Level 4.
5. **Judge (4 minutes):** two methods or answers for one problem in the subject. Pick one and defend it with evidence and limits. Under the pass mark: start at Level 5.
6. **Create (4 minutes):** design a short exercise set or lesson in the subject for someone one level below. Under the pass mark: start at Level 6.

### Branches

- **Zero background.** If the learner says they know nothing, skip the test and start at Level 1. Run foundations, then give one small recall check after the first lesson.
- **You can't verify the facts.** In a niche subject, say so. Ask for the syllabus, textbook or official source the learner will be tested on, and score only against it. Mark the placement as unverified in the progress file.
- **Exam date too close for the ladder.** With fewer than eight sessions left (this skill's own rule of thumb), skip the ladder. Take the exam's syllabus, rank topics by weight and weakness, run retrieval drills and spaced reviews on the top ones, and finish with a timed mock if there is a formal test whose format is known (no formal test, no mock). From 7 days before the exam, drills carry a per-question time at the exam's pace (soft timer). Don't claim a level: in the progress file, set current level to "not set", pass criteria to the exam objectives, and make lesson pages and drills by exam weight.

## Pacing

- **Sessions per week:** default 4. Minimum useful: 2. Maximum sustainable: 8. If more than 8 is needed, check the approach first.
- **Time split:** about 70% on the current level, 20% on spaced review of earlier levels, 10% on predict-then-score practice (guess your result before you check it).
- **Session shape (20 min default):** one part of a chapter as a lesson page: about 4 minutes of recall and review, 6 of worked examples and the glossary, 10 of scored practice. Scale to the time available, keeping roughly that split. Record scores and errors in the progress file.
- **Splitting a chapter:** size parts by content, not a fixed count. A small chapter is one page; a large one is two or three parts; each page carries about 10 scored questions and every concept is tested at least twice. One course-map row per part.
- **Review schedule and spacing:** one rule, run by `assets/review.py`. Each concept sits on a ladder of gaps, by default 1, 3, 7, 14 and 30 days (`--gaps` changes it; a short deadline uses a tighter ladder such as 1, 2 and 4). A page's questions on a concept give one verdict: miss (any question wrong, or partial credit) puts the concept back on the first rung and counts a lapse; hold (all right, but one was guessing, had a wrong reason mark, or opened a term) leaves the rung where it is; good (all right, sure, right reason) climbs one rung. The next review is the last date plus the gap for the rung, and never later than the deadline `--deadline` names. Past the last rung a concept is solid and drops out. A review round takes up to 12 questions, two per concept: due concepts first, then the weakest, preferring questions not asked before (after a confident miss, not the one that was missed). Drills test the same concept in a new scenario. The longer you need to remember something, the longer the gap should be, but a smaller share of that time: in one study (Cepeda et al., 2008) the best gap was about 20-40% of a one-week delay and about 5-10% of a one-year delay. The ladder's early gaps stay fixed; a miss on any review restarts the concept at the first rung. The next review date is the due column of `review-queue.csv`.
- **Difficulty and level drops:** one rule set, in `levels.md`.
