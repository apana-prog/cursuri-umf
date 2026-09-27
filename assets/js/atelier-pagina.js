/* atelier-pagina.js — comportamentul paginilor: temă, meniu, file (tab-uri), progres,
 * ceasul și harta disciplinei, note de sursă în margine, glosar contextual, coduri de
 * citare, exemple rezolvate pas cu pas, autoevaluare cu grad de certitudine, repetiție
 * spațiată, tabloul de progres, căutare rapidă (Ctrl/⌘ K), prezentare.
 *
 * Totul funcționează și fără stocare locală (fereastră privată): progresul doar nu se mai
 * păstrează. Fără JavaScript, toate panourile rămân vizibile, iar legăturile funcționează. */
(function () {
  'use strict';
  var A = window.Atelier;
  var L = A.limba;
  var el = A.el;
  var TX = {
    verifica: { ro: 'Verifică răspunsul', en: 'Check the answer' },
    din: { ro: 'din', en: 'of' },
    intrebarea: { ro: 'Întrebarea', en: 'Question' },
    corect: { ro: 'Răspuns corect', en: 'Correct answer' },
    gresit: { ro: 'Răspuns incorect', en: 'Incorrect answer' },
    justificare: { ro: 'Justificarea în note:', en: 'Justification in the notes:' },
    cs: { ro: 'un singur răspuns corect', en: 'one correct answer' },
    cm: { ro: 'două până la patru răspunsuri corecte', en: 'two to four correct answers' },
    certitudine: { ro: 'Gradul de certitudine:', en: 'How sure are you?' },
    cert_scazut: { ro: 'scăzut', en: 'not sure' },
    cert_mediu: { ro: 'mediu', en: 'fairly sure' },
    cert_ridicat: { ro: 'ridicat', en: 'very sure' },
    rezultat: { ro: 'Rezultat: {c} din {n} răspunsuri corecte', en: 'Result: {c} of {n} answers correct' },
    rez_tot: { ro: 'Toate răspunsurile sunt corecte. Noțiunile unității sunt consolidate.', en: 'All answers are correct. The unit’s concepts are consolidated.' },
    rez_sigur: { ro: '{k} răspuns(uri) incorect(e) cu certitudine ridicată: acestea semnalează o confuzie, nu o lacună; recitiți paragrafele indicate.',
                 en: '{k} incorrect answer(s) given with high certainty: these signal a misconception, not a gap; re-read the paragraphs indicated.' },
    rez_rest: { ro: 'Recitiți paragrafele indicate la răspunsurile incorecte, apoi reluați autoevaluarea.', en: 'Re-read the paragraphs indicated for the incorrect answers, then try again.' },
    reia: { ro: 'Reia autoevaluarea', en: 'Try again' },
    intoarce: { ro: 'Întoarce fișa', en: 'Flip the card' },
    stiu: { ro: 'Știu', en: 'I know it' },
    repet: { ro: 'Mai repet', en: 'Review again' },
    termen: { ro: 'Termen', en: 'Term' },
    definitie: { ro: 'Definiție', en: 'Definition' },
    indiciu: { ro: 'Formulați definiția, apoi întoarceți fișa', en: 'Recall the definition, then flip the card' },
    fisa: { ro: 'Fișa {i} din {n} · cutia {c} din 5', en: 'Card {i} of {n} · box {c} of 5' },
    gata_cart: { ro: 'Ați parcurs toate fișele din această rundă. Fișele nesigure revin primele data viitoare.', en: 'You have gone through every card in this round. The uncertain ones come back first next time.' },
    runda_noua: { ro: 'Începe o rundă nouă', en: 'Start a new round' },
    vezi_note: { ro: 'Vezi în note', en: 'See in the notes' },
    marcheaza: { ro: 'Marchează ca parcurs', en: 'Mark as completed' },
    marcat: { ro: 'Parcurs', en: 'Completed' },
    parcurs: { ro: 'parcurs', en: 'completed' },
    in_curs: { ro: 'în curs', en: 'in progress' },
    continua: { ro: 'Continuă', en: 'Continue' },
    tipareste: { ro: 'Tipărește situația parcurgerii', en: 'Print the completion record' },
    nume: { ro: 'Numele (apare numai pe documentul tipărit)', en: 'Name (appears only on the printed record)' },
    stocare: { ro: 'Browserul nu permite păstrarea progresului (fereastră privată sau stocare blocată).',
               en: 'This browser does not allow progress to be kept (private window or storage blocked).' },
    copiat: { ro: 'Codul de citare a fost copiat: {c}', en: 'Citation code copied: {c}' },
    sursa: { ro: 'Sursa', en: 'Source' },
    an_ref: { ro: 'anul de referință', en: 'reference year' },
    verificat: { ro: 'verificat la', en: 'checked on' },
    lista_surse: { ro: 'Vezi intrarea completă', en: 'See the full entry' },
    glosar: { ro: 'Glosar', en: 'Glossary' },
    in_glosar: { ro: 'Deschide în glosar', en: 'Open in the glossary' },
    pas_urm: { ro: 'Pasul următor', en: 'Next step' },
    toti_pasii: { ro: 'Toți pașii', en: 'All steps' },
    pasi: { ro: 'Pasul {i} din {n}', en: 'Step {i} of {n}' },
    cauta_ph: { ro: 'Căutați în note, glosar și surse…', en: 'Search the notes, glossary and sources…' },
    cauta_gol: { ro: 'Niciun rezultat pentru această căutare.', en: 'No results for this search.' },
    cauta_start: { ro: 'Introduceți cel puțin două caractere.', en: 'Type at least two characters.' },
    cauta_nav: { ro: '↑ ↓ pentru selecție · Enter pentru deschidere · Esc pentru închidere', en: '↑ ↓ to select · Enter to open · Esc to close' },
    cauta_indisp: { ro: 'Indexul căutării nu este disponibil pe această pagină.', en: 'The search index is not available on this page.' },
    cauta_incarc: { ro: 'Se încarcă indexul căutării…', en: 'Loading the search index…' },
    unitati_parcurse: { ro: '{k} din {n} unități disponibile parcurse', en: '{k} of {n} available units completed' },
    etape: { ro: 'Etape', en: 'Steps' },
    unitatea: { ro: 'Unitatea', en: 'Unit' },
    autoeval: { ro: 'Autoevaluare', en: 'Self-assessment' },
    nicio_unitate: { ro: 'Nicio unitate publicată încă în acest modul.', en: 'No unit published in this module yet.' },
    ceas_parcurs: { ro: 'parcurs', en: 'completed' },
    modul: { ro: 'Modulul', en: 'Module' },
    pregatire: { ro: 'Pregătire', en: 'Before class' },
    note: { ro: 'Note', en: 'Notes' },
    recapitulare: { ro: 'Recapitulare', en: 'Review' }
  };
  function tx(k, v) {
    var s = A.t(TX[k]);
    if (v) s = s.replace(/\{([a-z]+)\}/g, function (m, c) { return v[c] != null ? String(v[c]) : m; });
    return s;
  }
  function toate(sel, rad) { return Array.prototype.slice.call((rad || document).querySelectorAll(sel)); }
  var body = document.body;
  var DISC = body.getAttribute('data-disc') || '';
  var stocareOk = A.stocare.set('test', 1);
  var PARTI = ['pregatire', 'note', 'consolidare'];

  function fara(s) {
    var x = String(s == null ? '' : s);
    return (x.normalize ? x.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : x).toLowerCase();
  }
  function toast(text) {
    var t = el('div', { 'class': 'toast', role: 'status', text: text });
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  }

  /* ---------------------------------------------------------------- tema */
  toate('[data-tema]').forEach(function (b) {
    b.addEventListener('click', function () {
      var r = document.documentElement;
      var curent = r.getAttribute('data-theme') ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var nou = curent === 'dark' ? 'light' : 'dark';
      r.setAttribute('data-theme', nou);
      A.stocare.set('tema', nou);
    });
  });

  /* ---------------------------------------------------------------- meniul pe ecrane înguste */
  var bMeniu = document.querySelector('[data-meniu]');
  var nav = document.getElementById('nav-principal');
  if (bMeniu && nav) {
    bMeniu.addEventListener('click', function () {
      var d = !nav.classList.contains('deschis');
      nav.classList.toggle('deschis', d);
      bMeniu.setAttribute('aria-expanded', d ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('deschis')) { nav.classList.remove('deschis'); bMeniu.setAttribute('aria-expanded', 'false'); bMeniu.focus(); }
    });
  }

  /* ---------------------------------------------------------------- progres (stocare) */
  function parteGata(cod, k) { return !!A.stocare.get('progres:' + DISC + ':' + cod + ':' + k, false); }
  function partiGata(disc, cod) {
    return PARTI.filter(function (k) { return !!A.stocare.get('progres:' + disc + ':' + cod + ':' + k, false); }).length;
  }

  /* ---------------------------------------------------------------- file (tab-uri) */
  var lista = document.querySelector('[role="tablist"]');
  var butoaneFile = [], panouri = [];
  function arataFila(i, focus, faraAdresa) {
    butoaneFile.forEach(function (b, j) {
      b.setAttribute('aria-selected', i === j ? 'true' : 'false');
      b.tabIndex = i === j ? 0 : -1;
      if (panouri[j]) panouri[j].hidden = i !== j;
    });
    if (focus) butoaneFile[i].focus();
    if (!faraAdresa) { try { history.replaceState(null, '', '#fila-' + butoaneFile[i].getAttribute('data-fila')); } catch (e) { /* file:// */ } }
    setTimeout(function () { toate('.lectura', panouri[i]).forEach(noteMargine); actualizeazaBara(); }, 30);
  }
  function indexFila(k) { return butoaneFile.map(function (b) { return b.getAttribute('data-fila'); }).indexOf(k); }
  function laAncora(id, cuDerulare) {
    if (!id) return;
    if (/^fila-/.test(id)) {
      var i = indexFila(id.slice(5));
      if (i >= 0) { arataFila(i); window.scrollTo(0, 0); }
      return;
    }
    var t = document.getElementById(id);
    if (!t) return;
    var p = t.closest ? t.closest('[role="tabpanel"]') : null;
    if (p && p.hidden) {
      arataFila(panouri.indexOf(p));
      try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// */ }
    }
    if (cuDerulare !== false) {
      setTimeout(function () {
        try { t.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (e) { t.scrollIntoView(true); }
        if (t.classList && t.classList.contains('bloc')) { t.classList.add('tinta'); setTimeout(function () { t.classList.remove('tinta'); }, 2400); }
      }, 60);
    }
  }
  if (lista) {
    butoaneFile = toate('[role="tab"]', lista);
    panouri = butoaneFile.map(function (b) { return document.getElementById(b.getAttribute('aria-controls')); });
    butoaneFile.forEach(function (b, i) {
      b.addEventListener('click', function () { arataFila(i); window.scrollTo({ top: 0 }); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); arataFila((i + 1) % butoaneFile.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); arataFila((i - 1 + butoaneFile.length) % butoaneFile.length, true); }
      });
    });
    var h = location.hash.slice(1);
    var start = 0;
    if (h && !/^fila-/.test(h)) {
      var tinta = document.getElementById(h);
      var pn = tinta && tinta.closest ? tinta.closest('[role="tabpanel"]') : null;
      if (pn) start = Math.max(0, panouri.indexOf(pn));
    } else if (/^fila-/.test(h)) start = Math.max(0, indexFila(h.slice(5)));
    arataFila(start, false, !/^fila-/.test(h));
    if (h && !/^fila-/.test(h)) {
      laAncora(h);
      /* instrumentele și fonturile se încarcă după primul salt și împing ținta în jos:
         saltul se reface la încărcare, dacă cititorul nu a derulat între timp */
      var aDerulat = false;
      ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
        window.addEventListener(ev, function () { aDerulat = true; }, { once: true, passive: true });
      });
      var refa = function () { if (!aDerulat && location.hash.slice(1) === h) laAncora(h); };
      window.addEventListener('load', function () { setTimeout(refa, 50); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(refa, 80); });
    }
    else if (/^fila-/.test(h)) {
      /* browserul derulează singur la panoul cu acest ID; pagina se deschide totuși de sus */
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      setTimeout(function () { window.scrollTo(0, 0); }, 0);
    }
    window.addEventListener('hashchange', function () { laAncora(location.hash.slice(1)); });
    toate('[data-deschide]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var i = indexFila(a.getAttribute('data-deschide'));
        if (i >= 0) { arataFila(i, true); window.scrollTo({ top: 0 }); }
      });
    });
  }

  /* marcajele „parcurs” (butoane comutatoare) și bifele din file */
  function actualizeazaBife() {
    butoaneFile.forEach(function (b) {
      var p = document.querySelector('.buton-parcurs[data-progres$=":' + b.getAttribute('data-fila') + '"]');
      var gata = p && A.stocare.get('progres:' + p.getAttribute('data-progres'), false);
      b.classList.toggle('parcurs', !!gata);
    });
  }
  toate('.buton-parcurs[data-progres]').forEach(function (b) {
    var k = 'progres:' + b.getAttribute('data-progres');
    var et = b.querySelector('.et');
    function seteaza(v) {
      b.setAttribute('aria-pressed', v ? 'true' : 'false');
      if (et) et.textContent = v ? tx('marcat') : tx('marcheaza');
    }
    seteaza(!!A.stocare.get(k, false));
    b.addEventListener('click', function () {
      var v = b.getAttribute('aria-pressed') !== 'true';
      A.stocare.set(k, v);
      seteaza(v);
      actualizeazaBife();
      A.anunta(v ? tx('marcat') : tx('marcheaza'));
    });
    if (!stocareOk) b.parentNode.appendChild(el('span', { 'class': 'nota-ss', text: tx('stocare') }));
  });
  actualizeazaBife();

  /* ultima unitate vizitată: butonul „Continuă” din pagina disciplinei */
  var du = document.getElementById('date-unitate');
  if (du && DISC) { try { A.stocare.set('ultima:' + DISC, JSON.parse(du.textContent)); } catch (e) { /* ignorat */ } }
  toate('[data-continua]').forEach(function (a) {
    var u = A.stocare.get('ultima:' + DISC, null);
    if (!u || !u.cod) return;
    a.setAttribute('href', u.cod + '.html');
    var t = a.firstChild;
    if (t && t.nodeType === 3) t.nodeValue = tx('continua') + ': ' + (L === 'ro' ? u.nume.toLowerCase() : u.nume) + ' ';
  });

  /* stările din harta disciplinei */
  toate('[data-stare]').forEach(function (s) {
    var p = s.getAttribute('data-stare').split(':');
    var n = partiGata(p[0], p[1]);
    s.className = 'stare-parcurs' + (n === 3 ? ' gata' : (n > 0 ? ' partial' : ''));
    s.textContent = n === 3 ? tx('parcurs') : (n > 0 ? tx('in_curs') : '');
  });
  toate('[data-modul-progres]').forEach(function (m) {
    var disc = m.getAttribute('data-modul-progres');
    var un = (m.getAttribute('data-unitati') || '').split(',').filter(Boolean);
    var tot = parseInt(m.getAttribute('data-total'), 10) || un.length || 1;
    var k = un.filter(function (c) { return partiGata(disc, c) === 3; }).length;
    var bara = m.querySelector('.pista span');
    if (bara) bara.style.width = Math.round(100 * k / tot) + '%';
    var txt = m.querySelector('.txt');
    if (txt) txt.textContent = k + ' / ' + tot;
  });

  /* ceasul disciplinei */
  toate('[data-ceas]').forEach(function (c) {
    var info = c.querySelector('[data-ceas-info]');
    var implicit = info ? info.textContent : '';
    var segs = toate('.seg', c);
    var gata = 0;
    segs.forEach(function (s) {
      var st = s.getAttribute('data-stare-seg');
      if (st) {
        var p = st.split(':');
        if (partiGata(p[0], p[1]) === 3) { s.classList.remove('disponibil'); s.classList.add('parcurs'); gata++; }
      }
      function arata() { if (info) info.textContent = s.getAttribute('data-info') || implicit; }
      function ascunde() { if (info) info.textContent = implicit; }
      s.addEventListener('mouseenter', arata);
      s.addEventListener('mouseleave', ascunde);
      var a = s.parentNode && s.parentNode.tagName && s.parentNode.tagName.toLowerCase() === 'a' ? s.parentNode : null;
      if (a) { a.addEventListener('focus', arata); a.addEventListener('blur', ascunde); }
    });
    if (gata > 0) {
      var cifra = c.querySelector('[data-ceas-cifra]'), text = c.querySelector('[data-ceas-text]');
      if (cifra) cifra.textContent = Math.round(100 * gata / segs.length) + '%';
      if (text) text.textContent = tx('ceas_parcurs');
    }
  });

  /* ---------------------------------------------------------------- bara de lectură */
  var bara = document.querySelector('.bara-lectura span');
  function actualizeazaBara() {
    if (!bara || !body.classList.contains('pagina-unitate')) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bara.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0) + ')';
  }
  window.addEventListener('scroll', actualizeazaBara, { passive: true });
  actualizeazaBara();

  /* ---------------------------------------------------------------- cuprinsul: secțiunea curentă */
  toate('.cuprins-lateral').forEach(function (cup) {
    var legaturi = toate('a[href^="#"]', cup);
    var tinte = legaturi.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    if (!tinte.length) return;
    var programat = false;
    function actualizeaza() {
      programat = false;
      if (!cup.offsetParent) return;
      // o secțiune e „curentă” când titlul ei a trecut de locul în care îl aduce un salt la ancoră
      // (scroll-margin-top), nu de un prag fix: altfel, după un clic în cuprins, rămâne marcată cea precedentă
      // locul de sosire = scroll-padding-top al paginii + scroll-margin-top al titlului (se adună)
      var activ = null, sp = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      tinte.forEach(function (t) {
        if (!t) return;
        var marja = parseFloat(getComputedStyle(t).scrollMarginTop) || 0;
        if (t.getBoundingClientRect().top < sp + marja + 24) activ = t;
      });
      // la capătul paginii, ultima secțiune nu mai poate urca până sus: devine curentă
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) activ = tinte[tinte.length - 1] || activ;
      if (!activ) activ = tinte[0];
      legaturi.forEach(function (a, i) { a.classList.toggle('activ', tinte[i] === activ); });
    }
    window.addEventListener('scroll', function () {
      if (!programat) { programat = true; (window.requestAnimationFrame || setTimeout)(actualizeaza); }
    }, { passive: true });
    actualizeaza();
  });

  /* ---------------------------------------------------------------- popover comun */
  var pop = null, popPentru = null;
  function inchidePopover() {
    if (pop && pop.parentNode) pop.parentNode.removeChild(pop);
    pop = null; popPentru = null;
  }
  function deschidePopover(tinta, continut) {
    inchidePopover();
    pop = el('div', { 'class': 'popover-atelier', role: 'dialog' });
    continut.forEach(function (c) { pop.appendChild(c); });
    document.body.appendChild(pop);
    popPentru = tinta;
    var r = tinta.getBoundingClientRect();
    var w = pop.offsetWidth, hh = pop.offsetHeight;
    var x = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), document.documentElement.clientWidth - w - 12);
    var y = r.bottom + 10;
    if (y + hh > window.innerHeight - 8 && r.top - hh - 10 > 8) y = r.top - hh - 10;
    pop.style.left = (x + window.scrollX) + 'px';
    pop.style.top = (y + window.scrollY) + 'px';
  }
  document.addEventListener('click', function (e) {
    if (pop && !pop.contains(e.target) && e.target !== popPentru && !(popPentru && popPentru.contains(e.target))) inchidePopover();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') inchidePopover(); });
  window.addEventListener('resize', inchidePopover);

  /* ---------------------------------------------------------------- surse: popover și note în margine */
  function dateSursa(id) {
    var li = document.getElementById('sursa-' + id);
    if (!li) return null;
    var cit = li.querySelector('.cit');
    return { li: li, scurt: li.getAttribute('data-scurt') || '', an: li.getAttribute('data-an') || '',
             verif: li.getAttribute('data-verif') || '', marcaj: li.getAttribute('data-marcaj') || '',
             cit: cit ? cit.textContent : '' };
  }
  toate('sup.af a[data-af]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var s = dateSursa(a.getAttribute('data-af'));
      if (!s) return;
      e.preventDefault();
      var det = [];
      if (s.an) det.push(tx('an_ref') + ' ' + s.an);
      if (s.marcaj) det.push(s.marcaj);          // marcajul emitentului (estimat, provizoriu…) stă lângă cifră
      if (s.verif) det.push(tx('verificat') + ' ' + s.verif);
      var leg = el('a', { href: '#sursa-' + a.getAttribute('data-af'), text: tx('lista_surse') + ' →' });
      leg.addEventListener('click', function () { inchidePopover(); });
      deschidePopover(a, [el('div', { 'class': 'pop-tip', text: tx('sursa') + ' ' + a.textContent }),
        el('div', { 'class': 'pop-titlu', text: s.scurt }), el('div', { text: s.cit }),
        el('div', { 'class': 'pop-det', text: det.join(' · ') }), el('p', { style: 'margin:.5rem 0 0' }, leg)]);
    });
  });
  function noteMargine(lectura) {
    var margine = lectura.querySelector('.margine');
    var text = lectura.querySelector('.text-note');
    if (!margine || !text) return;
    margine.textContent = '';
    if (!margine.offsetParent || window.getComputedStyle(margine).display === 'none') return;
    var baza = margine.getBoundingClientRect().top;
    var ultim = -Infinity, vazute = {};
    toate('sup.af a[data-af]', text).forEach(function (a) {
      var id = a.getAttribute('data-af');
      if (vazute[id] || !a.offsetParent) return;
      var s = dateSursa(id);
      if (!s) return;
      vazute[id] = true;
      var top = Math.max(a.getBoundingClientRect().top - baza - 6, ultim + 10);
      var n = el('a', { 'class': 'nota-marg', href: '#sursa-' + id, 'data-af': id, style: 'top:' + Math.round(top) + 'px;text-decoration:none' },
        el('span', { 'class': 'nr', text: a.textContent }), el('strong', { text: s.scurt }),
        el('span', { 'class': 'det', text: [s.an ? tx('an_ref') + ' ' + s.an : '', s.marcaj, s.verif ? tx('verificat') + ' ' + s.verif : ''].filter(Boolean).join(' · ') }));
      margine.appendChild(n);
      ultim = top + n.offsetHeight;
      function aprinde(v) {
        n.classList.toggle('activ', v);
        toate('sup.af a[data-af="' + id + '"]', text).forEach(function (x) { x.classList.toggle('activ', v); });
      }
      n.addEventListener('mouseenter', function () { aprinde(true); });
      n.addEventListener('mouseleave', function () { aprinde(false); });
      a.addEventListener('mouseenter', function () { aprinde(true); });
      a.addEventListener('mouseleave', function () { aprinde(false); });
    });
  }
  var tmMargine = null;
  function refaMarginile() {
    clearTimeout(tmMargine);
    tmMargine = setTimeout(function () { toate('.lectura').forEach(function (l) { if (l.offsetParent) noteMargine(l); }); }, 120);
  }
  window.addEventListener('resize', refaMarginile);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refaMarginile);
  window.addEventListener('load', refaMarginile);

  /* ---------------------------------------------------------------- glosar contextual */
  var dg = document.getElementById('date-glosar');
  if (dg) {
    var termeni = [];
    try { termeni = JSON.parse(dg.textContent); } catch (e) { termeni = []; }
    termeni.sort(function (a, b) { return b.t.length - a.t.length; });
    toate('.text-note').forEach(function (rad) {
      termeni.forEach(function (tr, ti) {
        var esc = tr.t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var re;
        try { re = new RegExp('(^|[^\\p{L}])(' + esc + ')(?![\\p{L}])', 'iu'); } catch (e) { re = new RegExp('(^|\\s)(' + esc + ')(?=\\s|[.,;:!?)]|$)', 'i'); }
        var mers = document.createTreeWalker(rad, NodeFilter.SHOW_TEXT, {
          acceptNode: function (n) {
            var p = n.parentNode;
            while (p && p !== rad) {
              if (/^(A|SUP|H2|H3|H4|BUTTON|SCRIPT|SUMMARY|LABEL)$/.test(p.nodeName) || (p.classList && (p.classList.contains('caseta-definitie') || p.classList.contains('caseta-retine') ||
                  p.classList.contains('termen-glosar') || p.classList.contains('widget') || p.classList.contains('quiz') || p.classList.contains('mate')))) return NodeFilter.FILTER_REJECT;
              p = p.parentNode;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        var n;
        while ((n = mers.nextNode())) {
          var m = re.exec(n.nodeValue);
          if (!m) continue;
          var inceput = m.index + m[1].length;
          var dupa = n.splitText(inceput);
          dupa.splitText(m[2].length);
          var span = el('span', { 'class': 'termen-glosar', tabindex: '0', role: 'button', 'data-t': String(ti), text: dupa.nodeValue });
          dupa.parentNode.replaceChild(span, dupa);
          break;
        }
      });
      toate('.termen-glosar', rad).forEach(function (s) {
        function deschide() {
          var tr = termeni[parseInt(s.getAttribute('data-t'), 10)];
          if (!tr) return;
          deschidePopover(s, [el('div', { 'class': 'pop-tip', text: tx('glosar') }), el('div', { 'class': 'pop-titlu', text: tr.t }),
            el('div', { text: tr.d }), el('p', { style: 'margin:.5rem 0 0' }, el('a', { href: tr.u, text: tx('in_glosar') + ' →' }))]);
        }
        s.addEventListener('click', deschide);
        s.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); deschide(); } });
      });
    });
  }

  /* ---------------------------------------------------------------- coduri de citare */
  function copiaza(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, nu) {
      var ta = el('textarea', { style: 'position:fixed;opacity:0' });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { nu(e); }
      document.body.removeChild(ta);
    });
  }
  toate('a.ancora[data-cit]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var cod = a.getAttribute('data-cit');
      var id = a.getAttribute('href').slice(1);
      var url = location.href.split('#')[0] + '#' + id;
      try { history.replaceState(null, '', '#' + id); } catch (er) { /* file:// */ }
      var p = a.parentNode;
      if (p && p.classList) { p.classList.add('tinta'); setTimeout(function () { p.classList.remove('tinta'); }, 1800); }
      copiaza(cod + ' — ' + url).then(function () { toast(tx('copiat', { c: cod })); }, function () { toast(cod); });
    });
  });

  /* ---------------------------------------------------------------- exemple rezolvate: pași pe rând */
  toate('ol[data-pasi]').forEach(function (ol) {
    var pasi = toate(':scope > li', ol);
    if (pasi.length < 2) return;
    var arat = 1;
    pasi.forEach(function (p, i) { if (i >= arat) p.classList.add('ascuns'); });
    var info = el('span', { 'class': 'nota-ss', 'aria-live': 'polite' });
    var bUrm = el('button', { type: 'button', 'class': 'buton buton-mic', text: tx('pas_urm') + ' →' });
    var bTot = el('button', { type: 'button', 'class': 'buton-contur buton-mic', text: tx('toti_pasii') });
    var bara = el('div', { 'class': 'pasi-control' }, bUrm, bTot, info);
    ol.parentNode.insertBefore(bara, ol.nextSibling);
    function actualizeaza() {
      info.textContent = tx('pasi', { i: arat, n: pasi.length });
      if (arat >= pasi.length) bara.parentNode && bara.parentNode.removeChild(bara);
    }
    bUrm.addEventListener('click', function () {
      if (arat < pasi.length) { pasi[arat].classList.remove('ascuns'); pasi[arat].classList.add('nou'); arat++; }
      actualizeaza();
      refaMarginile();
    });
    bTot.addEventListener('click', function () {
      pasi.forEach(function (p) { p.classList.remove('ascuns'); });
      arat = pasi.length;
      actualizeaza();
      refaMarginile();
    });
    actualizeaza();
  });

  /* ---------------------------------------------------------------- autoevaluare */
  function amesteca(v, samanta) {
    var a = v.slice(), s = samanta || 1;
    for (var i = a.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      var j = Math.floor(s / 233280 * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function monteazaQuiz(q) {
    var date = JSON.parse(q.querySelector('script').textContent);
    var idq = q.getAttribute('data-quiz');
    var cheie = 'quiz:' + idq;
    var st = { raspunse: 0, corecte: 0, sigurGresit: 0 };
    toate('.item-quiz, .quiz-rezumat', q).forEach(function (x) { x.parentNode.removeChild(x); });
    var rez = el('div', { 'class': 'quiz-rezumat', hidden: '' });
    date.forEach(function (it, n) {
      var bloc = el('div', { 'class': 'item-quiz' });
      bloc.appendChild(el('div', { 'class': 'quiz-antet' },
        el('span', { 'class': 'quiz-nr', text: tx('intrebarea') + ' ' + (n + 1) + ' ' + tx('din') + ' ' + date.length }),
        el('span', { 'class': 'tip-item', text: tx(it.tip === 'CM' ? 'cm' : 'cs') })));
      var fs = el('fieldset', null, el('legend', { 'class': 'enunt', text: it.enunt }));
      var litere = amesteca(Object.keys(it.variante).sort(), n + 7);
      var intrari = {};
      litere.forEach(function (lit, j) {
        var id = idq + '-' + it.id + '-' + lit;
        var inp = el('input', { type: it.tip === 'CM' ? 'checkbox' : 'radio', name: idq + '-' + it.id, id: id, value: lit });
        intrari[lit] = inp;
        var wrap = el('div', { 'data-lit': lit },
          el('label', { 'class': 'varianta', 'for': id }, inp, el('span', { 'class': 'litera', text: 'ABCDEFGH'.charAt(j) }), el('span', { 'class': 'text-var', text: it.variante[lit] })));
        fs.appendChild(wrap);
      });
      bloc.appendChild(fs);
      var cert = null;
      var grup = el('div', { 'class': 'certitudine', role: 'group', 'aria-label': tx('certitudine') }, el('span', { text: tx('certitudine') }));
      var bCert = ['scazut', 'mediu', 'ridicat'].map(function (k) {
        var b = el('button', { type: 'button', 'aria-pressed': 'false', text: tx('cert_' + k) });
        b.addEventListener('click', function () { cert = k; bCert.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); });
        grup.appendChild(b);
        return b;
      });
      bloc.appendChild(grup);
      var act = el('div', { 'class': 'quiz-actiuni' });
      var buton = el('button', { type: 'button', 'class': 'buton verifica', text: tx('verifica'), disabled: '' });
      fs.addEventListener('change', function () {
        if (litere.some(function (l) { return intrari[l].checked; })) buton.removeAttribute('disabled');
        else buton.setAttribute('disabled', '');
      });
      buton.addEventListener('click', function () {
        var alese = litere.filter(function (l) { return intrari[l].checked; });
        if (!alese.length) return;
        var ok = alese.length === it.corecte.length && alese.every(function (l) { return it.corecte.indexOf(l) >= 0; });
        litere.forEach(function (l) {
          var wrap = fs.querySelector('[data-lit="' + l + '"]');
          var rand = wrap.querySelector('.varianta');
          var e = it.corecte.indexOf(l) >= 0;
          rand.className = 'varianta blocat ' + (e ? 'corect' : (intrari[l].checked ? 'gresit' : ''));
          intrari[l].disabled = true;
          var expl = (it.explicatie && it.explicatie[l]) || '';
          var bl = (it.blocuri && it.blocuri[l]) || [];
          if (expl || bl.length) {
            var p = el('p', { 'class': 'explicatie', text: expl + ' ' });
            if (bl.length) {
              p.appendChild(document.createTextNode(tx('justificare') + ' '));
              bl.forEach(function (b, k) {
                if (k) p.appendChild(document.createTextNode(', '));
                p.appendChild(el('a', { href: '#' + b, text: '§ ' + b }));
              });
            }
            wrap.appendChild(p);
          }
        });
        buton.setAttribute('disabled', '');
        bCert.forEach(function (b) { b.disabled = true; });
        st.raspunse++;
        if (ok) st.corecte++;
        else if (cert === 'ridicat') st.sigurGresit++;
        act.appendChild(el('span', { 'class': 'verdict ' + (ok ? 'bun' : 'rau'), text: (ok ? '✓ ' : '✕ ') + tx(ok ? 'corect' : 'gresit') }));
        A.anunta(tx(ok ? 'corect' : 'gresit'));
        if (st.raspunse === date.length) finalizeaza();
      });
      act.appendChild(buton);
      bloc.appendChild(act);
      q.appendChild(bloc);
    });
    q.appendChild(rez);
    function finalizeaza() {
      var p = Math.round(100 * st.corecte / date.length);
      rez.textContent = '';
      var inel = el('div', { 'class': 'inel-scor', style: '--p:' + p }, el('span', { text: p + '%' }));
      var txt = el('div', null, el('h3', { text: tx('rezultat', { c: st.corecte, n: date.length }) }),
        el('p', { text: st.corecte === date.length ? tx('rez_tot') : (st.sigurGresit ? tx('rez_sigur', { k: st.sigurGresit }) : tx('rez_rest')) }));
      var reia = el('button', { type: 'button', 'class': 'buton-contur buton-mic', text: tx('reia'), style: 'margin-top:.7rem' });
      reia.addEventListener('click', function () { monteazaQuiz(q); });
      txt.appendChild(reia);
      rez.appendChild(inel); rez.appendChild(txt);
      rez.hidden = false;
      var vechi = A.stocare.get(cheie, null);
      var nou = { corecte: st.corecte, total: date.length, sigurGresit: st.sigurGresit, data: new Date().toISOString().slice(0, 10) };
      var vc = vechi && typeof vechi === 'object' ? vechi.corecte : (typeof vechi === 'number' ? vechi : -1);
      if (nou.corecte >= vc) A.stocare.set(cheie, nou);
    }
  }
  toate('.quiz[data-quiz]').forEach(monteazaQuiz);

  /* ---------------------------------------------------------------- repetiție spațiată (cinci cutii Leitner) */
  toate('[data-cartonase]').forEach(function (c) {
    var date = JSON.parse(c.querySelector('script').textContent);
    if (!date.length) return;
    var cheie = 'cartonase:' + c.getAttribute('data-cartonase');
    var cutii = A.stocare.get(cheie, {});
    var coada, poz, intors = false;
    function ordoneaza() {
      coada = date.map(function (_, i) { return i; }).sort(function (a, b) { return (cutii[a] || 1) - (cutii[b] || 1); });
      poz = 0;
    }
    ordoneaza();
    var vizCutii = el('div', { 'class': 'cutii-leitner', 'aria-hidden': 'true' });
    var coloane = [1, 2, 3, 4, 5].map(function (k) {
      var i = el('i');
      var col = el('div', { 'class': 'cutie' }, i, el('span', { text: String(k) }));
      vizCutii.appendChild(col);
      return { col: col, i: i };
    });
    var scena = el('div', { 'class': 'scena-cartonas' });
    var card = el('div', { 'class': 'cartonas', tabindex: '0', role: 'button', 'aria-label': tx('intoarce') });
    var fata = el('div', { 'class': 'fata-c' }), verso = el('div', { 'class': 'verso-c' });
    card.appendChild(fata); card.appendChild(verso); scena.appendChild(card);
    var bRepet = el('button', { type: 'button', 'class': 'buton-contur', text: tx('repet') });
    var bStiu = el('button', { type: 'button', 'class': 'buton', text: tx('stiu') });
    var bara = el('div', { 'class': 'bara' }, el('button', { type: 'button', 'class': 'buton-contur', text: tx('intoarce'), onclick: intoarce }), bRepet, bStiu);
    var info = el('p', { 'class': 'info-c', 'aria-live': 'polite' });
    c.appendChild(vizCutii); c.appendChild(scena); c.appendChild(bara); c.appendChild(info);
    function deseneazaCutii() {
      var nr = [0, 0, 0, 0, 0];
      date.forEach(function (_, i) { nr[(cutii[i] || 1) - 1]++; });
      coloane.forEach(function (x, k) { x.i.style.height = (6 + 34 * nr[k] / date.length) + 'px'; x.col.classList.toggle('are', nr[k] > 0); });
    }
    function deseneaza() {
      fata.textContent = ''; verso.textContent = '';
      card.classList.toggle('intors', intors);
      deseneazaCutii();
      if (poz >= coada.length) {
        card.classList.remove('intors');
        fata.appendChild(el('p', { 'class': 'gata-c', text: tx('gata_cart') }));
        var bNou = el('button', { type: 'button', 'class': 'buton buton-mic', text: tx('runda_noua') });
        bNou.addEventListener('click', function (e) { e.stopPropagation(); ordoneaza(); intors = false; deseneaza(); });
        fata.appendChild(bNou);
        info.textContent = '';
        bara.hidden = true;
        return;
      }
      bara.hidden = false;
      var d = date[coada[poz]];
      fata.appendChild(el('span', { 'class': 'et-c', text: tx('termen') }));
      fata.appendChild(el('span', { 'class': 'termen-c', text: d.fata }));
      fata.appendChild(el('span', { 'class': 'indiciu', text: tx('indiciu') }));
      verso.appendChild(el('span', { 'class': 'et-c', text: tx('definitie') }));
      verso.appendChild(el('span', { 'class': 'text-c', text: d.verso }));
      if (d.bloc) verso.appendChild(el('a', { href: '#' + d.bloc, text: tx('vezi_note') + ' (§ ' + d.bloc + ')' }));
      info.textContent = tx('fisa', { i: poz + 1, n: coada.length, c: cutii[coada[poz]] || 1 });
    }
    function intoarce() { if (poz < coada.length) { intors = !intors; deseneaza(); } }
    function noteaza(stie) {
      if (poz >= coada.length) return;
      var i = coada[poz];
      cutii[i] = stie ? Math.min(5, (cutii[i] || 1) + 1) : 1;
      A.stocare.set(cheie, cutii);
      poz++; intors = false; deseneaza();
    }
    card.addEventListener('click', function (e) { if (e.target.tagName !== 'A' && e.target.tagName !== 'BUTTON') intoarce(); });
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); intoarce(); } });
    bRepet.addEventListener('click', function () { noteaza(false); });
    bStiu.addEventListener('click', function () { noteaza(true); });
    deseneaza();
  });

  /* ---------------------------------------------------------------- tabloul de progres */
  toate('[data-progres-pagina]').forEach(function (p) {
    var d = JSON.parse(p.querySelector('script').textContent);
    var disp = [], gata = 0;
    d.module.forEach(function (m) { m.unitati.forEach(function (u) { disp.push(u); if (partiGata(d.disc, u.cod) === 3) gata++; }); });
    var proc = disp.length ? Math.round(100 * gata / disp.length) : 0;
    var tablou = el('div', { 'class': 'tablou' });
    var total = el('div', { 'class': 'card-simplu tablou-total' },
      el('div', { 'class': 'inel-scor', style: '--p:' + proc }, el('span', { text: proc + '%' })),
      el('p', { text: tx('unitati_parcurse', { k: gata, n: disp.length }) }));
    var dreapta = el('div', null);
    d.module.forEach(function (m) {
      var card = el('section', { 'class': 'card-simplu ' + m.clasa, style: 'margin-bottom:1rem' });
      card.appendChild(el('h3', null, el('span', { 'class': 'punct-modul', style: 'display:inline-block;margin-right:.5rem' }), tx('modul') + ' ' + m.nr + ' · ' + m.titlu));
      if (!m.unitati.length) { card.appendChild(el('p', { 'class': 'nota-ss', text: tx('nicio_unitate') })); dreapta.appendChild(card); return; }
      var tabel = el('table', { 'class': 'tabel-progres' });
      tabel.appendChild(el('thead', null, el('tr', null, el('th', { text: tx('unitatea') }), el('th', { text: tx('etape') }), el('th', { text: tx('autoeval') }))));
      var corp = el('tbody');
      m.unitati.forEach(function (u) {
        var puncte = el('span', { 'class': 'puncte' });
        PARTI.forEach(function (k, i) {
          puncte.appendChild(el('span', { 'class': 'punct' + (A.stocare.get('progres:' + d.disc + ':' + u.cod + ':' + k, false) ? ' da' : ''),
            title: [tx('pregatire'), tx('note'), tx('recapitulare')][i] }));
        });
        var q = A.stocare.get('quiz:' + u.cod, null);
        var qt = q && typeof q === 'object' ? q.corecte + ' / ' + q.total : (typeof q === 'number' ? String(q) : '—');
        corp.appendChild(el('tr', null, el('td', null, el('a', { href: u.cod + '.html', text: u.nume + ' · ' + u.titlu })), el('td', null, puncte), el('td', { text: qt })));
      });
      tabel.appendChild(corp);
      card.appendChild(el('div', { 'class': 'tabel-derulant' }, tabel));
      dreapta.appendChild(card);
    });
    tablou.appendChild(total); tablou.appendChild(dreapta);
    p.appendChild(tablou);
    var nume = el('input', { type: 'text', id: 'nume-dovada', autocomplete: 'name', 'class': 'camp-nume' });
    var titluDoc = el('p', { 'class': 'scor' });
    var zona = el('div', { 'class': 'card-simplu', style: 'margin-top:1.5rem' },
      el('p', null, el('label', { 'for': 'nume-dovada', text: tx('nume') })), el('p', null, nume), titluDoc,
      el('button', { type: 'button', 'class': 'buton', text: tx('tipareste'), onclick: function () {
        titluDoc.textContent = (nume.value || '') + ' — ' + new Date().toISOString().slice(0, 10);
        window.print();
      } }));
    p.appendChild(zona);
    if (!stocareOk) p.appendChild(el('p', { 'class': 'nota-ss', text: tx('stocare') }));
  });

  /* ---------------------------------------------------------------- filtrul glosarului */
  toate('[data-filtru-glosar]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var q = fara(inp.value.trim());
      toate('.termen-card').forEach(function (c) { c.hidden = q && fara(c.textContent).indexOf(q) < 0; });
      toate('.litera-glosar').forEach(function (h) {
        var n = h.nextElementSibling, vreunul = false;
        while (n && !n.classList.contains('litera-glosar')) { if (n.classList.contains('termen-card') && !n.hidden) vreunul = true; n = n.nextElementSibling; }
        h.hidden = !vreunul;
      });
    });
  });

  /* ---------------------------------------------------------------- citire cu voce tare */
  if ('speechSynthesis' in window) {
    toate('.caseta-narare').forEach(function (c) {
      var b = el('button', { type: 'button', 'class': 'buton-contur buton-mic', text: L === 'ro' ? 'Citește cu voce tare' : 'Read aloud' });
      b.addEventListener('click', function () {
        if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
        var u = new SpeechSynthesisUtterance(c.textContent.replace(b.textContent, ''));
        u.lang = L === 'ro' ? 'ro-RO' : 'en-GB';
        speechSynthesis.speak(u);
      });
      c.appendChild(b);
    });
  }

  /* ---------------------------------------------------------------- căutare rapidă (Ctrl/⌘ K) */
  var fundalC = null, campC = null, listaC = null, rezC = [], activC = -1, seIncarca = false;
  function incarcaIndex(gata) {
    if (window.ATELIER_INDEX) { gata(); return; }
    var src = body.getAttribute('data-cautare');
    if (!src) { gata(); return; }
    if (seIncarca) return;
    seIncarca = true;
    var s = el('script', { src: src });
    s.onload = function () { seIncarca = false; gata(); };
    s.onerror = function () { seIncarca = false; gata(); };
    document.body.appendChild(s);
  }
  function regexTermen(q) {
    var harta = { a: '[aăâ]', i: '[iî]', s: '[sșş]', t: '[tțţ]' };
    var sursa = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[aist]/g, function (c) { return harta[c]; });
    return new RegExp(sursa, 'gi');
  }
  function cauta(q) {
    var idx = window.ATELIER_INDEX || [];
    var tok = fara(q).split(/\s+/).filter(function (x) { return x.length > 1; });
    if (!tok.length) return [];
    var out = [];
    idx.forEach(function (e) {
      if (!e._n) { e._t = fara(e.t); e._x = fara(e.x); e._n = 1; }
      var scor = 0;
      for (var i = 0; i < tok.length; i++) {
        var inT = e._t.indexOf(tok[i]) >= 0, inX = e._x.indexOf(tok[i]) >= 0;
        if (!inT && !inX) return;
        scor += inT ? 3 : 1;
        if (e._t.indexOf(tok[i]) === 0) scor += 1;
      }
      out.push({ e: e, s: scor });
    });
    out.sort(function (a, b) { return b.s - a.s; });
    return out.slice(0, 24).map(function (x) { return x.e; });
  }
  function evidentiaza(parinte, text, q) {
    var tok = fara(q).split(/\s+/).filter(function (x) { return x.length > 1; });
    if (!tok.length) { parinte.appendChild(document.createTextNode(text)); return; }
    var re = new RegExp(tok.map(function (t) { return regexTermen(t).source; }).join('|'), 'gi');
    var ultim = 0, m;
    while ((m = re.exec(text)) && m[0].length) {
      parinte.appendChild(document.createTextNode(text.slice(ultim, m.index)));
      parinte.appendChild(el('mark', { text: m[0] }));
      ultim = m.index + m[0].length;
    }
    parinte.appendChild(document.createTextNode(text.slice(ultim)));
  }
  function fragment(text, q) {
    if (text.length < 180) return text;
    var tok = fara(q).split(/\s+/).filter(function (x) { return x.length > 1; })[0] || '';
    var i = Math.max(0, fara(text).indexOf(tok) - 60);
    return (i > 0 ? '… ' : '') + text.slice(i, i + 170) + (i + 170 < text.length ? ' …' : '');
  }
  function randeazaC() {
    var q = campC.value.trim();
    listaC.textContent = '';
    activC = -1;
    if (!window.ATELIER_INDEX) { listaC.appendChild(el('li', { 'class': 'cautare-gol', text: tx(seIncarca ? 'cauta_incarc' : 'cauta_indisp') })); return; }
    if (q.length < 2) { listaC.appendChild(el('li', { 'class': 'cautare-gol', text: tx('cauta_start') })); return; }
    rezC = cauta(q);
    if (!rezC.length) { listaC.appendChild(el('li', { 'class': 'cautare-gol', text: tx('cauta_gol') })); return; }
    rezC.forEach(function (e, i) {
      var a = el('a', { href: e.u, id: 'rez-c-' + i });
      a.appendChild(el('span', { 'class': 'fel', text: e.f }));
      var t = el('span', { 'class': 't' }); evidentiaza(t, e.t, q); a.appendChild(t);
      if (e.x) { var x = el('span', { 'class': 'x' }); evidentiaza(x, fragment(e.x, q), q); a.appendChild(x); }
      a.addEventListener('click', function () { inchideC(); });
      listaC.appendChild(el('li', { role: 'option' }, a));
    });
    seteazaActiv(0);
  }
  function seteazaActiv(i) {
    var a = toate('li a', listaC);
    if (!a.length) return;
    activC = (i + a.length) % a.length;
    a.forEach(function (x, j) { x.classList.toggle('activ', j === activC); });
    campC.setAttribute('aria-activedescendant', a[activC].id);
    if (a[activC].scrollIntoView) a[activC].scrollIntoView({ block: 'nearest' });
  }
  function deschideC() {
    if (!fundalC) {
      campC = el('input', { type: 'search', placeholder: tx('cauta_ph'), 'aria-label': tx('cauta_ph'), autocomplete: 'off', spellcheck: 'false',
        role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'cautare-rezultate' });
      listaC = el('ul', { 'class': 'cautare-rezultate', id: 'cautare-rezultate', role: 'listbox' });
      var ico = document.querySelector('[data-cautare-deschide] svg');
      var camp = el('div', { 'class': 'cautare-camp' });
      if (ico) camp.appendChild(ico.cloneNode(true));
      camp.appendChild(campC);
      var dialog = el('div', { 'class': 'cautare-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': tx('cauta_ph') },
        camp, listaC, el('div', { 'class': 'cautare-subsol', text: tx('cauta_nav') }));
      fundalC = el('div', { 'class': 'cautare-fundal', hidden: '' }, dialog);
      document.body.appendChild(fundalC);
      fundalC.addEventListener('mousedown', function (e) { if (e.target === fundalC) inchideC(); });
      campC.addEventListener('input', randeazaC);
      campC.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); seteazaActiv(activC + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); seteazaActiv(activC - 1); }
        else if (e.key === 'Enter') { var a = toate('li a', listaC)[activC]; if (a) { e.preventDefault(); inchideC(); location.href = a.getAttribute('href'); } }
        else if (e.key === 'Escape') { e.preventDefault(); inchideC(); }
      });
    }
    fundalC.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    campC.focus();
    incarcaIndex(randeazaC);
  }
  function inchideC() {
    if (!fundalC) return;
    fundalC.hidden = true;
    document.documentElement.style.overflow = '';
    var b = document.querySelector('[data-cautare-deschide]');
    if (b) b.focus();
  }
  toate('[data-cautare-deschide]').forEach(function (b) {
    b.addEventListener('click', deschideC);
    var k = b.querySelector('kbd');
    if (k && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) k.textContent = '⌘ K';
  });
  document.addEventListener('keydown', function (e) {
    var tinta = e.target && e.target.tagName;
    var tastare = tinta === 'INPUT' || tinta === 'TEXTAREA' || tinta === 'SELECT' || (e.target && e.target.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && document.querySelector('[data-cautare-deschide]')) { e.preventDefault(); deschideC(); }
    else if (e.key === '/' && !tastare && document.querySelector('[data-cautare-deschide]')) { e.preventDefault(); deschideC(); }
  });

  /* ---------------------------------------------------------------- prezentare */
  var pachet = document.querySelector('[data-pachet]');
  if (pachet) {
    var d = toate('.diapozitiv', pachet);
    var i = 0;
    var m = /^#(\d+)$/.exec(location.hash);
    if (m) i = Math.min(d.length - 1, Math.max(0, parseInt(m[1], 10) - 1));
    var zonaNote = el('div', { 'class': 'note-prezentator', 'aria-live': 'polite' });
    document.body.appendChild(zonaNote);
    var progres = document.querySelector('.progres-prezentare span');
    var ans = document.querySelector('[data-lista-ansamblu]');
    var bN = document.querySelector('[data-note]'), bA = document.querySelector('[data-ansamblu]'), bE = document.querySelector('[data-ecran]');
    function mergi(k) {
      i = Math.max(0, Math.min(d.length - 1, k));
      d.forEach(function (x, j) { x.classList.toggle('activ', j === i); });
      var n = d[i].querySelector('.note-prezentator');
      zonaNote.textContent = n ? n.textContent : '';
      if (progres) progres.style.width = (100 * (i + 1) / d.length) + '%';
      if (ans) toate('button', ans).forEach(function (b, j) { b.classList.toggle('curent', j === i); });
      try { history.replaceState(null, '', '#' + (i + 1)); } catch (e) { /* file:// */ }
      A.monteazaToate(d[i]);
    }
    function comutaNote() { var v = !body.classList.contains('cu-note'); body.classList.toggle('cu-note', v); if (bN) bN.setAttribute('aria-pressed', v ? 'true' : 'false'); }
    function comutaAns(v) { if (v == null) v = !body.classList.contains('cu-ansamblu'); body.classList.toggle('cu-ansamblu', v); if (bA) bA.setAttribute('aria-pressed', v ? 'true' : 'false'); }
    function ecran() {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      else if (document.exitFullscreen) document.exitFullscreen();
    }
    document.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); mergi(i + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); mergi(i - 1); }
      else if (e.key === 'Home') mergi(0);
      else if (e.key === 'End') mergi(d.length - 1);
      else if (e.key === 'n' || e.key === 'N') comutaNote();
      else if (e.key === 'o' || e.key === 'O') comutaAns();
      else if (e.key === 'f' || e.key === 'F') ecran();
      else if (e.key === 'Escape') {
        if (body.classList.contains('cu-ansamblu')) comutaAns(false);
        else if (!document.fullscreenElement) { var x = document.querySelector('.bara-prezentare a'); if (x) location.href = x.getAttribute('href'); }
      }
    });
    if (bN) bN.addEventListener('click', comutaNote);
    if (bA) bA.addEventListener('click', function () { comutaAns(); });
    if (bE) bE.addEventListener('click', ecran);
    if (ans) toate('button[data-mergi]', ans).forEach(function (b) {
      b.addEventListener('click', function () { mergi(parseInt(b.getAttribute('data-mergi'), 10) - 1); comutaAns(false); });
    });
    var x0 = null;
    pachet.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    pachet.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) mergi(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    var tmInactiv = null;
    function activitate() {
      body.classList.remove('inactiv');
      clearTimeout(tmInactiv);
      tmInactiv = setTimeout(function () { if (!body.classList.contains('cu-ansamblu')) body.classList.add('inactiv'); }, 2600);
    }
    document.addEventListener('mousemove', activitate);
    window.addEventListener('hashchange', function () {
      var h = /^#(\d+)$/.exec(location.hash);
      if (h && parseInt(h[1], 10) - 1 !== i) mergi(parseInt(h[1], 10) - 1);
    });
    activitate();
    mergi(i);
  }
})();
