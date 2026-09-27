/* grafic.js — ajutoare comune pentru graficele instrumentelor interactive.
 *
 * Două straturi:
 *  1. funcții pure (scări liniare, gradații „rotunde”, căi SVG pentru bare și linii,
 *     poziționarea tooltipului, detectarea coliziunilor dintre etichete) — exportate
 *     și prin CommonJS, ca să fie testate în Node (teste/test_widgets.js);
 *  2. funcții DOM (cadrul instrumentului, SVG responsiv, axe și grilă, legendă cu
 *     comutatoare, tooltip, comutatorul „Vezi datele”, cursoare, grafice de linii
 *     și de bare orizontale) — în browser, ca Atelier.grafic și window.AtelierGrafic.
 *
 * Reguli de desen (skill-ul dataviz): linii de 2px cu capete rotunde; bare de cel mult
 * 24px pe ecran, cu capătul de date rotunjit la 4px și baza dreaptă; markeri cu r ≥ 4
 * și inel de 2px în culoarea suprafeței; grilă din linii de 1px, continue; o singură
 * axă Y; textul nu poartă culoarea seriei; orice grafic are un tabel de date.
 *
 * SVG-ul are viewBox cu lățimea fixă de 640 de unități și se scalează la lățimea
 * containerului. Ca textul să rămână lizibil pe ecrane înguste, mărimea fontului în
 * unități SVG crește când containerul se îngustează (fontPentru), iar graficul se
 * redesenează când lățimea trece într-o altă treaptă de font.
 *
 * Ordinea de încărcare: atelier.js → grafic.js → instrumentele (widgets/*.js).
 */
