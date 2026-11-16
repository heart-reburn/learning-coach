# Lesson pages

A lesson page is a short, self-contained HTML file the learner opens in a browser. It carries the explanation and the practice for one session's new material. A lesson page is material, not a record.

## When to make one

- Only after the placement test, and only for material that serves the current level's pass criteria.
- Lesson pages are on by default. When new material comes up, write the page in the same turn instead of asking first, and say in one line that the learner can switch to chat. If the progress file says "Lesson pages: off", or the learner declines, teach and quiz in chat instead and note "Lesson pages: off" in the progress file.
- Not for teach-back checks or the blank-page rebuild: those are closed book and happen in chat. Due reviews happen in chat too; due material may appear only in a page's recall section, and each recall item names its Review due row.
- One lesson covers about 20 minutes: one or two ideas, not a chapter.
- A **drill** is a practice-only page on material already taught: missed questions, weak spots from the log, or a mix of earlier lessons. Make one when the log shows a weak spot, or when the learner asks for practice. It keeps the same format, with a short explanation or none, and sets `kind: "drill"` in `window.LESSON` (a lesson page uses `kind: "lesson"`; the template shows the line). The page's `kind` is either "lesson" or "drill".

## Files

In the learner's working folder, next to the progress file (`learning-log-<subject>.md`):

- `lessons/NNNN-slug.html`, numbered in order (0001, 0002, ...) per subject. If subjects share a folder, put the subject in the slug.
- `drills/NNNN-slug.html`, numbered separately in the same way.
- `reference/slug.html`, a one-page reference sheet for the same material.
- `assets/`, copied once from the `assets/` folder inside this skill's own folder, wherever it is installed (the plugin cache or `~/.claude/skills/learning-coach/assets`): `lesson.css`, `quiz.js`, `check-lesson.js`, and `lang.js` if pages are bilingual. Start new pages from `assets/lesson-template.html` and `assets/reference-template.html`.

Ask for the predicted score in chat first, and open the lesson for the learner only after they give it: `open` on macOS, `xdg-open` on Linux, `start` on Windows. In the reply, say in two or three lines what the page covers, how many questions it has, and that each answer is marked sure or guessing (and given a one-line reason, when the page asks for one) before it is checked. Never show the questions, options or answer key in chat, not as a table and not as the page's data: the learner would see the answers before trying. If the learner can't open files, switch to quizzing in chat, one question at a time.

## What goes on a lesson page, in this order

1. **The win:** one concrete thing the learner can do after the page, tied to the pass criteria.
2. **Recall first:** one to three questions on earlier or due material, answered from memory before reading. The answer stays hidden until the learner has written something.
3. **Explanation:** short and plain. Use plain words and short sentences; the practice is where the effort goes, because a page that feels fluent is not the same as remembering it. Quote the primary source for definitions and number each claim to a source.
4. **Practice:** scenario questions, mixed across the ideas on the page. Before checking each question, the learner marks it "sure" or "guessing" (`quiz.js` requires this). On drills, the learner also writes a one-line reason before checking: set `reason: true` in `window.LESSON`. A reason needs at least ten characters (characters, not words), and a recall answer needs at least one character, before the page lets the learner continue. Turn it on for lessons too if the learner wants it, and set "Reason line on lesson pages: on" in the progress file.
5. **Explain it back:** a prompt for three or four sentences, brought to the next session. This feeds the teach-back.
6. **Result line:** one line the learner copies back, in English. It starts "Lesson 0001" or "Drill 0003", then the score, each question's sure or guessing mark, the reason for each answer (when reasons are on), and the recall self-marks. How it goes into the progress file is in the progress-file reference, learning-log, in this folder.
7. **Read next:** one primary source, and why that one.
8. **Sources**, and a link to the reference sheet.

## Writing the questions

