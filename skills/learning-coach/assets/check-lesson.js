#!/usr/bin/env node
// Checks a lesson page's questions for answer cues. Run after writing a lesson:
//   node assets/check-lesson.js lessons/0001-slug.html
// Flags, for every language on the page: a length pattern across the page (the correct option
// is the unique longest, or unique shortest, in more than a quarter of the questions, or never
// either one, so length predicts the answer in some direction; in multi-select questions the
// correct options count together), a scored count outside 6 to 18, a stem that says how many to pick
// when the page does not show counts (LESSON.showCount), a glossary entry with a missing term or
// definition, a reason or purpose written into an option ("because",
// "since", "so that", "to verify", "因为", "以便" and the like; skipped when the stem asks "why"),
// a question with no correct option, a single-choice question (declared with `single: true`,
// `multiple: false` or `type: "single"`) with more than one, "all/none of the above", a missing "why", a "why" that
// is not two to four sentences (the form only; references/lessons.md says what a good one contains),
// a missing second-language field, a question with fewer than 3 or more than 5 options, and (lessons) a big-picture map, a picture and at most 100 words per idea section,
// and a closing together section. Lesson pictures are also checked: every svg needs role="img", an aria-label and a <title>; a <text> longer than 40 characters,
// with an inline font-size under 11px, or a caption of more than 6 words (10 in the big-picture and together maps, whose nodes are sentences; 50 characters there) is flagged, because captions collide with the
// bilingual label shift. Two content checks: a correct option sharing a run of 6 or more words with the idea text (echo; it should test transfer to a new case), and a
// glossary term (English) that the page body never uses outside the glossary and the questions (taught before use; a simple plural counts). Sample questions (`sample: true`, unscored worked examples)
// get the per-question checks but are left out of the count and length rules.
const fs = require("fs");
const vm = require("vm");
const html = fs.readFileSync(process.argv[2], "utf8");
const m = html.match(/<script>\s*(window\.LESSON[\s\S]*?)<\/script>/);
if (!m) { console.error("no window.LESSON block found"); process.exit(2); }
// The page data is evaluated in an empty context with a time limit; it gets no require or process of its own. This is not a security boundary; pages are written by the agent.
const window = {};
try { vm.runInNewContext(m[1], { window }, { timeout: 1000 }); }
catch (e) { console.error("window.LESSON could not be evaluated: " + e.message); process.exit(2); }
const L = window.LESSON;
if (!L || !Array.isArray(L.questions) || !L.questions.length) { console.error("window.LESSON has no questions"); process.exit(2); }
const scored = L.questions.filter((q) => !(q && q.sample === true));
const langs = typeof (L.questions[0] || {}).stem === "string" ? [null] : ["en", "l2"];
const pick = (t, lang) => (lang ? (t && t[lang]) || "" : t || "");
const len = (s) => [...s].length;
const problems = [];
if (scored.length < 6 || scored.length > 18) problems.push("page has " + scored.length + " scored questions (samples excluded); write 6 to 18, about 10");
if (!Array.isArray(L.glossary) || !L.glossary.length) problems.push("no glossary");
L.questions.filter((q) => q && q.sample === true && q.at).forEach((q) => { if (!html.includes('id="sample-' + q.at + '"')) problems.push('sample at "' + q.at + '": no matching div id="sample-' + q.at + '"'); });
if (Array.isArray(L.glossary)) L.glossary.forEach((g, i) => {
  langs.forEach((lang) => {
    if (!g || !pick(g.term, lang) || !pick(g.def, lang)) problems.push("glossary entry " + (i + 1) + (lang ? " (" + lang + ")" : "") + ": missing term or definition");
  });
});

// Page shape (lessons only; drills have no teaching sections): a big-picture map, one picture and
// at most 100 words of text per idea, and a closing "together" section.
if (L.kind !== "drill") {
  const words = (h, lang) => {
    let t = h.replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<script[\s\S]*?<\/script>/g, " ");
    t = lang === "en" ? t.replace(/<span class="l2">[\s\S]*?<\/span>/g, " ") : t;
    t = t.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ");
    return (t.match(/[A-Za-z0-9'][A-Za-z0-9'\-]*/g) || []).length;
  };
  const big = html.match(/<section[^>]*id="bigpicture"[^>]*>([\s\S]*?)<\/section>/);
  if (!big) problems.push('no <section id="bigpicture"> (the part\'s map)'); else if (!/<svg/.test(big[1])) problems.push("big picture has no inline svg map");
  const ideas = [...html.matchAll(/<section[^>]*class="[^"]*\bidea\b[^"]*"[^>]*>([\s\S]*?)<\/section>/g)];
  if (!ideas.length) problems.push('no <section class="idea"> sections');
  ideas.forEach((m, i) => {
    if (!/<svg/.test(m[1])) problems.push("idea " + (i + 1) + ": no inline svg picture");
    const w = words(m[1], "en");
    if (w > 100) problems.push("idea " + (i + 1) + ": " + w + " words of text; at most 100");
  });
  const tog = html.match(/<section[^>]*id="together"[^>]*>([\s\S]*?)<\/section>/);
  if (!tog) problems.push('no <section id="together"> (putting it together)');
  else if (!/<svg/.test(tog[1])) problems.push("together section has no inline svg map");
}

