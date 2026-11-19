// Shared quiz and recall components for lesson pages.
// A lesson defines window.LESSON = { id, kind, recall: [...], questions: [...], reason } before loading this file.
// kind: "lesson" (default), "drill" or "deck"; it names the page in the result line.
// A question with at: "name" renders into the element with data-quiz="name" (a course deck puts each on its own slide);
// other questions render into #quiz. Questions are numbered in data order either way.
// reason: true asks for a one-line reason (at least 10 characters, counted as code points) on every question before it can be checked.
// Any text field may be a string, or { en, l2 } on a bilingual page (see lang.js).
// Rules this component enforces:
//   - answer options are shuffled once per learner and page; the order is saved, so a reload keeps it
//   - progress (answers, marks, reasons, checked state) is saved in localStorage per page, so a reload
//     cannot reset a question (edited page content starts fresh); a finished page offers "Start over". Without storage the page still works.
//   - recall answers stay hidden until the learner has written something
//   - each question needs a sure / guessing mark (and a reason when LESSON.reason is set) before checking
//   - each question locks once checked; no changing answers after seeing feedback
//   - after checking, each option carries a text marker ("Correct answer" / "Your choice, wrong"), not colour alone
(function () {
  const L = window.LESSON;
  const state = { results: {}, sure: {}, recall: {}, reasons: {} };
  const KINDS = ["lesson", "drill", "deck"];
  const KIND = KINDS.indexOf(L.kind) >= 0 ? L.kind : "lesson";
  // A content signature in the key: if the page's questions change, old saved answers no longer apply.
  function signature() {
    const t = JSON.stringify([L.questions, L.recall]);
    let h = 5381;
    for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  const KEY = "learning-coach-progress:" + L.id + ":" + location.pathname + ":" + signature();
  let saved = { order: {}, answers: {}, sure: {}, reason: {}, checked: {}, recall: {} };

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
    recall: "Recall", question: "Question {n}", select: "Select {n}.", show: "Show answer",
    got: "Got it", partly: "Partly", missed: "Missed", check: "Check",
    correct: "Correct.", wrong: "Not quite. Read why each option is right or wrong.",
    copied: "Copied", selected: "Selected: copy it",
    startover: "Start over",
    sure: "Sure", guess: "Guessing", reason: "Why this answer? One line, at least 10 characters, before you check.",
    markright: "Correct answer", markwrong: "Your choice, wrong",
    tocheck: "To check: {list}.", pick1: "choose one answer", pickn: "choose {n} answers",
    marksure: "mark sure or guessing", writereason: "write a reason (at least 10 characters)"
  };
  const MIN_REASON = 10;
  // Length in code points, so Chinese and emoji count as one each.
  const chars = (s) => [...String(s).trim()].length;

  // Interface label in English, plus the second language when lang.js supplied one.
  function ui(key, n) {
    const fill = (s) => s.replace("{n}", n);
    if (!EN[key]) return "";
    const l2 = window.LESSON_L2_UI;
    return l2 && l2[key] ? { en: fill(EN[key]), l2: fill(l2[key]) } : fill(EN[key]);
  }

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

  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
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

  function renderQuestion(q, n, root) {
    const card = el("div", { class: "card" });
    card.append(bi("div", { class: "qnum" }, ui("question", n)));
    card.append(bi("div", { class: "stem" }, q.stem));
    const opts = Array.isArray(q.options) ? q.options.filter((o) => o && typeof o === "object") : [];
    if (!opts.length) { root.append(card); return; }
    const need = opts.filter((o) => o.correct).length;
    if (need > 1) card.append(bi("p", { class: "pick" }, ui("select", need)));
    const type = need > 1 ? "checkbox" : "radio";
    const name = "q" + n;
    const rows = orderFor(name, opts.length).map((idx) => {
      const o = opts[idx];
      const label = el("label", { class: "option" });
      const input = el("input", { type, name });
      const body = el("span");
      body.append(bi("span", {}, o.text));
      const why = bi("span", { class: "why" }, o.why);
      why.hidden = true;
      const mark = el("strong", { class: "mark" });
      mark.hidden = true;
      body.append(why, mark);
      label.append(input, body);
      card.append(label);
      return { o, idx, input, label, why, mark };
    });
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
    let reason = null;
    if (L.reason) {
      reason = el("textarea", { rows: "2", class: "reason" });
      const label = ui("reason");
      reason.placeholder = typeof label === "string" ? label : label.en + " / " + label.l2;
      reason.setAttribute("aria-label", typeof label === "string" ? label : label.en);
      reason.oninput = () => {
        saved.reason[name] = reason.value;
        save();
        ready();
      };
    }
    const check = bi("button", { style: "margin-top:.6rem", type: "button", "aria-describedby": name + "-need" }, ui("check"));
    check.disabled = true;
    const hint = el("p", { class: "hint", id: name + "-need" });
    const verdict = el("div", { class: "verdict", "aria-live": "polite" });
    // What is still missing before Check works, as one sentence per language.
    function missing() {
      const keys = [];
      if (rows.filter((r) => r.input.checked).length !== need) keys.push(need === 1 ? "pick1" : "pickn");
      if (sure === null) keys.push("marksure");
      if (reason && chars(reason.value) < MIN_REASON) keys.push("writereason");
      return keys;
    }
    function hintText(keys) {
      const parts = keys.map((k) => ui(k, need));
      const tpl = ui("tocheck");
      const join = (pick) => parts.map(pick).join(", ");
      if (typeof tpl === "string") return tpl.replace("{list}", join((p) => (typeof p === "string" ? p : p.en)));
      return { en: tpl.en.replace("{list}", join((p) => (typeof p === "string" ? p : p.en))), l2: tpl.l2.replace("{list}", join((p) => (typeof p === "string" ? p : p.l2))) };
    }
    function ready() {
      const keys = missing();
      check.disabled = keys.length > 0;
      if (keys.length) {
        const h = hintText(keys);
        setText(hint, h);
        check.title = typeof h === "string" ? h : h.en + " / " + h.l2;
      } else {
        hint.textContent = "";
        check.removeAttribute("title");
      }
    }
    card.addEventListener("change", () => {
      saved.answers[name] = rows.filter((r) => r.input.checked).map((r) => r.idx);
      save();
      ready();
    });
    function lock() {
      confButtons.forEach((b) => (b.disabled = true));
      if (reason) reason.readOnly = true;
      let right = true;
      rows.forEach((r) => {
        r.input.disabled = true;
        r.why.hidden = false;
        if (r.o.correct) r.label.classList.add("correct");
        else if (r.input.checked) r.label.classList.add("wrong");
        if (r.o.correct || r.input.checked) {
          setText(r.mark, ui(r.o.correct ? "markright" : "markwrong"));
          r.mark.hidden = false;
        }
        if (r.o.correct !== r.input.checked) right = false;
      });
      check.disabled = true;
      check.removeAttribute("title");
      hint.textContent = "";
      setText(verdict, ui(right ? "correct" : "wrong"));
      verdict.className = "verdict " + (right ? "good" : "bad");
      state.results[name] = right;
      state.sure[name] = sure;
      if (reason) state.reasons[name] = reason.value;
    }
    check.onclick = () => {
      saved.checked[name] = true;
      save();
      lock();
      updateResult();
    };
    if (reason) card.append(reason);
    card.append(conf, check, hint, verdict);
    root.append(card);
    // Restore saved progress.
    const a = saved.answers[name];
    if (Array.isArray(a)) rows.forEach((r) => (r.input.checked = a.indexOf(r.idx) >= 0));
    if (typeof saved.sure[name] === "boolean") setSure(saved.sure[name]);
    if (reason && typeof saved.reason[name] === "string") reason.value = saved.reason[name];
    ready();
    if (saved.checked[name]) lock();
  }

  // Compact one-line text for the result line: no pipes or line breaks, capped length.
  function oneLine(t) {
    const s = String(t || "").replace(/"/g, "'").replace(/[|\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    return s.length > 120 ? s.slice(0, 117) + "..." : s;
  }

  // The result line stays in English: it is pasted into the learning log.
  function updateResult() {
    const out = document.getElementById("result");
    if (!out) return;
    const byNumber = (o) => Object.keys(o).sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
    const nq = (L.questions || []).length;
    const done = Object.keys(state.results).length;
    const right = Object.values(state.results).filter(Boolean).length;
    const missed = byNumber(state.results).filter((k) => !state.results[k]);
    const list = (f) => byNumber(state.results).filter(f).join(", ") || "none";
    const recall = byNumber(state.recall).map((k) => k + " " + state.recall[k]).join(", ") || "not marked";
    const marks = byNumber(state.results).map((k) =>
      k + " " + (state.sure[k] ? "sure" : "guessing") + (state.reasons[k] ? ' "' + oneLine(state.reasons[k]) + '"' : "")
    ).join("; ") || "none";
    out.textContent =
      KIND.charAt(0).toUpperCase() + KIND.slice(1) + " " + L.id +
      " | score " + right + "/" + done + (done < nq ? " (unfinished, " + nq + " total)" : "") +
      " | missed: " + (missed.join(", ") || "none") +
      " | right but guessing: " + list((k) => state.results[k] && !state.sure[k]) +
      " | wrong but sure: " + list((k) => !state.results[k] && state.sure[k]) +
      " | recall: " + recall +
      " | marks: " + marks;
    const again = document.getElementById("startover");
    if (again) again.hidden = done < nq;
  }

  document.addEventListener("DOMContentLoaded", () => {
    load();
    renderRecall(document.getElementById("recall"));
    const quiz = document.getElementById("quiz");
    const slots = {};
    document.querySelectorAll("[data-quiz]").forEach((e) => (slots[e.getAttribute("data-quiz")] = e));
    (L.questions || []).forEach((q, i) => {
      const root = (q && slots[q.at]) || quiz;
      if (!root) return;
      try { renderQuestion(q || {}, i + 1, root); } catch (e) { console.error("question " + (i + 1) + " could not render", e); }
    });
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
