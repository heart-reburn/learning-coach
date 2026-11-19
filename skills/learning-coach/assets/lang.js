// Optional second-language switch for lesson and drill pages.
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
      correct: "正确。", wrong: "不对。看每个选项的对错理由。", copied: "已复制", selected: "已选中，请复制",
      startover: "重新开始", sure: "确定", guess: "蒙的", reason: "为什么选这个？检查前写一行，至少 10 个字。",
      markright: "正确选项，你选了。", markmissed: "正确选项，你漏选了。", markwrong: "错误选项，你选了。",
      tocheck: "要检查：{list}。", pick1: "选 1 项", pickn: "选 {n} 项",
      marksure: "标记确定或蒙的", writereason: "写理由（至少 10 个字）",
      sample: "例题 {n}（不计分）", selectany: "选出所有正确的选项。", showexp: "看解析",
      partial: "部分正确：{m} 个正确选项你找到了 {k} 个。看每个选项的对错理由。", partialx: "部分正确：{m} 个正确选项你找到了 {k} 个，但多选了 {x} 个错误选项。看每个选项的对错理由。", pickany: "至少选 1 项",
      reasonask: "你的理由对吗？先看解析，再自己标记。", rsright: "理由对", rspartly: "理由部分对", rswrong: "理由错",
      markreason: "标记你的理由后，才能做下一题。", locked: "请先完成上面的题。",
      opened: "你打开了术语定义，这题按蒙的算。", terms: "查看“{term}”的定义", pace: "用时 {t}，目标 {m}",
      redrawask: "凭记忆重画这张图，然后标记完成情况。", redrawfull: "完整重画", redrawpart: "部分重画", redrawnot: "还不会"
    }
  };
  window.LESSON_L2_UI = UI[root.getAttribute("data-l2")] || null;

  const valid = (m) => MODES.some((x) => x[0] === m);
  let mode = "en";
  try { const m = localStorage.getItem(KEY); if (valid(m)) mode = m; } catch (e) {}
  root.setAttribute("data-lang", mode);

  function set(m) {
    if (!valid(m)) m = "en";
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
