// Optional second-language switch for lesson and reference pages.
// Load it only on bilingual pages. Mark the second language on <html>, e.g.
//   <html lang="en" data-l2="zh" data-l2-name="中文">
// Content carries class "en" or "l2"; the switch sets <html data-lang="en|l2|both">.
// English is the default; the learner's choice is remembered when storage is available.
(function () {
  const KEY = "learning-coach-lang";
  const root = document.documentElement;
  const name = root.getAttribute("data-l2-name") || root.getAttribute("data-l2") || "L2";
  const MODES = [["en", "EN"], ["l2", name], ["both", "EN + " + name]];

  // Interface labels for quiz.js, per second language. Missing languages fall back to English only.
  const UI = {
    zh: {
      recall: "回忆", question: "第 {n} 题", select: "选 {n} 项。", show: "看答案",
      got: "对了", partly: "部分对", missed: "没对", check: "检查",
      correct: "正确。", wrong: "不对。看每个选项的对错理由。", copied: "已复制", selected: "已选中，按 Cmd+C",
      sure: "确定", guess: "蒙的", reason: "为什么选这个？检查前写一行。"
    }
  };
  window.LESSON_L2_UI = UI[root.getAttribute("data-l2")] || null;

  let mode = "en";
  try { mode = localStorage.getItem(KEY) || "en"; } catch (e) {}
  root.setAttribute("data-lang", mode);

  function set(m) {
    mode = m;
    root.setAttribute("data-lang", m);
    try { localStorage.setItem(KEY, m); } catch (e) {}
    document.querySelectorAll(".langbar button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.mode === m));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const bar = document.createElement("div");
    bar.className = "langbar noprint";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Language");
    MODES.forEach(([m, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.mode = m;
      b.textContent = label;
      b.onclick = () => set(m);
      bar.append(b);
    });
    document.body.prepend(bar);
    set(mode);
  });
})();
