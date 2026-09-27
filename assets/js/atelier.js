/* atelier.js — nucleul site-ului de curs (fără dependențe, funcționează offline).
 *
 * Interfața pentru instrumente interactive (widgets):
 *
 *   Atelier.inregistreaza('tip', { monteaza(el, cfg, ctx) { ... } });
 *
 * Fiecare element <div class="widget" data-w="W003" data-tip="standardizare">
 * primește configurația din <script type="application/json" id="cfg-W003">.
 * ctx = {
 *   limba,               'ro' | 'en'
 *   t(dict),             alege textul limbii curente dintr-un {ro, en}
 *   fmt(x, zec),         număr formatat după limbă (ro: 74,6 și 1 200; en: 74.6 și 1,200)
 *   fmtProc(x, zec),     procent formatat (x = 0.456 → „45,6%”)
 *   id,                  ID-ul instrumentului (W003)
 *   stocare.get/set,     localStorage protejat (poate lipsi — nu se presupune)
 *   anunta(text),        mesaj pentru cititoarele de ecran (aria-live)
 *   svg(tag, attrs),     creează un element SVG
 *   el(tag, attrs, ...copii)  creează un element HTML
 *   culoareSerie(i)      var(--s1)…var(--s8), în ordinea fixă a paletei
 * }
 * Un instrument nu aruncă erori în pagină: montarea e izolată, iar un eșec se
 * afișează în locul instrumentului, cu mesajul lui.
 */
(function () {
  'use strict';
  var tipuri = {};
  var limba = (document.documentElement.getAttribute('lang') || 'ro').slice(0, 2);

  function t(d) {
    if (d == null) return '';
    if (typeof d === 'string') return d;
    return d[limba] != null ? d[limba] : (d.ro != null ? d.ro : (d.en || ''));
  }

  function fmt(x, zec) {
    if (x == null || isNaN(x) || !isFinite(x)) return '—';
    if (Object.is(x, -0)) x = 0;
    var z = zec == null ? 1 : zec;
    /* rotunjire zecimală „jumătatea în sus” (1551,55 → 1551,6), nu pe reprezentarea binară, care
       ar da 1551,5 și ar contrazice textul notelor */
    var ax = Math.abs(x), r = Number(Math.round(Number(ax + 'e' + z)) + 'e-' + z);
    var s = (isFinite(r) ? r : ax).toFixed(z);
    var neg = x < 0 && /[1-9]/.test(s);   // −0,0 după rotunjire se scrie 0,0
    var parti = s.split('.');
    var intreg = parti[0], frac = parti[1];
    var sep = limba === 'ro' ? ' ' : ',';
    if (intreg.length > 3) {   // „1 075,0” ca în note (anii se scriu ca text, nu prin fmt)
      intreg = intreg.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    }
    var r = frac ? intreg + (limba === 'ro' ? ',' : '.') + frac : intreg;
    return (neg ? '−' : '') + r;
  }

  function fmtProc(x, zec) {
    if (x == null || isNaN(x)) return '—';
    return fmt(x * 100, zec == null ? 1 : zec) + (limba === 'ro' ? '%' : '%');
  }

  var stocare = {
    get: function (k, implicit) {
      try { var v = window.localStorage.getItem('atelier:' + k); return v == null ? implicit : JSON.parse(v); }
      catch (e) { return implicit; }
    },
    set: function (k, v) {
      try { window.localStorage.setItem('atelier:' + k, JSON.stringify(v)); return true; }
      catch (e) { return false; }
    }
  };

  var live;
  function anunta(text) {
    if (!live) {
      live = document.createElement('div');
      live.className = 'sr-only';
      live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
    }
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 30);
  }

  var NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in (attrs || {})) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    return e;
  }
  function el(tag, attrs) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) {
      if (attrs[k] == null) continue;
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }
  function culoareSerie(i) { return 'var(--s' + ((i % 8) + 1) + ')'; }

  function inregistreaza(tip, def) { tipuri[tip] = def; }

  function monteazaToate(radacina) {
    var noduri = (radacina || document).querySelectorAll('.widget[data-w]');
    Array.prototype.forEach.call(noduri, function (nod) {
      if (nod.getAttribute('data-montat')) return;
      var tip = nod.getAttribute('data-tip');
      var id = nod.getAttribute('data-w');
      var sursa = document.getElementById('cfg-' + id);
      var def = tipuri[tip];
      try {
        if (!def) throw new Error('tip necunoscut: ' + tip);
        var cfg = sursa ? JSON.parse(sursa.textContent) : {};
        var ctx = { limba: limba, t: t, fmt: fmt, fmtProc: fmtProc, id: id, stocare: stocare,
                    anunta: anunta, svg: svg, el: el, culoareSerie: culoareSerie };
        def.monteaza(nod, cfg, ctx);
        nod.setAttribute('data-montat', '1');
      } catch (e) {
        // studentul vede ce poate face; detaliul tehnic rămâne în consolă și în data-eroare
        nod.textContent = '';
        nod.appendChild(el('p', null, limba === 'ro'
          ? 'Instrumentul interactiv nu s-a putut încărca. Textul din jur rămâne complet; reîncărcați pagina pentru a încerca din nou.'
          : 'The interactive tool could not be loaded. The surrounding text is complete; reload the page to try again.'));
        var b = el('button', { type: 'button', 'class': 'buton-contur buton-mic' }, limba === 'ro' ? 'Reîncarcă pagina' : 'Reload the page');
        b.addEventListener('click', function () { location.reload(); });
        nod.appendChild(b);
        nod.setAttribute('data-eroare', String(e && e.message || e));
        nod.className += ' widget-eroare';
        if (window.console) console.error(e);
      }
    });
  }

  window.Atelier = { inregistreaza: inregistreaza, monteazaToate: monteazaToate, limba: limba,
                     t: t, fmt: fmt, fmtProc: fmtProc, stocare: stocare, anunta: anunta,
                     svg: svg, el: el, culoareSerie: culoareSerie, _tipuri: tipuri };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { monteazaToate(); });
  } else {
    setTimeout(monteazaToate, 0);
  }
})();
