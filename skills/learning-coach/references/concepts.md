# Concepts: extract, register, audit

For a formal test or a deadline, extraction comes before any lesson is planned. For casual learning it is optional: a short list of the main ideas is enough, and the registry can stay small.

## Extract every concept point

Read each unit of the source in full and write one registry entry for every testable point, not only the ideas a concept map shows: a decision rule, a distinction, a number or threshold, a named pattern, a common trap. Rank by value for the test and cap each unit (about 12 to 15) so that every sentence does not become a concept. Show the learner the unit list to confirm; do not read any held-back mock or unseen test set.

`concept-registry.json`, in the learner's folder (never in a scratchpad; never named `concepts.json`, which is a build output name). Written by hand, one entry per concept:

```json
[{ "slug": "u02-ask-for-real-cases", "title": "Ask for real cases, not opinions", "unit": "02", "page": "02a", "questions": ["02a.q4"] }]
```

- slug: unit key, then a short name in words; never reused.
- unit: one string form for every entry; digits are padded to two ("07"), so counts per unit do not split.
- page: the page that teaches it. questions: ids of the scored questions that test it, "<page>.q<number>".
- Also record the source location (file and section) in a `source` field when the source is long.

## Group, then build

Group the concepts into categories (the test's own areas if it has them, else the units' themes), show the counts per group, and wait for approval. Then plan lessons per concept (`references/lessons.md`, "Page kinds"): size parts by the time budget, about two minutes per concept plus the questions for a 20-minute session. Every concept gets at least one scored question, tagged with its slug.

## Audit and fill

After the pages exist, check coverage in waves. This is optional work for the orchestrating session on the owner's request; the skill itself does not start other agents.
1. Content audit: check each page against the source, book chapter first, then the reference sheet.
2. Coverage audit: a cheap model lists, for each unit, the testable ideas with no registry entry (at most 40, ranked), the concepts the lessons do not explain, and the concepts with no scored question. Held-back tests are never opened; the brief names the allowed files and the output must cite only those.
3. Show the gap list to the owner before filling.
4. Gap fill: a stronger model re-reads the unit for each gap, writes at most 10 new concepts per unit with new slugs, and adds lessons and questions for them (an added-concepts page only when the unit's pages cannot be rebuilt in time).
5. Run `check-lesson.js --registry` on every changed page, then `review.py queue`; it lists concepts with no question and answered questions in no concept. Both lists must be empty before handing over.

If extraction finds no units, ask the learner for the source. If an audit returns an idea the source does not contain, drop it.
