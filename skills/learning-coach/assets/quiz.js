// Shared quiz and recall components for lesson pages.
// A lesson defines window.LESSON = { id, recall: [...], questions: [...], reason } before loading this file.
// reason: true asks for a one-line reason on every question before it can be checked.
// Any text field may be a string, or { en, l2 } on a bilingual page (see lang.js).
// Rules this component enforces:
//   - answer options are shuffled on every load, so the correct answer has no fixed position
//   - recall answers stay hidden until the learner has written something
//   - each question needs a sure / guessing mark (and a reason when LESSON.reason is set) before checking
//   - each question locks once checked; no changing answers after seeing feedback
(function () {
  const L = window.LESSON;
  const state = { results: {}, sure: {}, recall: {} };

  const EN = {
    recall: "Recall", question: "Question {n}", select: "Select {n}.", show: "Show answer",
    got: "Got it", partly: "Partly", missed: "Missed", check: "Check",
    correct: "Correct.", wrong: "Not quite. Read why each option is right or wrong.",
    copied: "Copied", selected: "Selected: press Cmd+C",
    sure: "Sure", guess: "Guessing", reason: "Why this answer? One line, before you check."
  };

  // Interface label in English, plus the second language when lang.js supplied one.
  function ui(key, n) {
    const fill = (s) => s.replace("{n}", n);
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
    else e.append(el("span", { class: "en" }, t.en), el("span", { class: "l2" }, t.l2));
  }

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
    L.recall.forEach((r, i) => {
      const card = el("div", { class: "card" });
      const label = ui("recall");
      card.append(bi("div", { class: "qnum" }, typeof label === "string"
        ? label + " " + (i + 1) : { en: label.en + " " + (i + 1), l2: label.l2 + " " + (i + 1) }));
      card.append(bi("div", { class: "stem" }, r.prompt));
      const ta = el("textarea", { rows: "3", "aria-label": "Your answer from memory" });
      const show = bi("button", { class: "secondary" }, ui("show"));
      show.disabled = true;
      const model = bi("div", { class: "model-answer" }, r.answer);
      const marks = el("div", { class: "selfmark row" });
      [["got it", "got"], ["partly", "partly"], ["missed", "missed"]].forEach(([key, labelKey]) => {
        const b = bi("button", { class: "secondary" }, ui(labelKey));
        b.onclick = () => {
          state.recall["r" + (i + 1)] = key;
          [...marks.children].forEach((c) => (c.disabled = true));
          b.disabled = false;
          b.classList.remove("secondary");
          updateResult();
        };
        marks.append(b);
      });
      ta.oninput = () => (show.disabled = ta.value.trim().length < 15);
      show.onclick = () => {
        ta.readOnly = true;
        show.disabled = true;
        model.style.display = "block";
        marks.style.display = "flex";
      };
      const row = el("div", { class: "row", style: "margin-top:.6rem" });
      row.append(show);
      card.append(ta, row, model, marks);
      root.append(card);
    });
  }

  function renderQuestion(q, n, root) {
    const card = el("div", { class: "card" });
    card.append(bi("div", { class: "qnum" }, ui("question", n)));
    card.append(bi("div", { class: "stem" }, q.stem));
    const need = q.options.filter((o) => o.correct).length;
    if (need > 1) card.append(bi("p", { class: "pick" }, ui("select", need)));
    const type = need > 1 ? "checkbox" : "radio";
    const name = "q" + n;
    const rows = shuffle(q.options).map((o) => {
      const label = el("label", { class: "option" });
      const input = el("input", { type, name });
      const body = el("span");
      body.append(bi("span", {}, o.text));
      const why = bi("span", { class: "why" }, o.why);
      why.hidden = true;
      body.append(why);
      label.append(input, body);
      card.append(label);
      return { o, input, label, why };
    });
    let sure = null;
    const conf = el("div", { class: "row confidence" });
    const confButtons = [[true, "sure"], [false, "guess"]].map(([value, key]) => {
      const b = bi("button", { class: "secondary", type: "button" }, ui(key));
      b.onclick = () => {
        sure = value;
        confButtons.forEach((c) => c.classList.add("secondary"));
        b.classList.remove("secondary");
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
      reason.oninput = ready;
    }
    const check = bi("button", { style: "margin-top:.6rem" }, ui("check"));
    check.disabled = true;
    const verdict = el("div", { class: "verdict" });
    function ready() {
      check.disabled = rows.filter((r) => r.input.checked).length !== need || sure === null ||
        (reason && reason.value.trim().length < 10);
    }
    card.addEventListener("change", ready);
    check.onclick = () => {
      confButtons.forEach((b) => (b.disabled = true));
      if (reason) reason.readOnly = true;
      let right = true;
      rows.forEach((r) => {
        r.input.disabled = true;
        r.why.hidden = false;
        if (r.o.correct) r.label.classList.add("correct");
        else if (r.input.checked) r.label.classList.add("wrong");
        if (r.o.correct !== r.input.checked) right = false;
      });
      check.disabled = true;
      setText(verdict, ui(right ? "correct" : "wrong"));
      verdict.className = "verdict " + (right ? "good" : "bad");
      state.results[name] = right;
      state.sure[name] = sure;
      updateResult();
    };
    if (reason) card.append(reason);
    card.append(conf, check, verdict);
    root.append(card);
  }

  // The result line stays in English: it is pasted into the learning log.
  function updateResult() {
    const out = document.getElementById("result");
    if (!out) return;
    const done = Object.keys(state.results).length;
    const right = Object.values(state.results).filter(Boolean).length;
    const missed = Object.keys(state.results).filter((k) => !state.results[k]);
    const list = (f) => Object.keys(state.results).filter(f).join(", ") || "none";
    const recall = Object.keys(state.recall).map((k) => k + " " + state.recall[k]).join(", ") || "not marked";
    out.textContent =
      "Lesson " + L.id +
      " | score " + right + "/" + done + (done < L.questions.length ? " (unfinished, " + L.questions.length + " total)" : "") +
      " | missed: " + (missed.join(", ") || "none") +
      " | right but guessing: " + list((k) => state.results[k] && !state.sure[k]) +
      " | wrong but sure: " + list((k) => !state.results[k] && state.sure[k]) +
      " | recall: " + recall;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderRecall(document.getElementById("recall"));
    const quiz = document.getElementById("quiz");
    L.questions.forEach((q, i) => renderQuestion(q, i + 1, quiz));
    updateResult();
    const copy = document.getElementById("copy");
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
