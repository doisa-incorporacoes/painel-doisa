// relatorio.js — mecânica de acordeão do relatório rgi-agosto.
// Cada .parte abre/fecha independente (não exclusivo: dá pra comparar duas
// partes abertas ao mesmo tempo). Cada .otica dentro de uma parte aberta
// também abre/fecha independente. O índice lateral abre a parte e rola até
// ela, sem perder o lugar de quem já estava lendo outra.
(function () {
  'use strict';

  function abrirParte(parteEl, abrir) {
    var querAbrir = abrir === undefined ? !parteEl.classList.contains('aberta') : abrir;
    parteEl.classList.toggle('aberta', querAbrir);
    var head = parteEl.querySelector('.parte-head');
    if (head) head.setAttribute('aria-expanded', String(querAbrir));
  }

  function abrirOtica(oticaEl, abrir) {
    var querAbrir = abrir === undefined ? !oticaEl.classList.contains('aberta') : abrir;
    oticaEl.classList.toggle('aberta', querAbrir);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // acordeão de parte
    document.querySelectorAll('.parte-head').forEach(function (head) {
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');
      head.setAttribute('aria-expanded', 'false');
      var parte = head.closest('.parte');
      head.addEventListener('click', function () { abrirParte(parte); });
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirParte(parte); }
      });
    });

    // sub-acordeão de ótica
    document.querySelectorAll('.otica-head').forEach(function (head) {
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');
      var otica = head.closest('.otica');
      head.addEventListener('click', function (e) {
        e.stopPropagation();
        abrirOtica(otica);
      });
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); abrirOtica(otica); }
      });
    });

    // índice lateral: clique abre a parte-alvo e rola até ela
    document.querySelectorAll('.nav-sec[data-target]').forEach(function (item) {
      item.addEventListener('click', function () {
        var alvo = document.getElementById(item.getAttribute('data-target'));
        if (!alvo) return;
        abrirParte(alvo, true);
        alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelectorAll('.nav-sec').forEach(function (n) { n.classList.remove('active'); });
        item.classList.add('active');
      });
    });

    // botões globais: abrir tudo / fechar tudo (uso de auditoria, não R13 padrão)
    var btnAbrirTudo = document.getElementById('btnAbrirTudo');
    var btnFecharTudo = document.getElementById('btnFecharTudo');
    if (btnAbrirTudo) {
      btnAbrirTudo.addEventListener('click', function () {
        document.querySelectorAll('.parte').forEach(function (p) { abrirParte(p, true); });
      });
    }
    if (btnFecharTudo) {
      btnFecharTudo.addEventListener('click', function () {
        document.querySelectorAll('.parte').forEach(function (p) { abrirParte(p, false); });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // voltar ao topo
    var backToTop = document.getElementById('backToTop');
    if (backToTop) {
      backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      window.addEventListener('scroll', function () {
        backToTop.classList.toggle('visivel', window.scrollY > 400);
      }, { passive: true });
    }

    // marca d'água herda a logo do cabeçalho (mecânica do padrão AM)
    var mark = document.querySelector('.am-mark');
    var bgMark = document.getElementById('bgMarkImg');
    if (mark && bgMark) bgMark.src = mark.getAttribute('src');
  });
})();
