# Lesson pages

A lesson page is a short, self-contained HTML file the learner opens in a browser. It carries the explanation and the practice for one session's new material. The progress file stays the only memory between sessions; a lesson page is material, not a record.

## When to make one

- Only after the placement test, and only for material that serves the current level's pass criteria.
- Lesson pages are on by default. When new material comes up, write the page in the same turn instead of asking first, and say in one line that the learner can switch to chat. If the progress file says "Lesson pages: off", or the learner declines, teach and quiz in chat instead and note "Lesson pages: off".
- Not for reviews that are due, teach-back checks or the blank-page rebuild: those are closed book and happen in chat.
- One lesson covers about 20 minutes: one or two ideas, not a chapter.
- A **drill** is a practice-only page on material already taught: missed questions, weak spots from the log, or a mix of earlier lessons. Make one when the log shows a weak spot, or when the learner asks for practice. It keeps the same format, with a short explanation or none.

## Files

In the learner's working folder, next to `learning-log.md`:

- `lessons/NNNN-slug.html`, numbered in order (0001, 0002, ...).
- `drills/NNNN-slug.html`, numbered separately.
- `reference/slug.html`, a one-page reference sheet for the same material.
- `assets/`, copied once from this skill's `assets/` folder: `lesson.css`, `quiz.js`, `check-lesson.js`, and `lang.js` if pages are bilingual. Start new pages from `assets/lesson-template.html` and `assets/reference-template.html`.

Open the lesson for the learner when it is written. In the reply, say in two or three lines what the page covers, how many questions it has, and that each answer is marked sure or guessing (and given a one-line reason, when the page asks for one) before it is checked. Never show the questions, options or answer key in chat, not as a table and not as the page's data: the learner would see the answers before trying. If the learner can't open files, switch to quizzing in chat, one question at a time.

## What goes on a lesson page, in this order

1. **The win:** one concrete thing the learner can do after the page, tied to the pass criteria.
2. **Recall first:** one to three questions on earlier or due material, answered from memory before reading. The answer stays hidden until the learner has written something.
3. **Explanation:** short and plain. Explanations should be easy to follow; the practice is where the effort goes, because a page that feels fluent is not the same as remembering it. Quote the primary source for definitions and number each claim to a source.
4. **Practice:** scenario questions, mixed across the ideas on the page. Before checking each question, the learner marks it "sure" or "guessing" (`quiz.js` requires this). On drills, the learner also writes a one-line reason before checking: set `reason: true` in `window.LESSON`. Turn it on for lessons too if the learner wants it, and note that in the progress file.
5. **Explain it back:** a prompt for three or four sentences, brought to the next session. This feeds the teach-back.
6. **Result line:** one line the learner copies back, in English: lesson number, score, questions missed, questions right but guessing, questions wrong but sure, recall self-marks.
7. **Read next:** one primary source, and why that one.
8. **Sources**, and a link to the reference sheet.

## Writing the questions

- Ask for a decision in a scenario, not a definition, from Level 2 up.
- Match the target exam's format where there is one. Otherwise, single-choice questions have four options. Multi-select questions say how many to pick (`quiz.js` shows "Select N." from the number of correct options). Put one or two on a lesson page, and more in later drills.
- Every wrong option is a real misconception.
- **Options state only the choice:** the action, design or claim, with no reason, purpose or expected result ("because...", "so that...", "to confirm...", "; that fixes it"). The reason goes in its `why`, shown after checking. A reason in an option either restates the page's rule, which gives the answer away, or is a weak one, which rules the option out. The exception is a question that asks for a reason ("why does this fail?"), where the reasons are the choices.
- **One clearly best answer:** the stem is as long as it needs to be, often two to four sentences: the situation, what is at stake, and exactly what is being decided. For a "first" or "best" question, say what comes before or what is excluded ("before choosing any control or design"). For each wrong option, ask whether an expert could defend it given the stem; if so, tighten the stem or rewrite the option until it is clearly worse, not merely a different reasonable choice.
- **No echo of the stem:** the correct option must not be the only one that uses the numbers or key words given in the stem.
- **No position cue:** write the correct option first in the data; `quiz.js` shuffles order on every load. Never write "all of the above" or "none of the above".
- **No length pattern:** the correct option is sometimes the longest, sometimes the shortest, and usually neither. Over a page of six or more questions, it is the unique longest at least once and at most a quarter of the time, and the same for the unique shortest, in every language on the page. Don't judge this by eye: run `node assets/check-lesson.js lessons/NNNN-slug.html` and rewrite options until it prints "ok". Without a shell, count characters per option and apply the same rule.
- **In chat**, the same rules apply: shuffle the options before listing them, mix their lengths, and don't mark the correct one until the learner answers.

## Drill difficulty

- Aim drills at 70 to 85 percent right, and tell the learner that target in one line when giving them a drill, with the step it is at. Learning is fastest when some answers are hard to reach; near 100 percent means the drill is too easy.
- After two drills in a row above 90 percent, step up. Below 60 percent, step down or reteach before the next drill.
- Step up in this order: single choice, then more multi-select, then short answers, then a design case to write up. A short answer uses the recall format (write first, then reveal a model answer and self-mark); a design case goes to chat for feedback. Keep some multiple choice at every step if the exam uses it.
- Level checks keep their pass marks from `references/levels.md`; this target is for practice only.

## The reference sheet

One page, tables over prose: the core ideas, when each applies, and a traps table (scenario, usual answer, usual trap). It is the answer key the learner checks a blank-page rebuild against, not something to study from. Say so at the top.

## After the lesson

When the learner pastes the result line, record a session row in the progress file with the score. Questions marked sure that were wrong show overconfidence; name them. Add missed material to "Review due" at a short interval. Questions wrong but sure come first: they show a misconception, not a gap. Questions right but guessing also go to review; they are not yet known. A lesson quiz is practice: it never passes a level on its own.

## Language

Pages are in English by default. If the learner asks for a second language, make that subject's pages bilingual with `lang.js`: English stays the default view, with a switch to the second language or to both. Keep subject terms in the original language beside the translation when the learner will be tested in that language. The result line stays in English. Record the choice in the progress file for that subject only.
