# Lesson pages

A lesson page is a short, self-contained HTML file the learner opens in a browser. It carries the explanation and the practice for one session's new material. A lesson page is material, not a record.

## When to make one

- Only after the placement test, and only for material that serves the current level's pass criteria.
- Lesson pages are on by default. When new material comes up, write the page in the same turn instead of asking first, and say in one line that the learner can switch to chat. If the progress file says "Lesson pages: off", or the learner declines, teach and quiz in chat instead and note "Lesson pages: off" in the progress file.
- Not for teach-back checks or the blank-page rebuild: those are closed book and happen in chat. Due reviews happen in chat too; due material may appear only in a page's recall section, and each recall item names its Review queue entry.
- One lesson is one 20-minute session with about 10 scored questions (6 to 18 accepted). Size parts by the content, not by a fixed count: a small chapter is one page, a large one is two or three parts, and two tiny chapters can share a page. Each idea is tested at least twice on its page. The course map in the progress file lists the parts.
- A **drill** is a practice-only page on material already taught: missed questions, weak spots from the log, or a mix of earlier lessons. Make one when the log shows a weak spot, or when the learner asks for practice. It keeps the same format, with a short explanation or none, and sets `kind: "drill"` in `window.LESSON` (a lesson page uses `kind: "lesson"`; the template shows the line). The page's `kind` is either "lesson" or "drill".

## Files

In the learner's working folder, next to the progress file (`learning-log-<subject>.md`):

- `lessons/NNNN-slug.html`, numbered in order (0001, 0002, ...) per subject. A chapter split into parts adds a letter after the number: `0001a-slug.html`, `0001b-slug.html`; the course map lists the same names. If subjects share a folder, put the subject in the slug.
- `drills/NNNN-slug.html`, numbered separately in the same way.
- `reference/slug.html`, a one-page reference sheet for the same material.
- `assets/`, copied once from the `assets/` folder inside this skill's own folder, wherever it is installed (the `assets/` folder next to this SKILL.md, wherever the skill is installed): `lesson.css`, `quiz.js`, `check-lesson.js`, and `lang.js` if pages are bilingual. Start new pages from `assets/lesson-template.html` and `assets/reference-template.html`.

Ask for the predicted score in chat first, and open the lesson for the learner only after they give it: `open` on macOS, `xdg-open` on Linux, `start` on Windows. In the reply, say in two or three lines what the page covers, how many questions it has, that each answer is marked sure or guessing (and given a one-line reason, when the page asks for one) before it is checked, and that the learner marks their own reason right, partly right or wrong afterwards. Never show the questions, options or answer key in chat, not as a table and not as the page's data: the learner would see the answers before trying. If the learner can't open files, switch to quizzing in chat, one question at a time.

## What goes on a lesson page, in this order

1. **The win:** one concrete thing the learner can do after the page, tied to the pass criteria.
2. **Recall first:** one to three questions on earlier or due material, answered from memory before reading. The answer stays hidden until the learner has written something.
3. **The big picture:** one inline SVG map of the part: the problem it solves and its ideas as nodes joined in the order they connect. Name the idea count in one line. The number of ideas follows the content: a part holds as many ideas as fit a 20-minute session (about 3 to 6); more ideas mean more parts, fewer mean a shorter part or a merge with its neighbour.
4. **Idea by idea:** one section per idea: one small inline SVG (contrast, flow or checklist), at most 100 words, plain short sentences, a quoted source for definitions. Add one complete example only where the idea needs it. Right after each idea, one unscored sample question (`sample: true`, `at: "idea1"`, `<div id="sample-idea1">`); its explanation shows on answering. **Every term used in any question must be taught here first.** Before handing the page over, write in the reply one line per scored question: the terms it uses and the idea that teaches each.
5. **Putting it together:** the conclusion that answers the big picture: one unscored scenario sample (`at: "together"`, `<div id="sample-together">`) that needs several ideas at once, then the same map again with the learner's task: name how each node leads to the next.
6. **Glossary:** the page's terms with short definitions, from the source's own glossary where it has one (`glossary` in `window.LESSON`, shown before the quiz). Inside questions, glossary terms are links that open the definition.
7. **Practice:** about 10 scored questions, mixed across the ideas on the page, under the open-book policy below. Before checking each question, the learner marks it "sure" or "guessing" (`quiz.js` requires this). The learner also writes a one-line reason before checking, on every lesson and drill (`reason` is on unless a page sets `reason: false`). A reason needs at least ten characters (characters, not words), and a recall answer needs at least one character. After checking and reading the explanations, the learner marks their own reason right, partly right or wrong; the next question stays locked until they do.
8. **Explain it back:** redraw or fill the map from memory, then a prompt for three or four sentences, closed book, brought to the next session. This feeds the teach-back.
9. **Result line:** one line the learner copies back, in English. It starts "Lesson 0001" or "Drill 0003", then the score (partial credit counts), the sure-and-right count, each question's sure or guessing mark with the reason self-mark, the reason line (when reasons are on), the time (when timed), and the recall self-marks. How it goes into the progress file is in the progress-file reference, learning-log, in this folder.
10. **Read next:** one primary source, and why that one.
11. **Sources**, and a link to the reference sheet.

