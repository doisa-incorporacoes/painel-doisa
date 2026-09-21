/* ═══════════════════════════════════════════════════════════════════
   shell.js — Navegação PowerPoint-style, capa-mode, eventos
   F5 · RGI Março/26 · v1.2.2 · 24/04/2026
   ─────────────────────────────────────────────────────────────────
   API pública (window.shell):
     shell.goTo(idx)              — navega para slide pelo índice
     shell.next()                 — próximo slide
     shell.prev()                 — slide anterior
     shell.current                — índice atual (0-based, propriedade)
     shell.total                  — total de slides (propriedade)
     shell.on('slidechange', fn)  — evento: fn(newIdx, prevIdx)
   Frentes:
     - Marcar capa com data-capa="true" na .slide-section
     - Registrar animações via shell.on('slidechange', fn)
     - Cascata automática: .cascade-item dentro do slide re-anima na entrada
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var SHELL_VERSION = '1.2.2';

  var slides      = [];
  var track       = null;
  var currentIdx  = 0;
  var listeners   = {};
  var transitioning = false;

  /* ─── Init ──────────────────────────────────────────────────────── */
  function init() {
    var main = document.querySelector('.main');
    if (!main) return;

    slides = Array.from(main.querySelectorAll('.slide-section'));
    if (!slides.length) return;

    buildTrack(main);
    wireNavItems();
    listenKeys();
    listenButtons();

    updateProgress();
    updateActiveNav();
    applyCapaMode(0);
    reanimate(slides[0]);

    emit('slidechange', 0, -1);
  }

  /* ─── Construir slide-track ──────────────────────────────────────── */
  function buildTrack(main) {
    track = document.createElement('div');
    track.className = 'slide-track';

    var n = slides.length;
    track.style.width = (n * 100) + '%';

    slides.forEach(function (s) {
      track.appendChild(s);
      s.style.width    = (100 / n) + '%';
      s.style.minWidth = (100 / n) + '%';
      s.style.flex     = '0 0 ' + (100 / n) + '%';
    });

    main.appendChild(track);
  }

  /* ─── Navegar para slide ─────────────────────────────────────────── */
  function goTo(idx) {
    idx = Math.max(0, Math.min(slides.length - 1, idx));
    if (idx === currentIdx) return;

    var prev = currentIdx;
    currentIdx = idx;

    transitioning = true;
    track.style.transform = 'translateX(-' + (idx / slides.length * 100) + '%)';

    updateProgress();
    updateActiveNav();
    applyCapaMode(idx);

    setTimeout(function () {
      reanimate(slides[idx]);
      transitioning = false;
    }, 80);

    emit('slidechange', idx, prev);
  }

  function next() { goTo(currentIdx + 1); }
  function prev() { goTo(currentIdx - 1); }

  /* ─── Eventos ─────────────────────────────────────────────────────── */
  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  }

  function emit(event) {
    var args = Array.prototype.slice.call(arguments, 1);
    var fns = listeners[event];
    if (fns) fns.forEach(function (fn) { fn.apply(null, args); });
  }

  /* ─── Re-animar .cascade-item ao entrar no slide ─────────────────── */
  function reanimate(section) {
    if (!section) return;
    section.querySelectorAll('.cascade-item').forEach(function (el) {
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = '';
    });
  }

  /* ─── Progress bar + contador ────────────────────────────────────── */
  function updateProgress() {
    var fill = document.querySelector('.progress-bar__fill');
    if (fill) {
      var pct = slides.length <= 1 ? 100
        : Math.round((currentIdx / (slides.length - 1)) * 100);
      fill.style.width = pct + '%';
    }
    document.querySelectorAll('[data-slide-counter]').forEach(function (el) {
      el.textContent = (currentIdx + 1) + ' / ' + slides.length;
    });
  }

  /* ─── Sidebar nav ─────────────────────────────────────────────────── */
  function wireNavItems() {
    document.querySelectorAll('.sidebar__item[data-slide]').forEach(function (item) {
      item.addEventListener('click', function () {
        var idx = parseInt(item.dataset.slide, 10);
        if (!isNaN(idx)) goTo(idx);
      });
    });
  }

  function updateActiveNav() {
    document.querySelectorAll('.sidebar__item[data-slide]').forEach(function (item) {
      var idx = parseInt(item.dataset.slide, 10);
      item.classList.toggle('active', idx === currentIdx);
    });
  }

  /* ─── Capa-mode ──────────────────────────────────────────────────── */
  function applyCapaMode(idx) {
    var section = slides[idx];
    var isCapa  = section && section.dataset.capa === 'true';
    document.body.classList.toggle('capa-mode', isCapa);
  }

  /* ─── Teclado ─────────────────────────────────────────────────────── */
  function interFileNav(direction) {
    var s = slides[0];
    if (!s) return;
    var file = direction === 'next' ? s.dataset.nextFile : s.dataset.prevFile;
    if (file) window.location.href = file;
  }

  function listenKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          if (slides.length > 1) { next(); } else { interFileNav('next'); }
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          if (slides.length > 1) { prev(); } else { interFileNav('prev'); }
          break;
        case 'Home':
          e.preventDefault(); goTo(0); break;
        case 'End':
          e.preventDefault(); goTo(slides.length - 1); break;
        case 'f':
        case 'F':
          toggleFullscreen(); break;
        case 'Escape':
          if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); break;
      }
    });
  }

  /* ─── Botões footer ──────────────────────────────────────────────── */
  function listenButtons() {
    document.querySelectorAll('[data-action="fullscreen"]').forEach(function (btn) {
      btn.addEventListener('click', toggleFullscreen);
    });

    document.querySelectorAll('[data-action="prev"]').forEach(function (btn) {
      btn.addEventListener('click', prev);
    });

    document.querySelectorAll('[data-action="next"]').forEach(function (btn) {
      btn.addEventListener('click', next);
    });

    document.addEventListener('fullscreenchange', function () {
      document.querySelectorAll('[data-action="fullscreen"]').forEach(function (btn) {
        btn.textContent = document.fullscreenElement ? '⊡' : '⊞';
      });
    });
  }

  /* ─── Fullscreen ──────────────────────────────────────────────────── */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function () {});
    } else {
      document.exitFullscreen().catch(function () {});
    }
  }

  /* ─── Inicialização ──────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ─── API pública ─────────────────────────────────────────────────── */
  var api = {
    goTo:    goTo,
    next:    next,
    prev:    prev,
    on:      on,
    version: SHELL_VERSION,
    get current() { return currentIdx; },
    get total()   { return slides.length; }
  };

  window.shell    = api;
  window.RGIShell = api;

})();