// Content checks (lessons only): svg accessibility and captions, glossary terms used in the body, options echoing idea text.
let ideaText = "";
if (L.kind !== "drill") {
  const stripScripts = (h) => h.replace(/<script[\s\S]*?<\/script>/g, " ");
  const stripL2 = (h) => h.replace(/<(\w+)\b[^>]*class="[^"]*\bl2\b[^"]*"[^>]*>[\s\S]*?<\/\1>/g, " ");
  const plainText = (h) => stripL2(h).replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ");
  const svgs = [...html.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g)];
  const mapRanges = ["bigpicture", "together"].map((id) => { const x = html.match(new RegExp('<section[^>]*id="' + id + '"[^>]*>[\\s\\S]*?</section>')); return x ? [x.index, x.index + x[0].length] : null; }).filter(Boolean);
  svgs.forEach((m, i) => {
    // A map's nodes are plain sentences (references/lessons.md), so maps get a looser limit than the small pictures.
    const isMap = mapRanges.some(([a, b]) => m.index >= a && m.index < b);
    const maxChars = isMap ? 50 : 40, maxWords = isMap ? 10 : 6;
    const tag = "svg " + (i + 1) + (isMap ? " (map)" : "");
    if (!/\brole="img"/.test(m[1])) problems.push(tag + ': missing role="img"');
    if (!/\baria-label="[^"]+"/.test(m[1])) problems.push(tag + ": missing aria-label");
    if (!/<title>[^<]+<\/title>/.test(m[2])) problems.push(tag + ": missing <title>");
    [...m[2].matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].forEach((t) => {
      const txt = t[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const fs0 = (t[1].match(/font-size\s*[=:]\s*"?'?(\d+(?:\.\d+)?)/) || [])[1];
      if (len(txt) > maxChars) problems.push(tag + ': text of ' + len(txt) + ' characters (at most ' + maxChars + '): "' + txt + '"');
      if (fs0 && Number(fs0) < 11) problems.push(tag + ": text with font-size " + fs0 + " (at least 11): \"" + txt + "\"");
      const w = txt.split(" ").filter(Boolean).length;
      if (w > maxWords) problems.push(tag + ': caption of ' + w + ' words (labels only, at most ' + maxWords + '; put the explanation in the idea text): "' + txt + '"');
    });
  });
  const ideaHtml = [...html.matchAll(/<section[^>]*class="[^"]*\bidea\b[^"]*"[^>]*>([\s\S]*?)<\/section>/g)].map((m) => m[1]).join(" ");
  ideaText = plainText(ideaHtml);
  // Terms: the English term must be used in the page body, outside the glossary and the questions (scripts are not body).
  const body = plainText(stripScripts(html).replace(/<div[^>]*id="glossary"[^>]*>[\s\S]*?<\/div>/, " ").replace(/<section[^>]*id="glossary"[^>]*>[\s\S]*?<\/section>/, " ")).toLowerCase();
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  (Array.isArray(L.glossary) ? L.glossary : []).forEach((g) => {
    const term = ((g && (typeof g.term === "string" ? g.term : g.term && g.term.en)) || "").trim().toLowerCase();
    if (!term) return;
    const re = new RegExp("(?<![a-z0-9])" + esc(term) + "(?:s|es)?(?![a-z0-9])");
    const stem = term.replace(/(ies|es|s)$/, "");
    if (!re.test(body) && !(stem.length > 3 && new RegExp("(?<![a-z0-9])" + esc(stem) + "(?:s|es|ies|y)?(?![a-z0-9])").test(body)))
      problems.push('glossary term "' + term + '" is never used in the page body before the quiz; teach it inline where first used');
  });
}
const wordsOf = (t) => (t.toLowerCase().match(/[a-z0-9]+(?:'[a-z]+)?/g) || []);
const ideaWords = wordsOf(ideaText);
const RUN = 6;
const ideaRuns = new Set();
for (let i = 0; i + RUN <= ideaWords.length; i++) ideaRuns.add(ideaWords.slice(i, i + RUN).join(" "));

let qn = 0, sn = 0;
L.questions.forEach((q) => {
  const n = q.sample === true ? "sample " + ++sn : "q" + ++qn;
  if (!Array.isArray(q.options) || !q.options.length) { problems.push(n + ": no options"); return; }
  const need = q.options.filter((o) => o.correct).length;
  if (q.options.length < 3 || q.options.length > 5) problems.push(n + ": " + q.options.length + " options; write 3 to 5");
  if (L.kind !== "drill" && q.sample !== true) q.options.forEach((o, k) => {
    if (!o.correct) return;
    const w = wordsOf(pick(o.text, langs[0] === null ? null : "en"));
    for (let i = 0; i + RUN <= w.length; i++) if (ideaRuns.has(w.slice(i, i + RUN).join(" "))) { problems.push(n + ": correct option " + (k + 1) + " repeats the idea text (\"" + w.slice(i, i + RUN).join(" ") + "...\"); test a new case instead"); break; }
  });
  if (need === 0) problems.push(n + ": no correct option");
  const declaredSingle = q.single === true || q.multiple === false || q.type === "single";
  if (declaredSingle && need > 1) problems.push(n + ": declared single-choice but " + need + " options are marked correct");
  langs.forEach((lang) => {
    const tag = lang ? n + " (" + lang + ")" : n;
    const texts = q.options.map((o) => pick(o.text, lang));
    if (texts.some((t) => !t) || !pick(q.stem, lang)) problems.push(tag + ": missing text");
    if (q.options.some((o) => !pick(o.why, lang))) problems.push(tag + ": an option has no why");
    const ABBREV = /\b(e\.g|i\.e|vs|U\.S|U\.K|a\.m|p\.m|Dr|Mr|Mrs|Ms|Fig)\./g;
    const sentences = (t) => (t.replace(ABBREV, (a) => a.replace(/\./g, "")).match(/[.!?]["')\]]*(?=\s+[A-Z0-9"'(`]|\s*$)|[。！？]/g) || []).length;
    q.options.forEach((o, k) => {
      const w = pick(o.why, lang), c = sentences(w);
      if (w && (c < 2 || c > 4)) problems.push(tag + ": option " + (k + 1) + " why has " + c + " sentences; write two to four (see references/lessons.md)");
    });
    if (texts.some((t) => /\b(all|none) of the above\b/i.test(t))) problems.push(tag + ": all/none of the above");
    if (!L.showCount && /\b(select|choose|pick|which)\s+(the\s+)?(two|three|four|five|[2-5])\b|\(\s*[2-5]\s*(answers|options)\s*\)|选\s*[2-5二三四五]\s*项|[两二三四]项/i.test(pick(q.stem, lang)))
      problems.push(tag + ": stem says how many to pick; the page hides counts (set LESSON.showCount only for a mock that copies the exam's format)");
    const asksWhy = /\bwhy\b|为什么|为何/i.test(pick(q.stem, lang));
    const REASON = /\b(because|since|so that|in order to|to confirm|to verify|which fixes)\b|;\s*that fixes it|\bso\s+\w+\s+(can|will|would|returns|applies)\b|因为|所以|以便|为了|这样就能/i;
    if (!asksWhy) texts.forEach((t) => {
      if (REASON.test(t))
        problems.push(tag + ": option gives a reason; state only the choice: \"" + t + "\"");
    });
  });
});

// Length should not predict the answer in either direction. Record where the correct
// option(s) fall by length in each question, then check the page as a whole.
const rank = (q, lang) => {
  const need = (q.options || []).filter((o) => o.correct).length;
  if (need === 0 || need >= q.options.length) return "middle";
  const order = q.options.map((o) => ({ o, l: len(pick(o.text, lang)) })).sort((x, y) => y.l - x.l);
  const top = order.slice(0, need), bottom = order.slice(-need);
  const above = order[order.length - need - 1], below = order[need];
  if (top.every((x) => x.o.correct) && (!below || top[need - 1].l > below.l)) return "longest";
  if (bottom.every((x) => x.o.correct) && (!above || bottom[0].l < above.l)) return "shortest";
  return "middle";
};
langs.forEach((lang) => {
  const tag = lang ? "(" + lang + ") " : "";
  const ranks = scored.map((q) => rank(q, lang));
  const n = ranks.length, cap = Math.ceil(n / 4);
  const count = (r) => ranks.filter((x) => x === r).length;
  const where = (r) => ranks.map((x, i) => (x === r ? "q" + (i + 1) : null)).filter(Boolean).join(" ");
  ["longest", "shortest"].forEach((r) => {
    if (count(r) > cap) problems.push(tag + "correct option is the unique " + r + " in " + count(r) + " of " + n + " questions (" + where(r) + "); at most " + cap);
    if (n >= 6 && count(r) === 0) problems.push(tag + "correct option is never the " + r + "; a reader learns to skip that end, so mix it in");
  });
});

if (problems.length) { console.log(problems.join("\n")); process.exit(1); }
console.log("ok: " + scored.length + " scored questions" + (L.questions.length > scored.length ? " and " + (L.questions.length - scored.length) + " sample" : "") + ", no answer cues");
