#!/usr/bin/env node
// Checks a lesson page's questions for answer cues. Run after writing a lesson:
//   node assets/check-lesson.js lessons/0001-slug.html
// Flags, for every language on the page: a length pattern across the page (the correct option
// is the unique longest, or unique shortest, in more than a quarter of the questions, or never
// either one, so length predicts the answer in some direction; in "select N" questions the N
// correct options count together), a reason or purpose written into an option ("because",
// "since", "so that", "因为", "以便" and the like), "all/none of the above", a missing "why", and a missing
// second-language field.
const fs = require("fs");
const html = fs.readFileSync(process.argv[2], "utf8");
const m = html.match(/<script>\s*(window\.LESSON[\s\S]*?)<\/script>/);
if (!m) { console.error("no window.LESSON block found"); process.exit(2); }
const window = {};
eval(m[1]);
const L = window.LESSON;
const langs = typeof L.questions[0].stem === "string" ? [null] : ["en", "l2"];
const pick = (t, lang) => (lang ? (t && t[lang]) || "" : t || "");
const len = (s) => [...s].length;
const problems = [];

L.questions.forEach((q, i) => {
  const n = "q" + (i + 1);
  const need = q.options.filter((o) => o.correct).length;
  langs.forEach((lang) => {
    const tag = lang ? n + " (" + lang + ")" : n;
    const texts = q.options.map((o) => pick(o.text, lang));
    if (texts.some((t) => !t) || !pick(q.stem, lang)) problems.push(tag + ": missing text");
    if (q.options.some((o) => !pick(o.why, lang))) problems.push(tag + ": an option has no why");
    if (texts.some((t) => /\b(all|none) of the above\b/i.test(t))) problems.push(tag + ": all/none of the above");
    texts.forEach((t) => {
      if (/\b(because|since|so that|in order to)\b|\bso\s+\w+\s+(can|will|would|returns|applies)\b|因为|所以|以便|为了/i.test(t))
        problems.push(tag + ": option gives a reason; state only the choice: \"" + t + "\"");
    });
  });
});

// Length should not predict the answer in either direction. Record where the correct
// option(s) fall by length in each question, then check the page as a whole.
const rank = (q, lang) => {
  const need = q.options.filter((o) => o.correct).length;
  const order = q.options.map((o) => ({ o, l: len(pick(o.text, lang)) })).sort((x, y) => y.l - x.l);
  const top = order.slice(0, need), bottom = order.slice(-need);
  const above = order[order.length - need - 1], below = order[need];
  if (top.every((x) => x.o.correct) && (!below || top[need - 1].l > below.l)) return "longest";
  if (bottom.every((x) => x.o.correct) && (!above || bottom[0].l < above.l)) return "shortest";
  return "middle";
};
langs.forEach((lang) => {
  const tag = lang ? "(" + lang + ") " : "";
  const ranks = L.questions.map((q) => rank(q, lang));
  const n = ranks.length, cap = Math.ceil(n / 4);
  const count = (r) => ranks.filter((x) => x === r).length;
  const where = (r) => ranks.map((x, i) => (x === r ? "q" + (i + 1) : null)).filter(Boolean).join(" ");
  ["longest", "shortest"].forEach((r) => {
    if (count(r) > cap) problems.push(tag + "correct option is the unique " + r + " in " + count(r) + " of " + n + " questions (" + where(r) + "); at most " + cap);
    if (n >= 6 && count(r) === 0) problems.push(tag + "correct option is never the " + r + "; a reader learns to skip that end, so mix it in");
  });
});

if (problems.length) { console.log(problems.join("\n")); process.exit(1); }
console.log("ok: " + L.questions.length + " questions, no answer cues");
