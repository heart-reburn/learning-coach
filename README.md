# Learning Coach

A skill that coaches a learner through studying anything, using methods from learning research: testing yourself and spaced review (high utility), plus explaining concepts back, mixing topics and checking your own understanding (moderate, or practice judgment). It works with Claude Code and other tools that read `SKILL.md` skills.

## What it does

The agent runs a repeating cycle:

1. **Place:** a 25-minute test (first step 4 minutes) finds the starting level (1 to 6).
2. **Set the bar:** it states what you must show to pass the level, before you study.
3. **Study:** 20-minute sessions, logged in a progress file the agent reads each time. On the first invocation the agent builds a course map of the whole source and settles whether there is a formal test. New material comes as a short HTML lesson page: recall first, worked examples with a sample question after each concept, a glossary, then about 10 practice questions, each marked sure or guessing before it is checked.
4. **Check:** a check in the format for your level (a 10-question self-test, a teach-back that may be written or spoken, or a finished task scored against a private checklist), passed at 80%.
5. **Rebuild:** you rewrite a one-page summary from memory.
6. **Advance:** pass, move up, and keep reviewing earlier levels.

It covers eight techniques: foundations (sleep, focus), retrieval practice, spaced repetition, elaboration, interleaving, metacognition, teach-back, and decision quality.

## Lesson pages

New material can come as a self-contained HTML page you open in the browser: recall first, worked examples with sources, a glossary, then practice questions. No server, no account.

![A lesson page: recall box, short explanation, practice question](docs/img/lesson-page.png)

The sample page is in [`docs/sample/`](docs/sample/lessons/0001-inner-vs-left-join.html).

Features:

- **Recall before reading:** write an answer from memory, then reveal the model answer and mark it got it, partly, or missed.
- **Worked examples:** scenario, common wrong instinct, right design and why, with an unscored sample question after each concept and a glossary before the quiz.
- **Exam-style questions:** four or five options (matching the formal test where there is one); multi-select questions do not say how many to pick, and each option is scored on its own with partial credit. Mock exams, when there is a formal test, copy its format. Options state only the choice, never a reason, and no wrong option can be removed by common sense alone.
- **Closed book practice:** scrolling back or opening the reference while answering is cheating; opening a glossary term is allowed but makes the question a guess. Order is shuffled once per learner and page, and the order is saved.
- **Sure or guessing:** mark each answer before checking, so the score also shows overconfidence (wrong but sure) and luck (right but guessing). After checking, mark your own reason right, partly right or wrong; the score that counts is the share of answers that are right, sure and given a right reason.
- **Reason first on drills:** drills also ask for a one-line reason before the answer is checked.
- **Explanations after answering:** every option explains why it is right or wrong once you have checked.
- **Timed practice:** in the last days before a formal test, drills show a soft timer at the exam's pace.
- **Difficulty that adapts:** lessons and drills aim at 70 to 85 percent sure and right and step up above 85 percent on the last page (see `levels.md`).
- **Result line:** one line to paste back, which goes into the learning log and queues the concepts you got wrong for review at 1, 3 and 7 days.
- **Bilingual option:** English by default, with a second language switch.
- **Checker:** `assets/check-lesson.js` flags answer cues in option length and in reasons written into options.

## Who it's for

Anyone studying a subject or building a skill who wants a coach that tests them instead of just explaining. It is not for quick factual questions; the agent answers those directly.

## Requirements

Node for the lesson checker, Python 3 for the validator.

## Install

Claude Code, as a plugin:

```
/plugin marketplace add heart-reburn/learning-coach
/plugin install learning-coach@learning-coach
```

Or copy the skill folder by hand:

```
cp -R skills/learning-coach ~/.claude/skills/
```

Other tools that read `SKILL.md` folders: copy `skills/learning-coach/` into that tool's skills directory.

## Example

> **You:** I have a biology exam in three weeks. Help me study cell division.
>
> **Coach:** First, we set up foundations: a weekly schedule and sleep. Then a placement test. Close your notes and write everything you know about cell division for four minutes.
>
> *(You write 6 facts.)*
>
> **Coach:** Good start. Now explain mitosis aloud as if to a 12-year-old.
>
> *(You stumble at how chromosomes separate.)*
>
> **Coach:** You start at Level 2: Explain. To pass, you need to explain why each phase happens, in your own words. This week: 4 sessions of 20 minutes. Session 1 comes as a lesson page: recall first, a short explanation, then practice questions. Tell me your predicted score first, then I'll open it.

## Evidence

The methods come from learning research: practice testing and spaced practice rated high-utility, self-explanation, elaborative interrogation and interleaving moderate, and rereading, highlighting, and summarizing rated low (Dunlosky et al., 2013). Full sources are in [`skills/learning-coach/references/techniques.md`](skills/learning-coach/references/techniques.md).

The pass and drop thresholds are starting points, not research results, and the file says so.

## Repo layout

- `skills/learning-coach/SKILL.md`: the skill.
- `skills/learning-coach/references/`: placement test, levels, techniques, progress-file format, lesson pages.
- `skills/learning-coach/assets/`: lesson and reference-sheet templates, stylesheet, quiz component, optional language switch.
- `skills/learning-coach/evals/`: trigger tests (should and should not load) and behavior tests (what the skill does once loaded).
- `docs/`: sample lesson page and its screenshot.
- `scripts/judge_compare.py`: runs the behavior evals with two independent judges.
- `scripts/validate.py`: checks frontmatter and file links (runs in CI). `scripts/run_evals.py` runs the evals with any agent CLI (set `SKILL_EVAL_CMD`; defaults to the Claude CLI).

## License

MIT. See [LICENSE](LICENSE).
