// Course decks: shows one .slide at a time. Keys: arrows, space, PageUp/PageDown, Home, End; ignored while typing
// in a field or on a quiz option, and space is left to a focused button. The slide number lives in the URL hash.
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  if (!slides.length) return;

  var bar = document.createElement('div');
  bar.className = 'deck-bar';
  bar.innerHTML = '<button type="button" data-step="-1" aria-label="Previous slide">←</button>' +
    '<span class="count"></span><div class="progress"><span></span></div>' +
    '<button type="button" data-step="1" aria-label="Next slide">→</button>';
  document.body.appendChild(bar);
  var count = bar.querySelector('.count');
  var fill = bar.querySelector('.progress span');

  var current = 0;
  function show(i) {
    current = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, k) { s.classList.toggle('active', k === current); });
    count.textContent = (current + 1) + ' / ' + slides.length;
    fill.style.width = ((current + 1) / slides.length * 100) + '%';
    if (location.hash !== '#' + (current + 1)) history.replaceState(null, '', '#' + (current + 1));
    window.scrollTo(0, 0);
  }

  bar.addEventListener('click', function (e) {
    var step = e.target.getAttribute('data-step');
    if (step) show(current + Number(step));
  });
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    if (t === 'BUTTON' && e.key === ' ') return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); show(current + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); show(current - 1); }
    else if (k === 'Home') show(0);
    else if (k === 'End') show(slides.length - 1);
  });
  window.addEventListener('hashchange', function () {
    var n = parseInt(location.hash.slice(1), 10);
    if (n && n - 1 !== current) show(n - 1);
  });

  show((parseInt(location.hash.slice(1), 10) || 1) - 1);
})();