- Ask for a decision in a scenario, not a definition, from Level 2 up.
- Match the target exam's format where there is one. Otherwise single-choice and multi-select questions have six options by default (the template shows a short example; real pages follow this rule); drop to four only for a learner who is just starting out or when the topic can't support six real misconceptions. More options lower the odds of guessing, but every option must be a real misconception: a padded weak option makes the question easier, not harder. Multi-select questions say how many to pick (`quiz.js` shows "Select N." from the number of correct options). Put one or two on a first lesson page, and more as the learner progresses.
- Size a page at about 15 questions, which takes 20 to 25 minutes with the marks. Test each idea the page teaches at least twice, in different forms (recognise it, then apply it in a scenario). Go longer by adding drills, not by lengthening the page.
- **Options state only the choice:** the action, design or claim, with no reason, purpose or expected result ("because...", "so that...", "to confirm...", "; that fixes it"). The reason goes in its `why`, shown after checking. A reason in an option either restates the page's rule, which gives the answer away, or is a weak one, which rules the option out. The exception is a question that asks for a reason ("why does this fail?"), where the reasons are the choices.
- **Exactly one option is correct for the stated scenario, without making it easy:** the stem is as long as it needs to be, often two to four sentences: the situation, what is at stake, and exactly what is being decided. For each wrong option, ask whether an expert could defend it given the stem; if so, add situation facts until it is clearly worse, or rewrite it. A limit in the stem may narrow what is asked, but it must not name the type of the answer, and it must not rule out an option by its wording alone ("before choosing any design" does that). Include one or two details that look relevant but don't change the answer, so the learner has to decide what applies. Difficulty comes from applying the idea to the situation, never from vagueness.
- **Explanations that teach:** each option's `why` is two to four sentences, not a label, and names the common misunderstanding behind that option. For a wrong option: the misunderstanding that makes it tempting, why it is wrong in this scenario, and when it would be the right choice, if ever. For the correct option: the misunderstanding it corrects, why it is right in this scenario, and what it makes possible next. Name the idea or rule behind it so the learner can reuse it. The reasons live here, after checking, never in the option text. `check-lesson.js` checks the sentence count and that both languages are filled in; whether the misunderstanding is real is for a reviewer to judge.
- **No echo of the stem:** the correct option must not be the only one that uses the numbers or key words given in the stem.
- **No position cue:** write the correct option first in the data; `quiz.js` shuffles once per learner and page and saves the order. Never write "all of the above" or "none of the above".
- **No length pattern:** the correct option is sometimes the longest, sometimes the shortest, and usually neither. Over a page of six or more questions, it is the unique longest at least once and about a quarter of the time at most (rounded up), and the same for the unique shortest, in every language on the page. Don't judge this by eye: run `node assets/check-lesson.js lessons/NNNN-slug.html` and rewrite options until it prints "ok". Without a shell, count characters per option and apply the same rule.
- **In chat**, the same rules apply: shuffle the options before listing them, mix their lengths, and don't mark the correct one until the learner answers.

## Drill difficulty

- The target band and the step up, stay and step down marks are in `levels.md` (difficulty). In the reply, say in one line that the target is 70 to 85 percent right, and whether this drill steps up, stays or steps down and why.
- Step up in this order: single choice, then more multi-select, then short answers, then a design case to write up. A short answer uses the recall format (write first, then reveal a model answer and self-mark); a design case goes to chat for feedback. Keep some multiple choice at every step if the exam uses it. Stepping down goes back one step. Record the step in the progress file.
- Level checks use the pass mark in `levels.md`; the band is for practice only.

## The reference sheet

One page, tables over prose: the core ideas, when each applies, and a traps table (scenario, usual answer, usual trap). It is the answer key the learner checks a blank-page rebuild against, not something to study from. Say so at the top.

## After the lesson

When the learner pastes the result line, record it in the progress file as the learning-log reference describes. Questions wrong but sure come first: they show a misconception, not a gap. Questions right but guessing also go to review; they are not yet known. A lesson quiz is practice: it never passes a level on its own.

## Language

Pages are in English by default. If the learner asks for a second language, make that subject's pages bilingual with `lang.js`: English stays the default view, with a switch to the second language or to both. Keep subject terms in the original language beside the translation when the learner will be tested in that language. The result line stays English (see the result line above). Record the choice in that subject's progress file only.