No intro or instruction lines under a section heading when the page already shows what to do (no "After each idea, try one question"); keep only the glossary line about dotted terms.

Map nodes are plain sentences a newcomer understands on first sight ("Ask about normal days and bad days"), never cryptic labels ("Four things in writing"); one node per idea of this part, none for material from another part. Lay a map out top to bottom, centered. A stem that says "first" or names one flaw signals a single answer; when several apply, ask "which of these" as select-all.

Maps nest: each part opens with its own map; the last part of a chapter ends with a chapter map joining every part's nodes, used as the recall prompt; the course map in the progress file is the course-level map, and the course's last page closes with it redrawn from memory. Section headings: "The big picture", "Idea by idea", "Putting it together".

## Open book policy

Practice on a page is closed book for each scored question. Cheating, plainly: scrolling back to the worked examples, opening the reference sheet, the source, search or an AI tool, or asking someone, while a scored question is open. Scrolling up to the glossary block while a scored question is open counts as scrolling back. Opening a glossary term from inside the question is allowed, but then the question must be marked guessing; `quiz.js` forces that mark. Sample questions are open book. Checks, teach-back and rebuild stay fully closed book, with no glossary either.

## Reason self-check and mastery

- Before Check, answers and the sure or guessing mark can be changed freely (miss-click protection); Check locks them, and the result line counts questions whose answer changed before checking.
- Every page ends with a short feedback block (explanations clear, questions fair, difficulty, one free-text note) just above the result line, with a `<div id="feedback"></div>` in the page. It goes into the result line as `page feedback`. The coach fixes the page from it: unfair or tricky wording first, then unclear explanations.
- After checking, the learner reads the explanations and marks their own reason right, partly right or wrong. The result line records it per question. The coach grades the pasted reason lines one by one against the explanations and corrects a mark that is too generous.
- **Mastery measure:** the score that counts is the share of questions that are right, marked sure, and given a right reason ("sure and right"). A "sure" mark means "I can say why", not "it looks familiar". A right answer reached by common-sense elimination is guessing. The 70 to 85 percent drill target in `levels.md` uses this measure.
- Review categories, in priority order: wrong but sure; right answer with a wrong or partly right reason (ranks with wrong but sure); wrong but guessing; right but guessing.

## Writing the questions

