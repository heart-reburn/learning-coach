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

  // Day/night theme: white or black background, remembered; first visit follows the system.
  const TKEY = "learning-coach-theme";
  const zh = root.getAttribute("data-l2") === "zh";
  const sysDark = () => window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  let theme = sysDark() ? "dark" : "light";
  try { const s = localStorage.getItem(TKEY); if (s === "light" || s === "dark") theme = s; } catch (e) {}
  root.setAttribute("data-theme", theme);
  function setTheme(v) {
    theme = v;
    root.setAttribute("data-theme", v);
    try { localStorage.setItem(TKEY, v); } catch (e) {}
    document.querySelectorAll(".themebtn").forEach((b) => { b.textContent = v === "dark" ? "\u2600 " + (zh ? "白 / " : "") + "Light" : "\u263E " + (zh ? "黑 / " : "") + "Dark"; });
  }

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
    const tb = document.createElement("button");
    tb.type = "button";
    tb.className = "themebtn";
    tb.onclick = () => setTheme(theme === "dark" ? "light" : "dark");
    bar.append(tb);
    document.body.prepend(bar);
    set(mode);
    setTheme(theme);
  });
})();

// Fits the text of diagram nodes to their boxes for the current language mode. The page stores each node's text as
// pre-broken lines; this joins them, re-wraps to the box width, and sizes the block so both languages fit.
(function () {
  const root = document.documentElement;
  const NS = "http://www.w3.org/2000/svg";
  const ctx = document.createElement("canvas").getContext("2d");
  const FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif';
  const width = (s, px) => { ctx.font = px + "px " + FONT; return ctx.measureText(s).width * 1.04; };

  function wrap(text, px, max, cjk) {
    const lines = [];
    let cur = "";
    const units = cjk ? Array.from(text) : text.split(" ");
    units.forEach((u) => {
      const next = cur ? (cjk ? cur + u : cur + " " + u) : u;
      if (cur && width(next, px) > max) { lines.push(cur); cur = u; } else cur = next;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function layout(w, h, mode, src) {
    const max = w - 20;
    const sizes = mode === "both" ? [11, 10.5, 10, 9.5, 9, 8.5, 8, 7.5] : [13, 12, 11, 10, 9, 8];
    let best = null;
    for (const px of sizes) {
      const enPx = px, l2Px = mode === "both" ? px - 0.5 : px;
      const en = mode === "l2" ? [] : wrap(src.en, enPx, max, false);
      const l2 = mode === "en" ? [] : wrap(src.l2, l2Px, max, true);
      const gap = en.length && l2.length ? 6 : 0;
      const total = en.length * enPx * 1.3 + l2.length * l2Px * 1.4 + gap;
      best = { en, l2, enPx, l2Px, total, gap };
      if (total <= h - 12) break;
    }
    return best;
  }

  function put(node, cls, x, y, lines, px, lh) {
    if (!lines.length) return;
    const t = document.createElementNS(NS, "text");
    t.setAttribute("class", cls + " fit");
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("style", "font-size:" + px + "px;transform:none");
    lines.forEach((ln, i) => {
      const s = document.createElementNS(NS, "tspan");
      s.setAttribute("x", x);
      s.setAttribute("y", (y + (i + 0.8) * lh).toFixed(1));
      s.textContent = ln;
      t.append(s);
    });
    node.parentNode.insertBefore(t, node.nextSibling);
  }

  function placeLabels(mode) {
    document.querySelectorAll("svg text.cl.l2").forEach((l2) => {
      const en = l2.previousElementSibling;
      if (!en || !en.classList.contains("cl")) return;
      if (!l2._x) l2._x = l2.getAttribute("x");
      if (!l2._y) l2._y = l2.getAttribute("y");
      const vb = l2.ownerSVGElement.viewBox.baseVal;
      const ex = +en.getAttribute("x"), ey = +en.getAttribute("y");
      const ew = width(en.textContent, 10) * 1.12, lw = width(l2.textContent, 10);
      if (mode !== "both") { l2.setAttribute("x", ex); l2.setAttribute("y", ey); return; }
      if (ex + ew + 16 + lw <= vb.width - 8) { l2.setAttribute("x", ex + ew + 16); l2.setAttribute("y", ey); }
      else { l2.setAttribute("x", ex); l2.setAttribute("y", ey + 13); }
    });
  }

  // Nudges edge labels off any other text so no two labels or node texts overlap, in every language mode.
  function dodge() {
    const OFFS = [];
    for (let dy = -90; dy <= 90; dy += 6) for (let dx = -60; dx <= 60; dx += 10) OFFS.push([dx, dy]);
    OFFS.sort((p, q) => Math.hypot(p[0], p[1] * 1.5) - Math.hypot(q[0], q[1] * 1.5));
    const eff = (tx) => {
      const b = tx.getBBox(); let dy = 0;
      const m = getComputedStyle(tx).transform.match(/matrix\(([^)]*)\)/);
      if (m) dy = +m[1].split(",")[5] || 0;
      return { x: b.x, y: b.y + dy, w: b.width, h: b.height };
    };
    const hit = (a, b, dx, dy) => a.x + dx < b.x + b.w + 1 && b.x < a.x + dx + a.w + 1 && a.y + dy < b.y + b.h + 1 && b.y < a.y + dy + a.h + 1;
    document.querySelectorAll("svg").forEach((svg) => { try {
      const labs = [...svg.querySelectorAll("text.lab")];
      labs.forEach((l) => {
        if (l._ox === undefined) { l._ox = l.getAttribute("x"); l._oy = l.getAttribute("y"); }
        l.setAttribute("x", l._ox); l.setAttribute("y", l._oy);
      });
      const vis = () => [...svg.querySelectorAll("text")].filter((x) => getComputedStyle(x).display !== "none" && x.textContent.trim());
      const done = new Set();
      labs.forEach((l) => {
        if (done.has(l)) return;
        const twin = labs.find((o) => !done.has(o) && o !== l && o._ox === l._ox && o._oy === l._oy && o.classList.contains("l2") !== l.classList.contains("l2"));
        const same = twin ? [l, twin] : [l];
        same.forEach((g) => done.add(g));
        const group = same.filter((o) => getComputedStyle(o).display !== "none");
        if (!group.length) return;
        const others = vis().filter((x) => !group.includes(x));
        const gb = group.map(eff);
        const u = { x: Math.min(...gb.map((b) => b.x)), y: Math.min(...gb.map((b) => b.y)), w: 0, h: 0 };
        u.w = Math.max(...gb.map((b) => b.x + b.w)) - u.x; u.h = Math.max(...gb.map((b) => b.y + b.h)) - u.y;
        const ob = others.map(eff);
        const nodes = [...svg.querySelectorAll("rect.node")].map((r) => ({ x: +r.getAttribute("x"), y: +r.getAttribute("y"), w: +r.getAttribute("width"), h: +r.getAttribute("height") }));
        const vb = svg.viewBox.baseVal || { width: 1e4, height: 1e4 };
        const inside = (dx, dy) => u.x + dx >= 2 && u.x + u.w + dx <= vb.width - 2 && u.y + dy >= 2 && u.y + u.h + dy <= vb.height - 2;
        const pick = OFFS.find(([dx, dy]) => inside(dx, dy) && !ob.some((b) => hit(u, b, dx, dy)) && !nodes.some((b) => hit(u, b, dx, dy)))
          || OFFS.find(([dx, dy]) => inside(dx, dy) && !ob.some((b) => hit(u, b, dx, dy)));
        if (pick) group.forEach((g) => { g.setAttribute("x", +g._ox + pick[0]); g.setAttribute("y", +g._oy + pick[1]); });
      });
    } catch (e) {} });
  }

  function fit() {
    const mode = root.getAttribute("data-lang") || "en";
    placeLabels(mode);
    document.querySelectorAll("svg rect.node").forEach((rect) => {
      if (!rect._src) {
        const en = [], l2 = [];
        let el = rect.nextElementSibling;
        const old = [];
        while (el && el.tagName === "text" && !/\b(lab|cl|fit)\b/.test(el.getAttribute("class") || "")) {
          (el.classList.contains("l2") ? l2 : en).push(el.textContent);
          old.push(el);
          el = el.nextElementSibling;
        }
        if (!old.length) return;
        old.forEach((o) => o.remove());
        rect._src = { en: en.join(" "), l2: l2.join("") };
      }
      let el = rect.nextElementSibling;
      while (el && el.tagName === "text" && /\bfit\b/.test(el.getAttribute("class") || "")) { const n = el.nextElementSibling; el.remove(); el = n; }
      const x = +rect.getAttribute("x"), y = +rect.getAttribute("y"), w = +rect.getAttribute("width"), h = +rect.getAttribute("height");
      const L = layout(w, h, mode, rect._src);
      const top = y + (h - L.total) / 2;
      put(rect, "l2", x + w / 2, top + L.en.length * L.enPx * 1.3 + L.gap, L.l2, L.l2Px, L.l2Px * 1.4);
      put(rect, "en", x + w / 2, top, L.en, L.enPx, L.enPx * 1.3);
    });
    dodge();
  }

  document.addEventListener("DOMContentLoaded", () => {
    fit();
    new MutationObserver(fit).observe(root, { attributes: true, attributeFilter: ["data-lang"] });
  });
})();
