# Changelog

## Unreleased

- Added: lesson pages with recall first and sure or guessing marks, a checker for answer cues, saved page progress, drills, a per-subject progress file, and one source for the difficulty rule.
- Changed: harder questions by default. Six options (five only when the topic can't support six real misconceptions, never four or fewer), about 30 percent multi-select on every page, and drills start at mixed choice. The checker flags fewer than five options and a multi-select share under a quarter or over half.
- Added: course decks (`deck-template.html`, `deck.css`, `deck.js`), one slide-by-slide page per course with each lesson's questions after its slides; never slides without questions. `quiz.js` places a question in its `data-quiz` slot, and the checker flags a question with no matching slot.
- Removed: asking for a predicted score in chat before a lesson page opens; the sure or guessing marks carry calibration, and the page opens as soon as it passes the checker.

## 0.2.0

- Renamed from how-to-learn to learning-coach, to match interview-coach and promotion-coach. Install with the new name; the old GitHub URL redirects.

## 0.1.0

- First release: six-level learning cycle, eight techniques, placement test, pacing rules, ground rules, progress file, review schedule, and trigger-test queries.

- Added: GitHub Actions validation, plugin icon, and behavior tests.
