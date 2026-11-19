// Shared quiz and recall components for lesson pages.
// A lesson defines window.LESSON = { id, kind, recall: [...], questions: [...], reason, glossary, showCount, secondsPerQuestion } before loading this file.
// kind: "lesson" (default) or "drill"; it names the page in the result line.
// reason: a one-line reason (at least 10 characters, counted as code points) is required on every scored question before it can be checked. On by default; only `reason: false` turns it off.
// glossary: [{ term, def }] shown in #glossary before the quiz; the terms are links inside question text. Opening one before checking forces the "guessing" mark.
// showCount: true shows "Select N." on multi-select questions (mock exams that state the count). Default: the count is hidden and each option is scored on its own.
// secondsPerQuestion: a number turns on a soft timer per scored question (it never stops the learner); the time goes in the result line.
// Questions: { stem, options: [{ text, correct, why }], sample?: true, at?: "idea1", multi?: true }.
//   sample: true is an unscored worked-example question; it shows its explanation at once and is left out of the result line.
//   at: "idea1" renders a sample into <div id="sample-idea1"> inside the explanation; without it the sample goes first in #quiz.
//   multi: true forces checkboxes when only one option is correct (counts-shown pages only).
//   single: true renders radios on a hidden-count page. By default every question there is select-all-that-apply, so the input type never gives the count away.
// Any text field may be a string, or { en, l2 } on a bilingual page (see lang.js).
// Rules this component enforces:
//   - answer options are shuffled once per learner and page; the order is saved, so a reload keeps it
//   - progress (answers, marks, reasons, checked state) is saved in localStorage per page, so a reload
//     cannot reset a question (edited page content starts fresh); a finished page offers "Start over". Without storage the page still works.
//   - recall answers stay hidden until the learner has written something
//   - each scored question needs a sure / guessing mark (and a reason when LESSON.reason is set) before checking
//   - each question locks once checked; no changing answers after seeing feedback
//   - after checking, each option carries a text marker ("Correct answer. You chose it." / "Correct answer. You did not choose it." / "Wrong answer. You chose it."), not colour alone
//   - after checking, the learner marks their own reason right / partly right / wrong; the next question stays locked until they do
//   - multi-select questions give partial credit: the right options found minus wrong ones picked, over the right ones
(function () {
  const L = window.LESSON;
  const state = { results: {}, credit: {}, sure: {}, recall: {}, reasons: {}, rself: {}, opened: {}, time: {}, partial: {} };
  const KINDS = ["lesson", "drill"];
  const KIND = KINDS.indexOf(L.kind) >= 0 ? L.kind : "lesson";
  const SECS = Number(L.secondsPerQuestion) > 0 ? Math.round(Number(L.secondsPerQuestion)) : 0;
  const GLOSSARY = (Array.isArray(L.glossary) ? L.glossary : []).filter((g) => g && typeof g === "object" && g.term);
  // A content signature in the key: if the page's questions change, old saved answers no longer apply.
  function signature() {
    const t = JSON.stringify([L.questions, L.recall, L.glossary]);
    let h = 5381;
    for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  const KEY = "learning-coach-progress:" + L.id + ":" + location.pathname + ":" + signature();
  let saved = { order: {}, answers: {}, sure: {}, reason: {}, checked: {}, recall: {}, rself: {}, opened: {}, time: {}, fb: {}, changes: {}, redraw: {} };

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === "object") for (const k in saved) if (s[k] && typeof s[k] === "object") saved[k] = s[k];
    } catch (e) {}
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }
  function clearSaved() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  const EN = {
    recall: "Recall", question: "Question {n}", sample: "Sample {n} (not scored)",
    select: "Select {n}.", selectany: "Select all that apply.", show: "Show answer", showexp: "Show explanation",
    got: "Got it", partly: "Partly", missed: "Missed", check: "Check",
    correct: "Correct.", wrong: "Not quite. Read why each option is right or wrong.",
    partial: "Partly right: you found {k} of {m} right options. Read why each option is right or wrong.",
    partialx: "Partly right: you found {k} of {m} right options but also picked {x} wrong. Read why each option is right or wrong.",
    copied: "Copied", selected: "Selected: copy it",
    startover: "Start over",
    sure: "Sure", guess: "Guessing", reason: "Why this answer? One line, at least 10 characters, before you check.",
    markright: "Right option. You picked it.", markmissed: "Right option. You missed it.", markwrong: "Wrong option. You picked it.",
    tocheck: "To check: {list}.", pick1: "choose one answer", pickn: "choose {n} answers", pickany: "choose at least one option",
    marksure: "mark sure or guessing", writereason: "write a reason (at least 10 characters)",
    reasonask: "Was your reason right? Read the explanations, then mark it.",
    rsright: "Reason right", rspartly: "Reason partly right", rswrong: "Reason wrong",
    markreason: "Mark your reason to unlock the next question.",
    locked: "Finish the question above first.",
    opened: "You opened a term, so this question counts as guessing.",
    terms: "Open the definition of {term}", pace: "Pace {t} of {m}",
    redrawask: "Redraw the map from memory, then mark how it went.",
    redrawfull: "Redrew it fully", redrawpart: "Partly", redrawnot: "Not yet"
  };
  const MIN_REASON = 10;
  // Length in code points, so Chinese and emoji count as one each.
  const chars = (s) => [...String(s).trim()].length;

  // Interface label in English, plus the second language when lang.js supplied one.
  // vars is a number (for {n}) or an object of {name: value}.
  function ui(key, vars) {
    const v = vars && typeof vars === "object" ? vars : { n: vars };
    const fill = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));
    if (!EN[key]) return "";
    const l2 = window.LESSON_L2_UI;
    return l2 && l2[key] ? { en: fill(EN[key]), l2: fill(l2[key]) } : fill(EN[key]);
  }
  const plain = (t) => (typeof t === "string" ? t : t.en + " / " + t.l2);
  const plainEn = (t) => (typeof t === "string" ? t : t.en);

  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === "class") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    if (text != null) e.textContent = text;
    return e;
  }

  // Element holding an English and a second-language span, or plain text for a string.
  function bi(tag, attrs, t) {
    const e = el(tag, attrs);
    setText(e, t);
    return e;
  }

  function setText(e, t) {
    e.textContent = "";
    if (typeof t === "string") e.textContent = t;
    else if (t && typeof t === "object") e.append(el("span", { class: "en" }, text(t.en)), el("span", { class: "l2" }, text(t.l2)));
  }

  // A text field that is not a string (missing or malformed) counts as empty.
  function text(t) { return typeof t === "string" ? t : ""; }

  // One field of a glossary entry in one language ("en" for a plain page).
  function field(f, lang) { return typeof f === "string" ? f : f && typeof f === "object" ? text(f[lang]) : ""; }
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Text with glossary terms turned into buttons that open the definition. ctx: { onOpen(entry) }.
  function fillRich(target, str, lang, ctx) {
    target.textContent = "";
    const terms = GLOSSARY.map((g) => ({ g, t: field(g.term, lang) })).filter((x) => x.t).sort((a, b) => b.t.length - a.t.length);
    if (!ctx || !terms.length || !str) { target.textContent = str; return; }
    const part = (x) => /^[\x00-\x7f]+$/.test(x.t) ? "(?<![A-Za-z0-9])" + escapeRe(x.t) + "(?![A-Za-z0-9])" : escapeRe(x.t);
    let re;
    try { re = new RegExp(terms.map(part).join("|"), "gi"); } catch (e) { target.textContent = str; return; }
    let last = 0, m;
    while ((m = re.exec(str))) {
      if (m.index > last) target.append(document.createTextNode(str.slice(last, m.index)));
      const hit = terms.find((x) => x.t.toLowerCase() === m[0].toLowerCase());
      const b = el("button", { type: "button", class: "term-link", "aria-expanded": "false", title: plain(ui("terms", { term: m[0] })) }, m[0]);
      b.onclick = () => ctx.onOpen(hit.g, b);
      target.append(b);
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    if (last < str.length) target.append(document.createTextNode(str.slice(last)));
  }
  function rich(tag, attrs, t, ctx) {
    const e = el(tag, attrs);
    if (typeof t === "string") fillRich(e, t, "en", ctx);
    else if (t && typeof t === "object") {
      const en = el("span", { class: "en" }), l2 = el("span", { class: "l2" });
      fillRich(en, text(t.en), "en", ctx);
      fillRich(l2, text(t.l2), "l2", ctx);
      e.append(en, l2);
    }
    return e;
  }

  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  // Terms for this page, shown before the quiz.
  function renderGlossary() {
    if (!GLOSSARY.length) return;
    let root = document.getElementById("glossary");
    if (!root) {
      const quiz = document.getElementById("quiz");
      if (!quiz) return;
      root = el("div", { id: "glossary" });
      quiz.before(root);
    }
    const dl = el("dl", { class: "glossary" });
    GLOSSARY.forEach((g) => {
      dl.append(bi("dt", {}, g.term), bi("dd", {}, g.def));
    });
    root.append(dl);
  }

  // Free recall: write first, then reveal, then self-mark.
  function renderRecall(root) {
    if (!root) return;
    (L.recall || []).forEach((r0, i) => {
      const r = r0 || {};
      const card = el("div", { class: "card" });
      const label = ui("recall");
      card.append(bi("div", { class: "qnum" }, typeof label === "string"
        ? label + " " + (i + 1) : { en: label.en + " " + (i + 1), l2: label.l2 + " " + (i + 1) }));
      card.append(bi("div", { class: "stem" }, r.prompt));
      const ta = el("textarea", { rows: "3", "aria-label": "Your answer from memory" });
      const rid = "r" + (i + 1);
      const rs = saved.recall[rid] || {};
      const show = bi("button", { class: "secondary", type: "button" }, ui("show"));
      show.disabled = true;
      const model = bi("div", { class: "model-answer" }, r.answer);
      const marks = el("div", { class: "selfmark row" });
      [["got it", "got"], ["partly", "partly"], ["missed", "missed"]].forEach(([key, labelKey]) => {
        const b = bi("button", { class: "secondary", type: "button", "aria-pressed": "false" }, ui(labelKey));
        b.onclick = () => {
          state.recall[rid] = key;
          [...marks.children].forEach((c) => (c.disabled = true));
          b.disabled = false;
          b.classList.remove("secondary");
          b.setAttribute("aria-pressed", "true");
          saved.recall[rid] = { text: ta.value, shown: true, mark: key };
          save();
          updateResult();
        };
        b.dataset.key = key;
        marks.append(b);
      });
      ta.oninput = () => {
        show.disabled = ta.value.trim().length < 1;
        saved.recall[rid] = { text: ta.value, shown: false };
        save();
      };
      function reveal() {
        ta.readOnly = true;
        show.disabled = true;
        model.style.display = "block";
        marks.style.display = "flex";
      }
      show.onclick = () => {
        reveal();
        saved.recall[rid] = { text: ta.value, shown: true };
        save();
      };
      const row = el("div", { class: "row", style: "margin-top:.6rem" });
      row.append(show);
      card.append(ta, row, model, marks);
      root.append(card);
      if (typeof rs.text === "string" && rs.text) { ta.value = rs.text; show.disabled = ta.value.trim().length < 1; }
      if (rs.shown) reveal();
      if (rs.shown && rs.mark) {
        [...marks.children].forEach((c) => {
          if (c.dataset.key === rs.mark) { c.classList.remove("secondary"); c.setAttribute("aria-pressed", "true"); } else c.disabled = true;
        });
        state.recall[rid] = rs.mark;
      }
    });
  }

  // Explain it back: the learner redraws or fills the map from memory, closed book, then self-marks.
  const REDRAW = [["fully", "redrawfull"], ["partly", "redrawpart"], ["not yet", "redrawnot"]];
  function renderRedraw(root) {
    if (!root) return;
    const row = el("div", { class: "row", role: "group", "aria-label": "Redraw the map from memory" });
    row.append(bi("span", { class: "selfask" }, ui("redrawask")));
    const btns = REDRAW.map(([key, labelKey]) => {
      const b = bi("button", { class: "secondary", type: "button", "aria-pressed": "false" }, ui(labelKey));
      b.onclick = () => { saved.redraw.mark = key; save(); paint(); updateResult(); };
      return b;
    });
    function paint() {
      btns.forEach((b, i) => { const on = saved.redraw.mark === REDRAW[i][0]; b.setAttribute("aria-pressed", String(on)); b.classList.toggle("secondary", !on); });
    }
    row.append(...btns); root.append(row); paint();
  }

  // Saved option order, if it is a valid permutation; otherwise a fresh shuffle.
  function orderFor(name, count) {
    const o = saved.order[name];
    const ok = Array.isArray(o) && o.length === count && o.every((v) => Number.isInteger(v) && v >= 0 && v < count) &&
      new Set(o).size === count;
    if (ok) return o;
    const fresh = shuffle([...Array(count).keys()]);
    saved.order[name] = fresh;
    save();
    return fresh;
  }

  const gates = []; // scored questions in order: { card, done(), activate() }
  function refreshGates() {
    let blocked = false;
    gates.forEach((g) => {
      g.card.classList.toggle("locked", blocked);
      if (blocked) g.card.setAttribute("inert", ""); else g.card.removeAttribute("inert");
      g.lockmsg.hidden = !blocked;
      if (!blocked) g.activate();
      if (!g.done()) blocked = true;
    });
  }

  // label: the heading shown on the card; name: the storage key ("q3" scored, "s1" sample).
  function renderQuestion(q, label, name, root, sample) {
    const card = el("div", { class: "card" + (sample ? " sample" : "") });
    const lockmsg = bi("p", { class: "hint lockmsg" }, ui("locked"));
    lockmsg.hidden = true;
    card.append(bi("div", { class: "qnum" }, label));
    if (!sample) card.append(lockmsg);
    // Glossary terms opened from this question.
    let opened = !sample && saved.opened[name] === true;
    const defBox = el("div", { class: "termdef", "aria-live": "polite" });
    defBox.hidden = true;
    let openTerm = null;
    const ctx = GLOSSARY.length ? {
      onOpen(g, button) {
        if (openTerm === g) { defBox.hidden = true; openTerm = null; button.setAttribute("aria-expanded", "false"); return; }
        openTerm = g;
        const both = typeof g.term === "object" || typeof g.def === "object";
        setText(defBox, both
          ? { en: field(g.term, "en") + ": " + field(g.def, "en"), l2: field(g.term, "l2") + ": " + field(g.def, "l2") }
          : field(g.term, "en") + ": " + field(g.def, "en"));
        defBox.hidden = false;
        button.setAttribute("aria-expanded", "true");
        if (!sample && !locked) markOpened();
      }
    } : null;
    card.append(rich("div", { class: "stem" }, q.stem, ctx), defBox);
    const opts = Array.isArray(q.options) ? q.options.filter((o) => o && typeof o === "object") : [];
    if (!opts.length) { root.append(card); return; }
    const need = opts.filter((o) => o.correct).length;
    // Hidden-count pages render every question as select-all-that-apply, so the input type never signals the count; only `single: true` makes radios.
    const multi = L.showCount === true ? q.multi === true || need > 1 : q.single !== true;
    if (multi) card.append(bi("p", { class: "pick" }, L.showCount === true ? ui("select", need) : ui("selectany")));
    const type = multi ? "checkbox" : "radio";
    const rows = orderFor(name, opts.length).map((idx) => {
      const o = opts[idx];
      const lab = el("label", { class: "option" });
      const input = el("input", { type, name });
      const body = el("span");
      body.append(rich("span", {}, o.text, ctx));
      const why = bi("span", { class: "why" }, o.why);
      why.hidden = true;
      const mark = el("strong", { class: "mark" });
      mark.hidden = true;
      body.append(why, mark);
      lab.append(input, body);
      card.append(lab);
      return { o, idx, input, label: lab, why, mark };
    });
    const hint = el("p", { class: "hint", id: name + "-need" });
    const verdict = el("div", { class: "verdict", "aria-live": "polite" });
    let locked = false;

    function reveal() {
      let right = true, same = 0, hits = 0, extra = 0;
      rows.forEach((r) => {
        r.input.disabled = true;
        r.why.hidden = false;
        if (r.o.correct) r.label.classList.add("correct");
        else if (r.input.checked) r.label.classList.add("wrong");
        if (r.o.correct || r.input.checked) {
          setText(r.mark, ui(r.o.correct ? (r.input.checked ? "markright" : "markmissed") : "markwrong"));
          r.mark.hidden = false;
        }
        if (r.o.correct && r.input.checked) hits++;
        if (!r.o.correct && r.input.checked) extra++;
        if (r.o.correct !== r.input.checked) right = false; else same++;
      });
      locked = true;
      return { right, same, hits, extra };
    }

    if (sample) {
      const showBtn = bi("button", { style: "margin-top:.6rem", type: "button" }, ui("showexp"));
      showBtn.disabled = true;
      card.addEventListener("change", () => {
        saved.answers[name] = rows.filter((r) => r.input.checked).map((r) => r.idx);
        save();
        showBtn.disabled = locked || !rows.some((r) => r.input.checked);
      });
      showBtn.onclick = () => {
        reveal();
        showBtn.disabled = true;
        saved.checked[name] = true;
        save();
      };
      card.append(showBtn);
      root.append(card);
      const a = saved.answers[name];
      if (Array.isArray(a)) rows.forEach((r) => (r.input.checked = a.indexOf(r.idx) >= 0));
      showBtn.disabled = !rows.some((r) => r.input.checked);
      if (saved.checked[name]) { reveal(); showBtn.disabled = true; }
      return;
    }

    let sure = null;
    function setSure(value) {
      sure = value;
      confButtons.forEach((c, k) => {
        c.classList.toggle("secondary", [true, false][k] !== value);
        c.setAttribute("aria-pressed", String([true, false][k] === value));
      });
    }
    const conf = el("div", { class: "row confidence" });
    const confButtons = [[true, "sure"], [false, "guess"]].map(([value, key]) => {
      const b = bi("button", { class: "secondary", type: "button", "aria-pressed": "false" }, ui(key));
      b.onclick = () => {
        setSure(value);
        saved.sure[name] = value;
        save();
        ready();
      };
      conf.append(b);
      return b;
    });
    // Opening a glossary term makes the question a guess: the learner did not know the term.
    function markOpened() {
      if (locked) return;
      opened = true;
      saved.opened[name] = true;
      setSure(false);
      saved.sure[name] = false;
      confButtons[0].disabled = true;
      save();
      ready();
    }
    let reason = null;
    if (L.reason !== false) {
      reason = el("textarea", { rows: "2", class: "reason" });
      const lab = ui("reason");
      reason.placeholder = plain(lab);
      reason.setAttribute("aria-label", plainEn(lab));
      reason.oninput = () => {
        saved.reason[name] = reason.value;
        save();
        ready();
      };
    }
    const check = bi("button", { style: "margin-top:.6rem", type: "button", "aria-describedby": name + "-need" }, ui("check"));
    check.disabled = true;
    // Timer: starts when the question unlocks, never stops the learner.
    let t0 = null, tick = null, timerEl = null;
    if (SECS) {
      timerEl = el("p", { class: "timer", role: "timer" });
      card.append(timerEl);
    }
    const mmss = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
    function paintTimer() {
      if (!timerEl || t0 === null) return;
      const s = Math.round((Date.now() - t0) / 1000);
      setText(timerEl, ui("pace", { t: mmss(s), m: mmss(SECS) }));
      timerEl.classList.toggle("over", s > SECS);
    }
    function startTimer() {
      if (!SECS || t0 !== null || locked) return;
      t0 = Date.now();
      paintTimer();
      tick = setInterval(paintTimer, 1000);
    }
    // What is still missing before Check works, as one sentence per language.
    function missing() {
      const keys = [];
      const picked = rows.filter((r) => r.input.checked).length;
      if (!multi) { if (picked !== 1) keys.push("pick1"); }
      else if (L.showCount === true) { if (picked !== need) keys.push("pickn"); }
      else if (picked < 1) keys.push("pickany");
      if (sure === null) keys.push("marksure");
      if (reason && chars(reason.value) < MIN_REASON) keys.push("writereason");
      return keys;
    }
    function hintText(keys) {
      const parts = keys.map((k) => ui(k, need));
      const tpl = ui("tocheck");
      const join = (pick) => parts.map(pick).join(", ");
      if (typeof tpl === "string") return tpl.replace("{list}", join(plainEn));
      return { en: tpl.en.replace("{list}", join(plainEn)), l2: tpl.l2.replace("{list}", join((p) => (typeof p === "string" ? p : p.l2))) };
    }
    function ready() {
      if (locked) return;
      const keys = missing();
      check.disabled = keys.length > 0;
      const note = opened ? ui("opened") : "";
      if (keys.length) {
        const h = hintText(keys);
        setText(hint, h);
        if (note) hint.append(document.createTextNode(" "), bi("span", {}, note));
        check.title = plain(h);
      } else {
        if (note) setText(hint, note); else hint.textContent = "";
        check.removeAttribute("title");
      }
    }
    card.addEventListener("change", (ev) => {
      if (ev.target && ev.target.type !== "text" && Array.isArray(saved.answers[name])) saved.changes[name] = (saved.changes[name] || 0) + 1;
      saved.answers[name] = rows.filter((r) => r.input.checked).map((r) => r.idx);
      save();
      ready();
    });
    // Reason self-check, shown after the explanation.
    const selfcheck = el("div", { class: "selfcheck", role: "group", "aria-label": "Was your reason right?" });
    selfcheck.hidden = true;
    const selfButtons = [["right", "rsright"], ["partly", "rspartly"], ["wrong", "rswrong"]].map(([key, labelKey]) => {
      const b = bi("button", { class: "secondary", type: "button", "aria-pressed": "false" }, ui(labelKey));
      b.dataset.key = key;
      b.onclick = () => {
        saved.rself[name] = key;
        save();
        applySelf(key);
        updateResult();
        refreshGates();
      };
      return b;
    });
    selfcheck.append(bi("p", { class: "selfask" }, ui("reasonask")), ...selfButtons);
    function applySelf(key) {
      state.rself[name] = key;
      selfButtons.forEach((b) => {
        const on = b.dataset.key === key;
        b.setAttribute("aria-pressed", String(on));
        b.classList.toggle("secondary", !on);
        b.disabled = !on;
      });
      hint.textContent = "";
    }
    function lock(elapsed) {
      confButtons.forEach((b) => (b.disabled = true));
      if (reason) reason.readOnly = true;
      const { right, same, hits, extra } = reveal();
      const need = rows.filter((r) => r.o.correct).length;
      if (tick) { clearInterval(tick); tick = null; }
      check.disabled = true;
      check.removeAttribute("title");
      const credit = right ? 1 : multi ? Math.max(0, (hits - extra) / need) : 0;
      setText(verdict, right ? ui("correct") : multi && credit > 0 ? ui(extra ? "partialx" : "partial", { k: hits, m: need, x: extra }) : ui("wrong"));
      verdict.className = "verdict " + (right ? "good" : "bad");
      state.results[name] = right;
      state.credit[name] = credit;
      if (multi && !right) state.partial[name] = hits + "/" + need + (extra ? " +" + extra + " wrong" : "");
      state.sure[name] = sure;
      state.opened[name] = opened;
      if (reason) state.reasons[name] = reason.value;
      if (typeof elapsed === "number") state.time[name] = elapsed;
      selfcheck.hidden = false;
      if (!state.rself[name]) setText(hint, ui("markreason"));
    }
    check.onclick = () => {
      const elapsed = t0 === null ? null : Math.round((Date.now() - t0) / 1000);
      saved.checked[name] = true;
      if (elapsed !== null) saved.time[name] = elapsed;
      save();
      lock(elapsed);
      updateResult();
      refreshGates();
    };
    if (reason) card.append(reason);
    card.append(conf, check, hint, verdict, selfcheck);
    root.append(card);
    // Restore saved progress.
    const a = saved.answers[name];
    if (Array.isArray(a)) rows.forEach((r) => (r.input.checked = a.indexOf(r.idx) >= 0));
    if (typeof saved.sure[name] === "boolean") setSure(saved.sure[name]);
    if (opened) { setSure(false); confButtons[0].disabled = true; }
    if (reason && typeof saved.reason[name] === "string") reason.value = saved.reason[name];
    ready();
    if (saved.checked[name]) {
      lock(typeof saved.time[name] === "number" ? saved.time[name] : undefined);
      const rs = saved.rself[name];
      if (rs === "right" || rs === "partly" || rs === "wrong") applySelf(rs);
      if (timerEl && typeof saved.time[name] === "number") setText(timerEl, ui("pace", { t: mmss(saved.time[name]), m: mmss(SECS) }));
    }
    gates.push({ card, lockmsg, done: () => !!state.rself[name], activate: startTimer });
  }

  // Compact one-line text for the result line: no pipes or line breaks, capped length.
  function oneLine(t) {
    const s = String(t || "").replace(/"/g, "'").replace(/[|\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    return s.length > 120 ? s.slice(0, 117) + "..." : s;
  }

  const scored = () => (L.questions || []).filter((q) => !(q && q.sample === true));

  const FB = [
    ["clarity", "Explanations", ["clear", "okay", "confusing"]],
    ["fairness", "Questions", ["fair", "some unfair or tricky wording", "many unfair"]],
    ["level", "Difficulty", ["too easy", "about right", "too hard"]],
  ];
  function fbText() {
    const parts = FB.filter(([k]) => saved.fb[k]).map(([k, label]) => label.toLowerCase() + " " + saved.fb[k]);
    if (saved.fb.note) parts.push('note "' + oneLine(saved.fb.note) + '"');
    return parts.join(", ") || "none";
  }
  function renderFeedback(root) {
    if (!root) return;
    FB.forEach(([k, label, opts]) => {
      const row = el("div", { class: "row", role: "group", "aria-label": label });
      row.append(el("strong", {}, label + ": "));
      const btns = opts.map((o) => {
        const b = el("button", { class: "secondary", type: "button", "aria-pressed": "false" }, o);
        b.onclick = () => { saved.fb[k] = o; save(); paint(); updateResult(); };
        return b;
      });
      function paint() {
        btns.forEach((b, i) => { const on = saved.fb[k] === opts[i]; b.setAttribute("aria-pressed", String(on)); b.classList.toggle("secondary", !on); });
      }
      row.append(...btns); root.append(row); paint();
    });
    const note = el("textarea", { rows: "3", style: "width:100%", "aria-label": "What would make this lesson or quiz better?", placeholder: "What would make this lesson or quiz better? Unclear terms, unfair questions, missing steps." });
    note.value = typeof saved.fb.note === "string" ? saved.fb.note : "";
    note.addEventListener("input", () => { saved.fb.note = note.value; save(); updateResult(); });
    root.append(note);
  }

  // The result line stays in English: it is pasted into the learning log.
  // A question counts as finished only after it is checked and the learner has marked their reason.
  function updateResult() {
    const out = document.getElementById("result");
    if (!out) return;
    const byNumber = (o) => Object.keys(o).sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
    const nq = scored().length;
    const fin = byNumber(state.results).filter((k) => state.rself[k]);
    const done = fin.length;
    const credit = Math.round(fin.reduce((s, k) => s + state.credit[k], 0) * 10) / 10;
    const missed = fin.filter((k) => !state.results[k]);
    const list = (f) => fin.filter(f).join(", ") || "none";
    const sureRight = fin.filter((k) => state.results[k] && state.sure[k] && state.rself[k] === "right").length;
    const recall = byNumber(state.recall).map((k) => k + " " + state.recall[k]).join(", ") || "not marked";
    const marks = fin.map((k) =>
      k + " " + (state.sure[k] ? "sure" : "guessing" + (state.opened[k] ? " (term opened)" : "")) + ", reason " + state.rself[k] +
      (typeof state.time[k] === "number" ? ", " + state.time[k] + "s" : "") +
      (state.reasons[k] ? ' "' + oneLine(state.reasons[k]) + '"' : "")
    ).join("; ") || "none";
    const partial = fin.filter((k) => state.partial[k] && state.credit[k] > 0).map((k) => k + " " + state.partial[k]);
    const nChanged = fin.filter((k) => saved.changes[k] > 0).length;
    const over = SECS ? fin.filter((k) => typeof state.time[k] === "number" && state.time[k] > SECS) : [];
    out.textContent =
      KIND.charAt(0).toUpperCase() + KIND.slice(1) + " " + L.id +
      " | score " + credit + "/" + done + (done < nq ? " (unfinished, " + nq + " total)" : "") +
      " | missed: " + (missed.join(", ") || "none") +
      (partial.length ? " | partial credit: " + partial.join(", ") : "") +
      " | sure and right: " + sureRight + "/" + done + (done ? " (" + Math.round((100 * sureRight) / done) + "%)" : "") +
      " | right but guessing: " + list((k) => state.results[k] && !state.sure[k]) +
      " | wrong but sure: " + list((k) => !state.results[k] && state.sure[k]) +
      " | right answer, reason not right: " + list((k) => state.results[k] && state.sure[k] && state.rself[k] !== "right") +
      (SECS ? " | timed " + SECS + "s per question, over: " + (over.join(", ") || "none") : "") +
      " | recall: " + recall +
      (document.getElementById("redraw") ? " | redraw: " + (saved.redraw.mark || "not marked") : "") +
      " | marks: " + marks +
      (nChanged ? " | answers changed before checking: " + nChanged : "") +
      " | page feedback: " + fbText();
    const again = document.getElementById("startover");
    if (again) again.hidden = done < nq;
  }

  document.addEventListener("DOMContentLoaded", () => {
    load();
    renderRecall(document.getElementById("recall"));
    renderGlossary();
    renderRedraw(document.getElementById("redraw"));
    renderFeedback(document.getElementById("feedback"));
    const quiz = document.getElementById("quiz");
    let sn = 0, qn = 0;
    (L.questions || []).forEach((q0) => {
      const q = q0 || {};
      try {
        if (q.sample === true) {
          sn++;
          const at = typeof q.at === "string" ? document.getElementById("sample-" + q.at) : null;
          const root = at || quiz;
          if (root) renderQuestion(q, ui("sample", sn), "s" + sn, root, true);
        } else {
          qn++;
          if (quiz) renderQuestion(q, ui("question", qn), "q" + qn, quiz, false);
        }
      } catch (e) { console.error("question " + (q.sample === true ? "sample " + sn : qn) + " could not render", e); }
    });
    refreshGates();
    const copy = document.getElementById("copy");
    if (copy) {
      const again = el("button", { id: "startover", class: "secondary", type: "button", style: "margin-left:.5rem" });
      setText(again, ui("startover"));
      again.hidden = true;
      again.onclick = () => { clearSaved(); location.reload(); };
      copy.after(again);
    }
    updateResult();
    if (copy) copy.onclick = async () => {
      const text = document.getElementById("result").textContent;
      try { await navigator.clipboard.writeText(text); setText(copy, ui("copied")); }
      catch (e) {
        const r = document.createRange();
        r.selectNodeContents(document.getElementById("result"));
        const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        setText(copy, ui("selected"));
      }
    };
  });
})();