- Ask for a decision in a scenario, not a definition, from Level 2 up.
- Match the formal test's option count where there is one (the course map records it). Otherwise single-choice and multi-select questions have six options by default (the template shows a short example; real pages follow this rule); drop to four only for a learner who is just starting out or when the topic can't support six real misconceptions. More options lower the odds of guessing, but every option must be a real misconception: a padded weak option makes the question easier, not harder.
- **Multi-select hides the count.** Lesson pages and drills never say how many to pick; the page shows "Select all that apply." and scores each option on its own. Every question renders as select-all-that-apply, including one with a single right answer, so the input type never gives the count away; only a question that sets `single: true` renders radios. The question earns partial credit: the share of options judged correctly. Put one or two on a first lesson page, and more as the learner progresses. Only a mock exam follows the formal test's format exactly: if the test states how many to pick, set `showCount: true` there. With no formal test, there are no mocks and everything uses the hidden-count format.
- Size a page at about 10 scored questions (`check-lesson.js` accepts 6 to 18, samples not counted), which takes about 20 minutes with the marks. Test each idea the page teaches at least twice, in two different scenarios (for example, choose the design, then spot the flaw in someone else's design). Go longer by adding parts or drills, not by lengthening the page.
- **Options state only the choice:** the action, design or claim, with no reason, purpose or expected result ("because...", "so that...", "to confirm...", "; that fixes it"). The reason goes in its `why`, shown after checking. A reason in an option either restates the page's rule, which gives the answer away, or is a weak one, which rules the option out. The exception is a question that asks for a reason ("why does this fail?"), where the reasons are the choices.
- **No giveaway questions, at all:** for every wrong option, ask whether someone who has not read the chapter could eliminate it by common sense; if yes, rewrite it until an expert has to think. Easy recognition items are not allowed, in any position.
- **The correct set is right for the stated scenario, without making it easy:** the stem is as long as it needs to be, often two to four sentences: the situation, what is at stake, and exactly what is being decided. For each wrong option, ask whether an expert could defend it given the stem; if so, add situation facts until it is clearly worse, or rewrite it. A limit in the stem may narrow what is asked, but it must not name the type of the answer, and it must not rule out an option by its wording alone ("before choosing any design" does that). Include one or two details that look relevant but don't change the answer, so the learner has to decide what applies. Difficulty comes from applying the idea to the situation, never from vagueness.
- **Explanations that teach:** each option's `why` is two to four sentences, not a label, and names the common misunderstanding behind that option. For a wrong option: the misunderstanding that makes it tempting, why it is wrong in this scenario, and when it would be the right choice, if ever. For the correct option: the misunderstanding it corrects, why it is right in this scenario, and what it makes possible next. Name the idea or rule behind it so the learner can reuse it. The reasons live here, after checking, never in the option text. `check-lesson.js` checks the sentence count and that both languages are filled in; whether the misunderstanding is real is for a reviewer to judge.
- **No echo of the stem:** the correct option must not be the only one that uses the numbers or key words given in the stem.
- **No position cue:** write the correct option first in the data; `quiz.js` shuffles once per learner and page and saves the order. Never write "all of the above" or "none of the above".
- **No length pattern:** the correct option is sometimes the longest, sometimes the shortest, and usually neither. Over a page of six or more questions, it is the unique longest at least once and about a quarter of the time at most (rounded up), and the same for the unique shortest, in every language on the page. Don't judge this by eye: run `node assets/check-lesson.js lessons/NNNN-slug.html` and rewrite options until it prints "ok". Without a shell, count characters per option and apply the same rule. If the checker still fails after two rewrites, list its messages in the reply and fix each by hand; never hand over a page that does not print ok. If a part cannot support 6 scored questions, merge it with the next part.
- **In chat**, the same rules apply: shuffle the options before listing them, mix their lengths, don't mark the correct one until the learner answers, take a sure or guessing mark and a one-line reason before giving feedback, and don't say how many to pick.

## Drill difficulty

- The target band and the step up, stay and step down marks are in `levels.md` (difficulty); the band is measured on the sure-and-right share. Tell the learner the drill's target in one line, with the step it is at.
- A drill tests an idea from the review queue in a new scenario, not the question that was missed.
- **Timed practice.** From 7 days before the formal test date (in the course map), every drill carry a per-question time matching the exam's pace, whatever the score (the course map records time per item): set `secondsPerQuestion` in `window.LESSON`. The timer is soft: it shows pace and never stops the learner, and the time goes in the result line. Mock exams, when there is a formal test, follow its format and pace exactly.
- Step up in this order: single choice, then more multi-select, then short answers, then a design case to write up. A short answer uses the recall format (write first, then reveal a model answer and self-mark); a design case goes to chat for feedback. Keep some multiple choice at every step if the exam uses it. Stepping down goes back one step. Record the step in the progress file.
- Level checks use the pass mark in `levels.md`; the band is for practice only.

## The reference sheet

One page, tables over prose: the core ideas, when each applies, and a traps table (scenario, usual answer, usual trap). It is the answer key the learner checks a blank-page rebuild against, not something to study from. Say so at the top.

## After the lesson

The pasted result line starts a debrief in chat, before the next lesson and before any logging. Log it as the learning-log reference describes, but the debrief is the point.

1. **The picture first.** Score against the 70–85% target, sure-and-right share, how many sure answers were wrong (miscalibration), recall results, questions changed before checking. Two or three sentences.
2. **Every miss and every partial, using the learner's own reason line.** Say which kind it was (did not know, misread the stem, fell for a plausible option, half knew), the exact misconception in one sentence, the rule that settles it, and why the option they chose fails. Wrong but sure comes first, then right with a wrong or vague reason, then right but guessing.
3. **Reasons that are not reasons.** Name reasons such as "I think this is the one" or "makes sense" and ask what rule they would apply. A reason line is practice for the exam's justification, not a formality.
4. **The pattern.** Which idea or which habit (skipping the stem's constraint, picking the most specific option) explains several misses. Say it once.
5. **Their questions and their feedback block.** Answer every question they wrote. Where they call a question unfair, unclear or tricky, check it honestly against the page: if the page is wrong, fix the page and say what changed; if it is fair, show why.
6. **One retry.** Ask one fresh question on the weakest idea and have them answer in chat before the debrief ends; then set what goes into the review queue and how the next page's difficulty changes.

Chat follows the learner's language; keep it a conversation, not a report. A lesson quiz is practice: it never passes a level on its own.

## Language

Pages are in English by default. If the learner asks for a second language, make that subject's pages bilingual with `lang.js`: English stays the default view, with a switch to the second language or to both. Keep subject terms in the original language beside the translation when the learner will be tested in that language. The result line stays English (see the result line above). Record the choice in that subject's progress file only.