(function (radacina) {
  'use strict';

  var LATIME = 640;
  var NBSP = ' ';

  /* ======================= partea pură (browser și Node) ======================= */

  function limiteaza(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function esteNumar(x) { return typeof x === 'number' && isFinite(x); }
  function numar(x, implicit) { return esteNumar(x) ? x : implicit; }
  function rotunjeste(x, zec) {
    var p = Math.pow(10, zec || 0);
    var r = Math.round(x * p) / p;
    return r === 0 ? 0 : r;
  }
  function r1(v) { var r = Math.round(v * 10) / 10; return r === 0 ? 0 : r; }
  function minim(a) { var m = Infinity; for (var i = 0; i < a.length; i++) if (a[i] < m) m = a[i]; return m; }
  function maxim(a) { var m = -Infinity; for (var i = 0; i < a.length; i++) if (a[i] > m) m = a[i]; return m; }

  /* Pas „rotund” (1, 2 sau 5 × 10^k) cel puțin egal cu pasul brut. */
  function pasFrumos(brut) {
    if (!(brut > 0) || !isFinite(brut)) return 1;
    var exp = Math.floor(Math.log10(brut) + 1e-12);
    var baza = Math.pow(10, exp);
    var fr = brut / baza;
    var nf = fr <= 1 + 1e-9 ? 1 : (fr <= 2 + 1e-9 ? 2 : (fr <= 5 + 1e-9 ? 5 : 10));
    return rotunjeste(nf * baza, Math.max(0, -exp));
  }
  function zecimalePas(pas) { return Math.max(0, -Math.floor(Math.log10(pas) + 1e-12)); }

  /* Gradații rotunde pe [min, max], în jur de „tinta” intervale.
   * extinde !== false: domeniul se lărgește până la gradații rotunde (axa Y);
   * extinde === false: gradațiile rămân în interiorul domeniului (axa X). */
  function tickuriFrumoase(min, max, tinta, extinde) {
    if (!esteNumar(min) || !esteNumar(max)) { min = 0; max = 1; }
    if (min > max) { var t = min; min = max; max = t; }
    if (min === max) {
      if (min === 0) max = 1;
      else { var d = Math.abs(min) * 0.1; min -= d; max += d; }
    }
    tinta = Math.max(2, tinta || 5);
    var pas = pasFrumos((max - min) / tinta);
    var zec = zecimalePas(pas);
    var lo, hi;
    if (extinde === false) {
      lo = Math.ceil(min / pas - 1e-9) * pas;
      hi = Math.floor(max / pas + 1e-9) * pas;
    } else {
      lo = Math.floor(min / pas + 1e-9) * pas;
      hi = Math.ceil(max / pas - 1e-9) * pas;
    }
    var valori = [];
    var n = Math.round((hi - lo) / pas);
    for (var i = 0; i <= n && i <= 200; i++) valori.push(rotunjeste(lo + i * pas, zec));
    return {
      min: extinde === false ? min : rotunjeste(lo, zec),
      max: extinde === false ? max : rotunjeste(hi, zec),
      pas: pas, valori: valori, zecimale: zec
    };
  }

  /* Gradații întregi (ani, zile) în interiorul domeniului; pasul e cel puțin 1. */
  function tickuriIntregi(min, max, tinta) {
    if (!esteNumar(min) || !esteNumar(max)) return { valori: [], pas: 1, zecimale: 0 };
    if (min > max) { var t = min; min = max; max = t; }
    var pas = Math.max(1, pasFrumos((max - min) / Math.max(1, tinta || 6)));
    var lo = Math.ceil(min / pas - 1e-9) * pas, valori = [];
    for (var v = lo; v <= max + 1e-9 && valori.length < 200; v += pas) valori.push(Math.round(v));
    return { valori: valori, pas: pas, zecimale: 0 };
  }

  /* Câte zecimale are nevoie o listă de valori ca să fie afișată exact (maximum „max”). */
  function zecimaleNecesare(valori, max) {
    max = max == null ? 4 : max;
    var z = 0;
    for (var i = 0; i < valori.length; i++) {
      var v = valori[i];
      if (!esteNumar(v)) continue;
      var d = z;
      for (; d < max; d++) {
        var s = v * Math.pow(10, d);
        if (Math.abs(s - Math.round(s)) < 1e-7 * Math.max(1, Math.abs(s))) break;
      }
      if (d > z) z = d;
    }
    return z;
  }

  function scaraLiniara(d0, d1, r0, r1_) {
    var plat = d1 === d0;
    var k = plat ? 0 : (r1_ - r0) / (d1 - d0);
    function f(x) { return plat ? (r0 + r1_) / 2 : r0 + (x - d0) * k; }
    f.invers = function (y) { return plat ? d0 : d0 + (y - r0) / k; };
    f.domeniu = [d0, d1];
    f.interval = [r0, r1_];
    return f;
  }

  /* Indicele valorii celei mai apropiate de x într-un șir sortat crescător. */
  function celMaiApropiat(xs, x) {
    var n = xs.length;
    if (!n) return -1;
    if (x <= xs[0]) return 0;
    if (x >= xs[n - 1]) return n - 1;
    var lo = 0, hi = n - 1;
    while (hi - lo > 1) {
      var m = (lo + hi) >> 1;
      if (xs[m] <= x) lo = m; else hi = m;
    }
    return (x - xs[lo] <= xs[hi] - x) ? lo : hi;
  }

  /* Poziția tooltipului în zona graficului (px): la dreapta indicatorului, întors la
   * stânga dacă ar ieși, centrat deasupra/dedesubt dacă nu încape în lateral;
   * întotdeauna în interiorul zonei (margine 4px). */
  function pozitieTooltip(px, py, tw, th, zw, zh, dist) {
    var m = 4;
    if (dist == null) dist = 12;
    var left = px + dist, top = py - th / 2, centrat = false;
    if (left + tw > zw - m) {
      left = px - dist - tw;
      if (left < m) {
        centrat = true;
        left = limiteaza(px - tw / 2, m, Math.max(m, zw - tw - m));
      }
    }
    if (centrat) {
      top = py - th - dist;
      if (top < m) top = py + dist;
    }
    top = limiteaza(top, m, Math.max(m, zh - th - m));
    return { left: Math.round(left), top: Math.round(top) };
  }

  /* true dacă oricare două poziții (după sortare) sunt la cel puțin distMin. */
  function faraColiziuni(pozitii, distMin) {
    var s = pozitii.slice().sort(function (a, b) { return a - b; });
    for (var i = 1; i < s.length; i++) if (s[i] - s[i - 1] < distMin) return false;
    return true;
  }

  function seSuprapun(a, b) {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
  }

  /* Pasul de rărire pentru etichetele axei X: cea mai mică valoare k pentru care
   * etichetele luate din k în k nu se suprapun (centre xs, lățimi ws, spațiu minim). */
  function pasRarire(xs, ws, spatiu) {
    for (var k = 1; k <= xs.length; k++) {
      var ok = true;
      for (var i = k; i < xs.length; i += k) {
        if (xs[i] - ws[i] / 2 < xs[i - k] + ws[i - k] / 2 + spatiu) { ok = false; break; }
      }
      if (ok) return k;
    }
    return Math.max(1, xs.length);
  }

  /* Calea SVG a unei linii; un punct lipsă (null sau y nenumeric) întrerupe linia. */
  function caleLinie(puncte) {
    var d = '', nou = true;
    for (var i = 0; i < puncte.length; i++) {
      var p = puncte[i];
      if (!p || !esteNumar(p[0]) || !esteNumar(p[1])) { nou = true; continue; }
      d += (nou ? 'M' : 'L') + r1(p[0]) + ' ' + r1(p[1]);
      nou = false;
    }
    return d;
  }

  /* Calea unei bare cu capătul de date rotunjit (raza implicită 4) și baza dreaptă.
   * capat: 'dreapta' | 'stanga' (bare orizontale), 'sus' | 'jos' (coloane), altceva = drept. */
  function caleBara(x, y, w, h, capat, raza) {
    if (!(w > 0) || !(h > 0)) return '';
    var r = raza == null ? 4 : raza;
    if (capat === 'dreapta' || capat === 'stanga') r = Math.min(r, w, h / 2);
    else if (capat === 'sus' || capat === 'jos') r = Math.min(r, h, w / 2);
    else r = 0;
    var X = r1(x), Y = r1(y), X2 = r1(x + w), Y2 = r1(y + h), R = r1(r);
    if (!(R > 0)) return 'M' + X + ' ' + Y + 'H' + X2 + 'V' + Y2 + 'H' + X + 'Z';
    var A = 'A' + R + ' ' + R + ' 0 0 ';
    switch (capat) {
      case 'dreapta':
        return 'M' + X + ' ' + Y + 'H' + r1(x + w - r) + A + '1 ' + X2 + ' ' + r1(y + r) +
          'V' + r1(y + h - r) + A + '1 ' + r1(x + w - r) + ' ' + Y2 + 'H' + X + 'Z';
      case 'stanga':
        return 'M' + X2 + ' ' + Y + 'H' + r1(x + r) + A + '0 ' + X + ' ' + r1(y + r) +
          'V' + r1(y + h - r) + A + '0 ' + r1(x + r) + ' ' + Y2 + 'H' + X2 + 'Z';
      case 'sus':
        return 'M' + X + ' ' + Y2 + 'V' + r1(y + r) + A + '1 ' + r1(x + r) + ' ' + Y +
          'H' + r1(x + w - r) + A + '1 ' + X2 + ' ' + r1(y + r) + 'V' + Y2 + 'Z';
      default: /* jos */
        return 'M' + X + ' ' + Y + 'H' + X2 + 'V' + r1(y + h - r) + A + '1 ' + r1(x + w - r) + ' ' + Y2 +
          'H' + r1(x + r) + A + '1 ' + X + ' ' + r1(y + h - r) + 'Z';
    }
  }

  /* Lățimea estimată a unui text (unități SVG) — euristică pentru un font sans. */
  function latimeText(text, font) {
    var s = String(text == null ? '' : text), l = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (/[iljtfr.,:;'|!\s  ]/.test(c)) l += 0.32;
      else if (/[mwMW—]/.test(c)) l += 0.9;
      else if (/[A-ZĂÂÎȘȚ]/.test(c)) l += 0.7;
      else if (/[0-9]/.test(c)) l += 0.6;
      else l += 0.57;
    }
    return l * (font || 11);
  }

  /* Mărimea fontului în unități SVG pentru o lățime de container (px): ~11px pe ecran,
   * limitată la [8, 21] unități, în trepte de 0,5 (sub 290px textul scade ușor sub 11px;
   * într-un container mai lat de 640px nu crește peste ~12px). */
  function fontPentru(latimeContainer) {
    var w = latimeContainer > 0 ? latimeContainer : LATIME;
    return limiteaza(Math.round(2 * 11 * LATIME / w) / 2, 8, 21);
  }

  /* Unități SVG pentru n pixeli de ecran, la o lățime de container dată: marcajele (grosimea
   * barelor, razele, golurile) se definesc în pixeli de ecran, nu în unități care se scalează. */
  function unitatiPentruPx(n, latimeContainer) {
    var w = latimeContainer > 0 ? latimeContainer : LATIME;
    return n * LATIME / w;
  }

  function sablon(text, valori) {
    return String(text == null ? '' : text).replace(/\{([A-Za-z0-9_]+)\}/g, function (m, k) {
      return valori && valori[k] != null ? String(valori[k]) : m;
    });
  }

  function alege(d, limba) {
    if (d == null) return '';
    if (typeof d === 'string') return d;
    if (d[limba] != null) return d[limba];
    return d.ro != null ? d.ro : (d.en != null ? d.en : '');
  }

  /* Valoare + unitate: procentele și promilele se lipesc, restul primesc spațiu nedespărțitor. */
  function cuUnitate(sir, unitate) {
    if (!unitate) return sir;
    return /^[%‰]/.test(unitate) ? sir + unitate : sir + NBSP + unitate;
  }

  /* „de” între numeral și substantiv (română): 20 de, 100 de, 1794 de; dar 9, 108, 1815 fără. */
  function de(x) {
    if (typeof x !== 'number' || !isFinite(x) || Math.abs(x - Math.round(x)) > 1e-9) return '';
    var r = Math.round(Math.abs(x)) % 100;
    return (r === 0 && Math.round(x) !== 0) || r >= 20 ? ' de' : '';
  }

  function idAfirmatieValid(id) { return typeof id === 'string' && /^A\d{3,5}$/.test(id); }

  /* Cursor pe scară logaritmică: poziție întreagă 0..pasi ↔ valoare în [min, max]. */
  function valoareLog(poz, min, max, pasi) { return min * Math.pow(max / min, poz / pasi); }
  function pozitieLog(v, min, max, pasi) {
    return limiteaza(Math.round(pasi * Math.log(v / min) / Math.log(max / min)), 0, pasi);
  }

  /* Rotunjire la cifre semnificative (pentru valori citite de pe cursoare logaritmice). */
  function rotunjesteSemnificativ(x, cifre) {
    if (!esteNumar(x) || x === 0) return x;
    var z = cifre - 1 - Math.floor(Math.log10(Math.abs(x)) + 1e-12);
    return rotunjeste(x, Math.max(0, z));
  }

  var pur = {
    LATIME: LATIME, limiteaza: limiteaza, esteNumar: esteNumar, numar: numar, rotunjeste: rotunjeste,
    minim: minim, maxim: maxim, pasFrumos: pasFrumos, zecimalePas: zecimalePas,
    tickuriFrumoase: tickuriFrumoase, tickuriIntregi: tickuriIntregi, zecimaleNecesare: zecimaleNecesare,
    scaraLiniara: scaraLiniara, celMaiApropiat: celMaiApropiat, pozitieTooltip: pozitieTooltip,
    faraColiziuni: faraColiziuni, seSuprapun: seSuprapun, pasRarire: pasRarire,
    caleLinie: caleLinie, caleBara: caleBara, latimeText: latimeText, fontPentru: fontPentru, unitatiPentruPx: unitatiPentruPx,
    sablon: sablon, alege: alege, cuUnitate: cuUnitate, idAfirmatieValid: idAfirmatieValid, de: de,
    valoareLog: valoareLog, pozitieLog: pozitieLog, rotunjesteSemnificativ: rotunjesteSemnificativ
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = pur; return; }

  /* ======================= partea DOM (numai în browser) ======================= */

  var NS = 'http://www.w3.org/2000/svg';
  var contor = 0;

  function S(tag, attrs, parinte) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parinte) parinte.appendChild(e);
    return e;
  }
  function H(tag, attrs, parinte, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parinte) parinte.appendChild(e);
    return e;
  }
  /* Text SVG; conținutul intră numai prin textContent. */
  function T(parinte, x, y, text, clasa, extra) {
    var a = { x: r1(x), y: r1(y) };
    if (clasa) a['class'] = clasa;
    if (extra) for (var k in extra) a[k] = extra[k];
    var e = S('text', a, parinte);
    e.textContent = text;
    return e;
  }
  function goleste(nod) { while (nod.firstChild) nod.removeChild(nod.firstChild); }

  var TX = {
    construite: { ro: 'Valori ipotetice, alese pentru calcul', en: 'Hypothetical values chosen for the calculation' },
    veziDatele: { ro: 'Vezi datele', en: 'Show data' },
    ascundeDatele: { ro: 'Ascunde datele', en: 'Hide data' },
    sursa: { ro: 'Sursa:', en: 'Source:' },
    afirmatii: { ro: 'registrul surselor:', en: 'source register:' },
    faraValori: {
      ro: 'Configurație incompletă: câmpul „valori” trebuie să fie „construite” sau „reale”.',
      en: 'Incomplete configuration: the “valori” field must be “construite” or “reale”.'
    },
    faraSursa: { ro: 'Lipsește sursa datelor („sursa_text”).', en: 'The data source (“sursa_text”) is missing.' },
    minimUnaSerie: { ro: 'Cel puțin o serie rămâne vizibilă.', en: 'At least one series stays visible.' },
    serieAfisata: { ro: 'Seria {s} este afișată.', en: 'Series {s} is shown.' },
    serieAscunsa: { ro: 'Seria {s} este ascunsă.', en: 'Series {s} is hidden.' },
    legendaSerii: { ro: 'Serii: apăsați pentru a afișa sau a ascunde', en: 'Series: press to show or hide' },
    tastatura: {
      ro: 'Cu graficul selectat, săgețile parcurg valorile, iar Esc ascunde detaliile.',
      en: 'With the chart focused, the arrow keys step through the values and Esc hides the details.'
    }
  };

  /* ctx.fmt fără „−0” și cu ∞ pentru valori infinite. */
  function fmtN(ctx, x, zec) {
    if (x === Infinity) return '∞';
    if (x === -Infinity) return '−∞';
    if (!esteNumar(x)) return ctx.fmt(null, zec);
    var z = zec == null ? 1 : zec;
    if (Math.abs(x) * Math.pow(10, z) < 0.5) x = 0;
    return ctx.fmt(x, z);
  }

  /* Cadrul comun: eticheta „valori construite”, titlu, instrucțiuni, mesaje, corp, sursă. */
  function cadru(el, cfg, ctx) {
    cfg = cfg || {};
    el.textContent = '';
    if (el.classList) el.classList.add('w-instrument');
    if (cfg.valori === 'construite') H('span', { 'class': 'eticheta-construite' }, el, ctx.t(TX.construite));
    if (cfg.titlu) H('p', { 'class': 'w-titlu' }, el, ctx.t(cfg.titlu));
    if (cfg.instructiuni) H('p', { 'class': 'w-instr' }, el, ctx.t(cfg.instructiuni));
    var zm = H('div', { 'class': 'w-mesaje' }, el);
    var corp = H('div', { 'class': 'w-corp' }, el);
    var fixe = [];
    if (cfg.valori !== 'construite' && cfg.valori !== 'reale') fixe.push(TX.faraValori);
    if (cfg.valori === 'reale' && !cfg.sursa_text) fixe.push(TX.faraSursa);
    function mesaje(lista) {
      goleste(zm);
      fixe.concat(lista || []).forEach(function (m) {
        var text = ctx.t(m);
        if (m && m.v) {
          var v = {};
          for (var k in m.v) v[k] = fmtN(ctx, m.v[k][0], m.v[k][1]);
          text = sablon(text, v);
        }
        H('p', { 'class': 'w-mesaj' }, zm, text);
      });
    }
    mesaje([]);
    return {
      corp: corp,
      mesaje: mesaje,
      incheie: function () { if (cfg.valori === 'reale') sursa(el, cfg, ctx); }
    };
  }

  function sursa(el, cfg, ctx) {
    var p = H('p', { 'class': 'sursa-w' }, el);
    var text = ctx.t(cfg.sursa_text || '');
    if (text && !/^\s*(sursa|sursă|sursele|surse|source|sources)\s*[:.]/i.test(text)) text = ctx.t(TX.sursa) + ' ' + text;
    p.appendChild(document.createTextNode(text));
    var ids = (Array.isArray(cfg.afirmatii) ? cfg.afirmatii : []).filter(idAfirmatieValid);
    if (ids.length) {
      p.appendChild(document.createTextNode(' · ' + ctx.t(TX.afirmatii) + ' '));
      ids.forEach(function (id, i) {
        if (i) p.appendChild(document.createTextNode(', '));
        H('a', { href: 'surse.html#' + id }, p, id);
      });
    }
    return p;
  }

  /* Urmărește lățimea unui element; fn(latime) la fiecare schimbare, cel mult o dată pe cadru. */
  function observa(el, fn) {
    var ultim = el.clientWidth, programat = false;
    function verifica() {
      programat = false;
      var w = el.clientWidth;
      if (w !== ultim) { ultim = w; fn(w); }
    }
    function programeaza() {
      if (programat) return;
      programat = true;
      if (radacina.requestAnimationFrame) radacina.requestAnimationFrame(verifica);
      else setTimeout(verifica, 16);
    }
    if (typeof radacina.ResizeObserver === 'function') new radacina.ResizeObserver(programeaza).observe(el);
    else if (radacina.addEventListener) radacina.addEventListener('resize', programeaza);
  }

  function tooltipNou(zona, svg) {
    var div = H('div', { 'class': 'tooltip w-tt', 'aria-hidden': 'true' }, zona);
    div.hidden = true;
    return {
      arata: function (antet, randuri, ux, uy) {
        goleste(div);
        if (antet) H('div', { 'class': 'tt-antet' }, div, antet);
        (randuri || []).forEach(function (r) {
          var rd = H('div', { 'class': 'tt-rand' }, div);
          if (r.culoare) H('span', { 'class': 'tt-cheie', style: 'background:' + r.culoare, 'aria-hidden': 'true' }, rd);
          else H('span', { 'class': 'tt-cheie tt-gol', 'aria-hidden': 'true' }, rd);
          H('strong', { 'class': 'tt-val' }, rd, r.valoare);
          if (r.eticheta) H('span', { 'class': 'tt-et' }, rd, r.eticheta);
        });
        div.hidden = false;
        var zr = zona.getBoundingClientRect(), sr = svg.getBoundingClientRect();
        var s = sr.width > 0 ? sr.width / LATIME : 1;
        var px = sr.left - zr.left + ux * s, py = sr.top - zr.top + uy * s;
        div.style.left = '0px';
        div.style.top = '0px';
        var p = pozitieTooltip(px, py, div.offsetWidth, div.offsetHeight, zona.clientWidth, zona.clientHeight, 14);
        div.style.left = p.left + 'px';
        div.style.top = p.top + 'px';
      },
      ascunde: function () { div.hidden = true; }
    };
  }

  /* Un grafic: zonă poziționată, SVG responsiv (role="img", aria-label, <title>, <desc>), tooltip. */
  function graficNou(ctx, parinte, o) {
    o = o || {};
    var zona = H('div', { 'class': 'zona-grafic' }, parinte);
    var svg = S('svg', {
      'class': 'grafic w-g', viewBox: '0 0 ' + LATIME + ' ' + (o.inaltime || 320),
      role: 'img', tabindex: '0', 'aria-label': o.eticheta || ''
    }, zona);
    var titlu = S('title', null, svg);
    var desc = S('desc', null, svg);
    var cont = S('g', null, svg);
    var tt = tooltipNou(zona, svg);
    var font = 11, wUltim = -1, wEfectiv = LATIME;
    function curata() {
      tt.ascunde();
      goleste(cont);
      /* titlu gol pe stratul desenat: împiedică tooltipul nativ al browserului (din <title>-ul
       * SVG-ului) să acopere tooltipul instrumentului */
      S('title', null, cont);
      return cont;
    }
    var g = {
      zona: zona, svg: svg, tooltip: tt,
      masoara: function () {
        var w = zona.clientWidth || 0;
        wUltim = w;
        wEfectiv = w > 0 ? w : LATIME;
        font = fontPentru(wEfectiv);
        svg.style.setProperty('--w-font', font + 'px');
        return font;
      },
      font: function () { return font; },
      /* unități SVG pentru n pixeli de ecran (după ultima măsurare) */
      px: function (n) { return unitatiPentruPx(n, wEfectiv); },
      inaltime: function (h) { svg.setAttribute('viewBox', '0 0 ' + LATIME + ' ' + Math.round(h)); },
      goleste: curata,
      descrie: function (eticheta, lung) {
        svg.setAttribute('aria-label', eticheta);
        titlu.textContent = eticheta;
        desc.textContent = (lung ? lung + ' ' : '') + ctx.t(TX.tastatura);
      },
      laRedimensionare: function (fn) {
        /* se redesenează când se schimbă treapta de font sau lățimea cu peste 10% (grosimea
           marcajelor în pixeli de ecran), nu la fiecare pixel */
        observa(zona, function (w) {
          var we = w > 0 ? w : LATIME;
          if (fontPentru(we) !== font || (wUltim <= 0 && w > 0) || Math.abs(we - wEfectiv) > 0.1 * wEfectiv) fn();
        });
      }
    };
    return g;
  }

  /* Stratul de interacțiune comun: indicator (pointer), atingere, tastatură.
   * o = { n(), index(ux, uy) → i sau -1, arata(i), ascunde(), implicit() → i, sus: +1|-1 } */
  function interactiune(g, o) {
    var svg = g.svg, curent = -1, activ = false;
    function coord(e) {
      var r = svg.getBoundingClientRect();
      if (!r.width) return null;
      var s = LATIME / r.width;
      return { ux: (e.clientX - r.left) * s, uy: (e.clientY - r.top) * s };
    }
    function arata(i) {
      curent = i;
      activ = true;
      try { o.arata(i); } catch (err) { if (radacina.console) console.error(err); }
    }
    function ascunde() {
      if (!activ) return;
      activ = false;
      g.tooltip.ascunde();
      try { o.ascunde(); } catch (err) { if (radacina.console) console.error(err); }
    }
    function laPointer(e) {
      var c = coord(e);
      if (!c) return;
      var i = o.index(c.ux, c.uy);
      if (i == null || i < 0) { ascunde(); return; }
      arata(i);
    }
    svg.addEventListener('pointermove', laPointer);
    svg.addEventListener('pointerdown', laPointer);
    svg.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') ascunde(); });
    document.addEventListener('pointerdown', function (e) { if (activ && !svg.contains(e.target)) ascunde(); });
    svg.addEventListener('focus', function () {
      var n = o.n();
      if (!n) return;
      if (curent < 0 || curent >= n) curent = o.implicit ? o.implicit() : 0;
      arata(limiteaza(curent, 0, n - 1));
    });
    svg.addEventListener('blur', ascunde);
    svg.addEventListener('keydown', function (e) {
      var n = o.n();
      if (!n) return;
      var sus = o.sus || -1, d = 0;
      if (e.key === 'ArrowRight') d = 1;
      else if (e.key === 'ArrowLeft') d = -1;
      else if (e.key === 'ArrowUp') d = sus;
      else if (e.key === 'ArrowDown') d = -sus;
      else if (e.key === 'Home') { e.preventDefault(); arata(0); return; }
      else if (e.key === 'End') { e.preventDefault(); arata(n - 1); return; }
      else if (e.key === 'Escape') { ascunde(); return; }
      else return;
      e.preventDefault();
      arata(limiteaza(curent < 0 ? 0 : curent + d, 0, n - 1));
    });
    return { reset: function () { curent = -1; activ = false; } };
  }

  function mostra(parinte, culoare, forma) {
    var f = forma || 'dreptunghi';
    var st = f === 'contur' ? 'border-color:' + culoare : 'background:' + culoare;
    return H('span', { 'class': 'mostra m-' + f, style: st, 'aria-hidden': 'true' }, parinte);
  }

  /* Legenda (HTML). articole: [{cheie, eticheta, culoare, forma, activ}].
   * o.comutabil: butoane cu aria-pressed; o.laComutare(cheie, activ). Cel puțin o serie rămâne. */
  function legenda(ctx, parinte, articole, o) {
    o = o || {};
    var div = H('div', { 'class': 'legenda' + (o.clasa ? ' ' + o.clasa : '') }, parinte);
    var butoane = {};
    if (o.comutabil) { div.setAttribute('role', 'group'); div.setAttribute('aria-label', ctx.t(TX.legendaSerii)); }
    articole.forEach(function (a) {
      var cheie;
      if (o.comutabil) {
        cheie = H('button', { type: 'button', 'class': 'cheie', 'aria-pressed': a.activ === false ? 'false' : 'true' }, div);
        butoane[a.cheie] = cheie;
        cheie.addEventListener('click', function () {
          var nou = cheie.getAttribute('aria-pressed') !== 'true';
          if (!nou) {
            var active = 0;
            for (var k in butoane) if (butoane[k].getAttribute('aria-pressed') === 'true') active++;
            if (active <= 1) { ctx.anunta(ctx.t(TX.minimUnaSerie)); return; }
          }
          cheie.setAttribute('aria-pressed', nou ? 'true' : 'false');
          if (o.laComutare) o.laComutare(a.cheie, nou);
          ctx.anunta(sablon(ctx.t(nou ? TX.serieAfisata : TX.serieAscunsa), { s: a.eticheta }));
        });
      } else {
        cheie = H('span', { 'class': 'cheie' }, div);
      }
      mostra(cheie, a.culoare, a.forma);
      cheie.appendChild(document.createTextNode(a.eticheta));
    });
    return div;
  }

  /* Tabel accesibil. o = {legenda, antete: [[{text, colspan, rowspan, num, id}]], randuri: [[{text|nod, antet, num, id}]]} */
  function tabel(o) {
    var t = H('table', { 'class': 'w-tabel' });
    if (o.legenda) H('caption', null, t, o.legenda);
    var thead = H('thead', null, t);
    (o.antete || []).forEach(function (rand) {
      var tr = H('tr', null, thead);
      rand.forEach(function (c) {
        H('th', {
          scope: c.colspan > 1 ? 'colgroup' : 'col', colspan: c.colspan > 1 ? c.colspan : null,
          rowspan: c.rowspan > 1 ? c.rowspan : null, 'class': c.num ? 'num' : null, id: c.id || null
        }, tr, c.text);
      });
    });
    var tbody = H('tbody', null, t);
    (o.randuri || []).forEach(function (rand) {
      var tr = H('tr', { 'class': rand.clasa || null }, tbody);
      (rand.celule || rand).forEach(function (c) {
        var cel = H(c.antet ? 'th' : 'td', { scope: c.antet ? 'row' : null, 'class': c.num ? 'num' : null, id: c.id || null }, tr);
        if (c.nod) cel.appendChild(c.nod);
        else cel.textContent = c.text == null ? '' : c.text;
      });
    });
    return t;
  }

  /* Comutatorul „Vezi datele / Show data” și tabelul de sub grafic (construit la deschidere). */
  function vizualizareTabel(ctx, parinte, construieste) {
    var id = 'w-date-' + (ctx.id || 'w') + '-' + (++contor);
    var b = H('button', { type: 'button', 'class': 'comutator-tabel', 'aria-expanded': 'false', 'aria-controls': id }, parinte, ctx.t(TX.veziDatele));
    var cutie = H('div', { 'class': 'tabel-derulant w-date', id: id }, parinte);
    cutie.hidden = true;
    var deschis = false;
    function reface() {
      if (!deschis) return;
      goleste(cutie);
      var t = construieste();
      if (t) cutie.appendChild(t);
    }
    b.addEventListener('click', function () {
      deschis = !deschis;
      cutie.hidden = !deschis;
      b.setAttribute('aria-expanded', deschis ? 'true' : 'false');
      b.textContent = ctx.t(deschis ? TX.ascundeDatele : TX.veziDatele);
      reface();
    });
    return { actualizeaza: reface, buton: b, cutie: cutie };
  }

  /* Cursor (input range) cu etichetă vizibilă și valoarea curentă.
   * o = {eticheta, min, max, pas, valoare, format(v), laSchimbare(v), scara: 'log', rotunjire(v)} */
  function cursor(ctx, parinte, o) {
    var lab = H('label', { 'class': 'w-cursor' }, parinte);
    var cap = H('span', { 'class': 'w-cursor-cap' }, lab);
    H('span', { 'class': 'w-cursor-et' }, cap, o.eticheta);
    var val = H('span', { 'class': 'valoare-cursor' }, cap);
    var log = o.scara === 'log' && o.min > 0 && o.max > o.min;
    var PASI = 1000;
    var inp = H('input', { type: 'range' }, lab);
    if (log) { inp.setAttribute('min', '0'); inp.setAttribute('max', String(PASI)); inp.setAttribute('step', '1'); }
    else { inp.setAttribute('min', String(o.min)); inp.setAttribute('max', String(o.max)); inp.setAttribute('step', String(o.pas || 'any')); }
    var curent = o.valoare;
    function afiseaza() {
      var s = o.format(curent);
      val.textContent = s;
      inp.setAttribute('aria-valuetext', s);
    }
    function seteaza(v) {
      curent = v;
      inp.value = String(log ? pozitieLog(v, o.min, o.max, PASI) : v);
      afiseaza();
    }
    inp.addEventListener('input', function () {
      var p = parseFloat(inp.value);
      if (!esteNumar(p)) return;
      var v = log ? valoareLog(p, o.min, o.max, PASI) : p;
      if (o.rotunjire) v = o.rotunjire(v);
      curent = v;
      afiseaza();
      if (o.laSchimbare) o.laSchimbare(v);
    });
    seteaza(o.valoare);
    return { input: inp, seteaza: seteaza, valoare: function () { return curent; } };
  }

  /* Dalele de rezultate (.rezultate > .dala > .et/.val/.sub). */
  function dale(parinte) {
    var div = H('div', { 'class': 'rezultate' }, parinte);
    return {
      seteaza: function (lista) {
        goleste(div);
        lista.forEach(function (d) {
          var e = H('div', { 'class': 'dala' }, div);
          H('div', { 'class': 'et' }, e, d.et);
          H('div', { 'class': 'val' }, e, d.val);
          if (d.sub) H('div', { 'class': 'sub' }, e, d.sub);
        });
      }
    };
  }

  function concluzie(parinte) {
    var p = H('p', { 'class': 'concluzie' }, parinte);
    return { seteaza: function (t) { p.textContent = t || ''; p.hidden = !t; } };
  }

  /* ctx.anunta cu întârziere: un singur anunț după ce utilizatorul se oprește din tras de cursor. */
  function anuntator(ctx, ms) {
    var tm = null;
    return function (text) {
      if (tm) clearTimeout(tm);
      tm = setTimeout(function () { tm = null; ctx.anunta(text); }, ms == null ? 600 : ms);
    };
  }

  /* Marker: cerc (r ≥ 4px pe ecran) cu inel de 2px în culoarea suprafeței. r și inel sunt în
   * unități SVG — apelanții le obțin cu g.px(4), g.px(2). */
  function punct(parinte, x, y, culoare, r, inel) {
    r = r || 4;
    if (inel == null) inel = 2;
    var g = S('g', { 'class': 'w-punct' }, parinte);
    S('circle', { cx: r1(x), cy: r1(y), r: r1(r + inel), 'class': 'w-inel' }, g);
    S('circle', { cx: r1(x), cy: r1(y), r: r1(r), style: 'fill:' + culoare }, g);
    return g;
  }

  /* Grilă orizontală (linii de 1px) și gradațiile axei Y. */
  function axaY(cont, o) {
    var gr = S('g', { 'class': 'grila' }, cont);
    var et = S('g', null, cont);
    o.ticks.forEach(function (v) {
      var y = r1(o.sy(v));
      S('line', { x1: r1(o.x0), x2: r1(o.x1), y1: y, y2: y }, gr);
      T(et, o.x0 - 6, y, o.format(v), 't-mut', { 'text-anchor': 'end', dy: '0.32em' });
    });
  }

  /* Axa X: linia de bază, repere scurte și etichete rărite ca să nu se suprapună. */
  function axaX(cont, o) {
    var ax = S('g', { 'class': 'axa' }, cont);
    S('line', { x1: r1(o.x0), x2: r1(o.x1), y1: r1(o.y), y2: r1(o.y) }, ax);
    var et = S('g', null, cont);
    var xs = o.ticks.map(function (v) { return o.sx(v); });
    var texte = o.ticks.map(function (v) { return o.format(v); });
    var ws = texte.map(function (s) { return latimeText(s, o.font); });
    var k = pasRarire(xs, ws, o.font * 0.8);
    for (var i = 0; i < xs.length; i += k) {
      /* etichetele de la marginile zonei de desen se ancorează spre interior, ca să nu intre
         sub gradațiile axei Y și să nu iasă din viewBox */
      var x = xs[i], w = ws[i], anc = 'middle', xt = x;
      if (x - w / 2 < Math.max(1, o.x0 - 4)) { anc = 'start'; xt = Math.max(1, Math.min(x - 2, o.x0 - 2)); }
      else if (x + w / 2 > Math.min(LATIME - 1, o.x1 + 4)) { anc = 'end'; xt = Math.min(LATIME - 1, Math.max(x + 2, o.x1 + 2)); }
      S('line', { x1: r1(x), x2: r1(x), y1: r1(o.y), y2: r1(o.y + 4) }, ax);
      T(et, xt, o.y + o.font + 5, texte[i], 't-mut', { 'text-anchor': anc });
    }
  }

  function ultimulPunct(puncte) {
    for (var i = puncte.length - 1; i >= 0; i--) if (puncte[i] && esteNumar(puncte[i][0]) && esteNumar(puncte[i][1])) return puncte[i];
    return null;
  }
  function punctMaxim(puncte) {
    var b = null;
    puncte.forEach(function (p) { if (p && esteNumar(p[1]) && (!b || p[1] > b[1])) b = p; });
    return b;
  }

  /* Grafic de linii cu indicator vertical (crosshair) și tooltip pentru toate seriile vizibile.
   * spec = {
   *   serii: [{cheie, eticheta, culoare, puncte: [[x,y]], vizibil, atenuat}],
   *   titluY, titluX, xIntregi, xDomeniu, yDomeniu, yDeLaZero, inaltime,
   *   formatTickX(x), formatAntetX(x), formatTickY(v, zec), formatValoare(y, serie),
   *   referinte: [{axa: 'x'|'y', valoare, eticheta}], arii: [{culoare, puncte}],
   *   eticheteCapat (implicit true, doar pentru ≤ 4 serii vizibile), eticheteVarf,
   *   randuriExtra(x) → rânduri suplimentare în tooltip
   * } */
  function linii(ctx, g, spec) {
    var f = g.masoara();
    var cont = g.goleste();
    var Hh = Math.round((spec.inaltime || 300) + (f - 11) * 9);
    var serii = spec.serii || [];
    var viz = serii.filter(function (s) { return s.vizibil !== false; });

    serii.forEach(function (s) {
      s._harta = {};
      s.puncte.forEach(function (p) { if (p && esteNumar(p[0])) s._harta[String(p[0])] = p[1]; });
    });
    var xsToate = [];
    serii.forEach(function (s) { s.puncte.forEach(function (p) { if (p && esteNumar(p[0])) xsToate.push(p[0]); }); });
    var xmin = spec.xDomeniu ? spec.xDomeniu[0] : minim(xsToate);
    var xmax = spec.xDomeniu ? spec.xDomeniu[1] : maxim(xsToate);
    if (!esteNumar(xmin) || !esteNumar(xmax)) { xmin = 0; xmax = 1; }
    if (xmin === xmax) { xmin -= 1; xmax += 1; }

    var ys = [];
    viz.forEach(function (s) { s.puncte.forEach(function (p) { if (p && esteNumar(p[1])) ys.push(p[1]); }); });
    (spec.referinte || []).forEach(function (r) { if (r.axa === 'y' && esteNumar(r.valoare)) ys.push(r.valoare); });
    var ymin = ys.length ? minim(ys) : 0, ymax = ys.length ? maxim(ys) : 1;
    if (spec.yDomeniu) { ymin = spec.yDomeniu[0]; ymax = spec.yDomeniu[1]; }
    if (spec.yDeLaZero) { ymin = Math.min(0, ymin); ymax = Math.max(0, ymax); }
    if (spec.eticheteVarf) ymax = ymax + (ymax - ymin) * 0.12;

    var tintaY = Math.max(4, Math.round(66 / f));
    var tY = tickuriFrumoase(ymin, ymax, tintaY);
    var fmtY = spec.formatTickY ? function (v) { return spec.formatTickY(v, tY.zecimale); } : function (v) { return fmtN(ctx, v, tY.zecimale); };
    var latY = 0;
    tY.valori.forEach(function (v) { latY = Math.max(latY, latimeText(fmtY(v), f)); });

    var sus = Math.round(f * (spec.titluY ? 2.6 : 1.2));
    var jos = Math.round(f * (spec.titluX ? 3.5 : 2) + 8);
    var stanga = Math.round(latY + 10);
    var cuEt = spec.eticheteCapat !== false && !spec.eticheteVarf && viz.length > 0 && viz.length <= 4;
    var latEt = 0;
    if (cuEt) viz.forEach(function (s) { latEt = Math.max(latEt, latimeText(s.eticheta, f)); });
    if (latEt > LATIME * 0.3) cuEt = false;

    var L, sx, sy;
    function aranjeaza(cuEtichete) {
      var dreapta = cuEtichete ? Math.round(latEt + 14) : Math.round(f * 1.2);
      L = { x0: stanga, x1: LATIME - dreapta, y0: sus, y1: Hh - jos };
      sx = scaraLiniara(xmin, xmax, L.x0, L.x1);
      sy = scaraLiniara(tY.min, tY.max, L.y1, L.y0);
    }
    aranjeaza(cuEt);
    var capete = [];
    if (cuEt) {
      viz.forEach(function (s) {
        var u = ultimulPunct(s.puncte);
        if (u) capete.push({ s: s, x: sx(u[0]), y: sy(u[1]) });
      });
      if (!faraColiziuni(capete.map(function (c) { return c.y; }), f + 2)) { cuEt = false; capete = []; aranjeaza(false); }
      else capete.forEach(function (c) { c.x = sx(ultimulPunct(c.s.puncte)[0]); });
    }
    g.inaltime(Hh);

    if (spec.titluY) T(cont, 0, Math.round(f * 1.1), spec.titluY, 't-titlu-axa', { 'text-anchor': 'start' });
    if (spec.titluX) T(cont, L.x1, Hh - 4, spec.titluX, 't-titlu-axa', { 'text-anchor': 'end' });
    axaY(cont, { ticks: tY.valori, sy: sy, x0: L.x0, x1: L.x1, format: fmtY });
    var tintaX = Math.max(3, Math.round(80 / f));
    var tX = spec.xIntregi ? tickuriIntregi(xmin, xmax, tintaX) : tickuriFrumoase(xmin, xmax, tintaX, false);
    var fmtX = spec.formatTickX || function (v) { return fmtN(ctx, v, tX.zecimale); };
    axaX(cont, { ticks: tX.valori, sx: sx, y: L.y1, x0: L.x0, x1: L.x1, format: fmtX, font: f });
    if (tY.min < 0 && tY.max > 0) S('line', { 'class': 'w-zero', x1: L.x0, x2: L.x1, y1: r1(sy(0)), y2: r1(sy(0)) }, cont);

    var yBaza = sy(limiteaza(0, tY.min, tY.max));
    (spec.arii || []).forEach(function (a) {
      var pts = a.puncte.filter(function (p) { return esteNumar(p[0]) && esteNumar(p[1]); });
      if (pts.length < 2) return;
      var d = 'M' + r1(sx(pts[0][0])) + ' ' + r1(yBaza);
      pts.forEach(function (p) { d += 'L' + r1(sx(p[0])) + ' ' + r1(sy(p[1])); });
      d += 'L' + r1(sx(pts[pts.length - 1][0])) + ' ' + r1(yBaza) + 'Z';
      S('path', { d: d, 'class': 'w-arie', style: 'fill:' + a.culoare }, cont);
    });

    (spec.referinte || []).forEach(function (r) {
      if (!esteNumar(r.valoare)) return;
      if (r.axa === 'y') {
        var y = r1(sy(r.valoare));
        if (y < L.y0 || y > L.y1) return;
        S('line', { 'class': 'w-referinta', x1: L.x0, x2: L.x1, y1: y, y2: y }, cont);
        if (r.eticheta) T(cont, L.x0 + 6, y - 5, r.eticheta, 't-et t-mic', { 'text-anchor': 'start' });
      } else {
        var x = r1(sx(r.valoare));
        if (x < L.x0 || x > L.x1) return;
        S('line', { 'class': 'w-referinta', x1: x, x2: x, y1: L.y0, y2: L.y1 }, cont);
        if (r.eticheta) {
          var lw = latimeText(r.eticheta, f * 0.9);
          var laDreapta = x + 6 + lw < L.x1;
          T(cont, laDreapta ? x + 6 : x - 6, L.y0 + f, r.eticheta, 't-et t-mic', { 'text-anchor': laDreapta ? 'start' : 'end' });
        }
      }
    });

    var ordine = viz.filter(function (s) { return s.atenuat; }).concat(viz.filter(function (s) { return !s.atenuat; }));
    ordine.forEach(function (s) {
      var pts = s.puncte.map(function (p) { return p && esteNumar(p[1]) ? [sx(p[0]), sy(p[1])] : null; });
      S('path', { d: caleLinie(pts), 'class': 'w-linie' + (s.atenuat ? ' w-atenuata' : ''), style: 'stroke:' + s.culoare }, cont);
      for (var i = 0; i < pts.length; i++) {
        var izolat = pts[i] && !pts[i - 1] && !pts[i + 1];
        if (izolat) S('circle', { cx: r1(pts[i][0]), cy: r1(pts[i][1]), r: r1(g.px(3)), style: 'fill:' + s.culoare }, cont);
      }
    });

    if (cuEt) capete.forEach(function (c) { T(cont, c.x + 6, c.y, c.s.eticheta, 't-et', { dy: '0.32em' }); });

    if (spec.eticheteVarf) {
      var cutii = [], texte = [];
      viz.forEach(function (s) {
        var m = punctMaxim(s.puncte);
        if (!m) return;
        var w = latimeText(s.eticheta, f), x = sx(m[0]), y = sy(m[1]) - 8;
        var xs = limiteaza(x - w / 2, L.x0, L.x1 - w);
        cutii.push({ x: xs - 3, y: y - f, w: w + 6, h: f + 3 });
        texte.push([xs, y, s.eticheta]);
      });
      var ok = true;
      for (var i = 0; i < cutii.length; i++) for (var j = i + 1; j < cutii.length; j++) if (seSuprapun(cutii[i], cutii[j])) ok = false;
      if (ok) texte.forEach(function (t) { T(cont, t[0], t[1], t[2], 't-et', { 'text-anchor': 'start' }); });
    }

    var strHover = S('g', { 'class': 'w-hover' }, cont);
    var xsViz = [];
    var vazut = {};
    viz.forEach(function (s) {
      s.puncte.forEach(function (p) {
        if (p && esteNumar(p[0]) && esteNumar(p[1]) && !vazut[p[0]]) { vazut[p[0]] = 1; xsViz.push(p[0]); }
      });
    });
    xsViz.sort(function (a, b) { return a - b; });
    g._linii = { xs: xsViz, sx: sx, sy: sy, L: L, viz: viz, strHover: strHover, spec: spec };

    if (!g._interLinii) {
      g._interLinii = true;
      interactiune(g, {
        n: function () { return g._linii ? g._linii.xs.length : 0; },
        implicit: function () { return g._linii.xs.length - 1; },
        index: function (ux, uy) {
          var st = g._linii;
          if (!st || ux < st.L.x0 - 12 || ux > st.L.x1 + 12 || uy < st.L.y0 - 12 || uy > st.L.y1 + 12) return -1;
          return celMaiApropiat(st.xs, st.sx.invers(ux));
        },
        arata: function (i) {
          var st = g._linii, x = st.xs[i], X = st.sx(x);
          goleste(st.strHover);
          S('line', { 'class': 'w-crosshair', x1: r1(X), x2: r1(X), y1: st.L.y0, y2: st.L.y1 }, st.strHover);
          var randuri = [], yAncora = Infinity;
          st.viz.forEach(function (s) {
            var y = s._harta[String(x)];
            if (!esteNumar(y)) { randuri.push({ culoare: s.culoare, valoare: '—', eticheta: s.eticheta, _y: -Infinity }); return; }
            var Y = st.sy(y);
            yAncora = Math.min(yAncora, Y);
            punct(st.strHover, X, Y, s.culoare, g.px(4), g.px(2));
            randuri.push({ culoare: s.culoare, valoare: st.spec.formatValoare(y, s), eticheta: s.eticheta, _y: y });
          });
          randuri.sort(function (a, b) { return b._y - a._y; });
          if (st.spec.randuriExtra) randuri = randuri.concat(st.spec.randuriExtra(x) || []);
          var antet = st.spec.formatAntetX ? st.spec.formatAntetX(x) : String(x);
          g.tooltip.arata(antet, randuri, X, isFinite(yAncora) ? yAncora : (st.L.y0 + st.L.y1) / 2);
        },
        ascunde: function () { if (g._linii) goleste(g._linii.strHover); }
      });
    }
    return g._linii;
  }

  /* Bare orizontale, simple sau suprapuse (segmente separate de un gol de 2px în culoarea
   * suprafeței). Capătul de date rotunjit la 4px, baza dreaptă, valoarea la vârful barei.
   * spec = {
   *   randuri: [{cheie, eticheta, segmente: [{valoare, culoare, clasa, nume}]}],
   *   formatValoare(v), textCapat(rand, i), titluAxa, eticheteSegmente (bool),
   *   tooltip(i) → {antet, randuri}
   * } */
  function bareOrizontale(ctx, g, spec) {
    var f = g.masoara();
    var cont = g.goleste();
    var R = spec.randuri || [], n = R.length;
    var gros = g.px(20), aer = g.px(10), rz = g.px(4), gol = g.px(1);
    var totaluri = R.map(function (r) {
      return r.segmente.reduce(function (s, x) { return s + (esteNumar(x.valoare) ? x.valoare : 0); }, 0);
    });
    var vmin = Math.min(0, minim(totaluri.concat([0]))), vmax = Math.max(0, maxim(totaluri.concat([0])));
    if (vmin === vmax) vmax = 1;
    var etCapat = R.map(function (r, i) { return spec.textCapat ? spec.textCapat(r, i) : spec.formatValoare(totaluri[i]); });
    var latCapat = maxim(etCapat.map(function (s) { return latimeText(s, f); }).concat([0])) + 10;
    var latEt = maxim(R.map(function (r) { return latimeText(r.eticheta, f); }).concat([0]));
    var deasupra = latEt > LATIME * 0.34;
    var sus = spec.titluAxa ? Math.round(f * 2.4) : Math.round(f * 0.6);
    var cuSegmente = spec.eticheteSegmente && !deasupra && n > 0;
    if (cuSegmente) sus += Math.round(f * 1.3);
    var banda = deasupra ? gros + aer + f + 4 : gros + aer;
    var x0 = deasupra ? 2 : Math.round(latEt + 12);
    if (vmin < 0) x0 += latCapat;
    var x1 = LATIME - (vmax > 0 ? latCapat : 4);
    var sx = scaraLiniara(vmin, vmax, x0, x1);
    var X0 = sx(0);
    var Hh = sus + n * banda + Math.round(f * 0.4);
    g.inaltime(Hh);

    if (spec.titluAxa) T(cont, 0, Math.round(f * 1.1), spec.titluAxa, 't-titlu-axa', { 'text-anchor': 'start' });
    var fundal = S('g', null, cont);
    var marcaje = S('g', null, cont);
    var geometrie = [];
    R.forEach(function (r, i) {
      var yB = sus + i * banda;
      var yBar = deasupra ? yB + f + 4 : yB + aer / 2;
      var yC = yBar + gros / 2;
      if (deasupra) T(marcaje, x0, yB + f, r.eticheta, 't-et', { 'text-anchor': 'start' });
      else T(marcaje, x0 - 8 - (vmin < 0 ? latCapat : 0), yC, r.eticheta, 't-et', { 'text-anchor': 'end', dy: '0.32em' });
      var segs = r.segmente.filter(function (s) { return esteNumar(s.valoare) && s.valoare !== 0; });
      var capatX = X0;
      if (segs.length === 1 && segs[0].valoare < 0) {
        var xs = sx(segs[0].valoare);
        S('path', { d: caleBara(xs, yBar, X0 - xs, gros, 'stanga', rz), 'class': 'w-bara ' + (segs[0].clasa || ''), style: segs[0].culoare ? 'fill:' + segs[0].culoare : null }, marcaje);
        capatX = xs;
        T(marcaje, xs - 6, yC, etCapat[i], 't-val', { 'text-anchor': 'end', dy: '0.32em' });
      } else {
        var cum = 0;
        var poz = segs.filter(function (s) { return s.valoare > 0; });
        poz.forEach(function (s, k) {
          /* golul de 2px dintre segmente: câte 1px din fiecare parte a graniței */
          var a = sx(cum) + (k > 0 ? gol : 0), b = sx(cum + s.valoare) - (k < poz.length - 1 ? gol : 0);
          cum += s.valoare;
          if (b - a < 0.5) return;
          S('path', {
            d: caleBara(a, yBar, b - a, gros, k === poz.length - 1 ? 'dreapta' : 'niciunul', rz),
            'class': 'w-bara ' + (s.clasa || ''), style: s.culoare ? 'fill:' + s.culoare : null
          }, marcaje);
          if (cuSegmente && i === 0 && s.nume) {
            var lw = latimeText(s.nume, f * 0.9);
            if (lw + 4 <= b - a) T(marcaje, a, yBar - 5, s.nume, 't-mut t-mic', { 'text-anchor': 'start' });
          }
        });
        capatX = sx(cum);
        T(marcaje, capatX + 6, yC, etCapat[i], 't-val', { 'text-anchor': 'start', dy: '0.32em' });
      }
      geometrie.push({ yB: yB, yC: yC, capatX: capatX });
    });
    var ax = S('g', { 'class': 'axa' }, cont);
    S('line', { x1: r1(X0), x2: r1(X0), y1: sus - 2, y2: Hh - Math.round(f * 0.4) }, ax);

    g._bare = { n: n, sus: sus, banda: banda, geometrie: geometrie, fundal: fundal, spec: spec };
    if (!g._interBare) {
      g._interBare = true;
      interactiune(g, {
        n: function () { return g._bare ? g._bare.n : 0; },
        implicit: function () { return 0; },
        sus: -1,
        index: function (ux, uy) {
          var st = g._bare;
          var i = Math.floor((uy - st.sus) / st.banda);
          return i >= 0 && i < st.n ? i : -1;
        },
        arata: function (i) {
          var st = g._bare, gm = st.geometrie[i];
          goleste(st.fundal);
          S('rect', { 'class': 'w-banda', x: 0, y: r1(gm.yB), width: LATIME, height: r1(st.banda), rx: 4 }, st.fundal);
          var t = st.spec.tooltip(i);
          g.tooltip.arata(t.antet, t.randuri, gm.capatX, gm.yC);
        },
        ascunde: function () { if (g._bare) goleste(g._bare.fundal); }
      });
    }
    return g._bare;
  }

  var G = {};
  for (var k in pur) G[k] = pur[k];
  var dom = {
    S: S, H: H, T: T, golesteNod: goleste, TX: TX, fmtN: fmtN, cadru: cadru, sursa: sursa, observa: observa,
    graficNou: graficNou, interactiune: interactiune, legenda: legenda, mostra: mostra, tabel: tabel,
    vizualizareTabel: vizualizareTabel, cursor: cursor, dale: dale, concluzie: concluzie,
    anuntator: anuntator, punct: punct, axaY: axaY, axaX: axaX, linii: linii, bareOrizontale: bareOrizontale,
    r1: r1
  };
  for (var d in dom) G[d] = dom[d];
  radacina.AtelierGrafic = G;
  if (radacina.Atelier) radacina.Atelier.grafic = G;
})(typeof window !== 'undefined' ? window : this);
