/* clasament.js — aceleași entități (țări, regiuni, spitale), clasate după doi sau mai mulți
 * indicatori REALI, fiecare extras la construcție din propriul fișier brut (date_sursa.py).
 * Exemplul tipic: rata brută și rata standardizată a mortalității — ordinea se poate inversa.
 *
 * Comutatorul alege indicatorul; rândurile își schimbă locul printr-o animație FLIP (Web
 * Animations, dacă browserul o are). Pozițiile finale sunt atribute SVG obișnuite, deci
 * tipărirea, cititoarele de ecran și verificarea geometriei văd starea reală, nu animația.
 * Numerele de ordine (1, 2, …) rămân fixe; entitățile se mută între ele. Culoarea urmează
 * entitatea (slotul ei în listă), niciodată rangul.
 *
 * cfg = { valori: "reale", indicatori: [{cheie, eticheta, eticheta_text, unitate_scurta,
 *         zecimale, categorii: [{cheie, eticheta, valoare}]} | {…, valori: {cheie: v}}],
 *         entitati: [{cheie, eticheta}] (opțional; altfel, din categoriile primului indicator),
 *         afirmatii, sursa_text }
 */
(function () {
  'use strict';

  function esteNumar(x) { return typeof x === 'number' && isFinite(x); }
  function limiteaza(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function numar(x, i) { return esteNumar(x) ? x : i; }

  var T = {
    graficEticheta: { ro: '{ind}: {n}{de} entități în ordine descrescătoare', en: '{ind}: {n} entities in descending order' },
    graficDesc: {
      ro: 'Bare orizontale ordonate descrescător după indicatorul ales; numerele din stânga arată locul în clasament. Valorile exacte sunt în tabelul de sub grafic.',
      en: 'Horizontal bars in descending order of the chosen indicator; the numbers on the left show the rank. The exact values are in the table below the chart.'
    },
    alege: { ro: 'Indicatorul după care se face clasamentul', en: 'Indicator used for the ranking' },
    inversare: { ro: 'Ordinea se inversează: după {i1}, pe primul loc se află {a}; după {i2}, {b}.', en: 'The ranking reverses: by {i1}, {a} comes first; by {i2}, {b} does.' },
    aceeasi: { ro: 'Ordinea este aceeași după toți indicatorii.', en: 'The ranking is the same for every indicator.' },
    tabel: { ro: 'Valorile indicatorilor', en: 'Indicator values' },
    entitate: { ro: 'Entitatea', en: 'Entity' },
    locul: { ro: 'locul {n}', en: 'rank {n}' },
    anunt: { ro: 'Clasament după {ind}: {ordine}.', en: 'Ranking by {ind}: {ordine}.' },
    faraDate: { ro: 'Fără date de afișat', en: 'No data to show' }
  };

  var M = {
    faraIndicatori: { ro: 'Configurația nu conține niciun indicator.', en: 'The configuration contains no indicator.' },
    faraEntitati: { ro: 'Configurația nu conține nicio entitate de comparat.', en: 'The configuration contains no entity to compare.' },
    preaMulte: { ro: 'Se afișează cel mult 8 entități (paleta are 8 culori).', en: 'At most 8 entities are shown (the palette has 8 colours).' },
    valoareLipsa: { ro: 'Unele valori lipsesc și sunt afișate ca „—”.', en: 'Some values are missing and are shown as “—”.' }
  };

  function sablon(text, v) {
    return String(text == null ? '' : text).replace(/\{([A-Za-z0-9_]+)\}/g, function (m, k) { return v && v[k] != null ? String(v[k]) : m; });
  }

  var calc = {
    texte: T,
    mesaje: M,

    normalizeaza: function (cfg) {
      cfg = cfg || {};
      var mesaje = [];
      var brute = (Array.isArray(cfg.indicatori) ? cfg.indicatori : []).filter(function (i) { return i && typeof i === 'object'; });
      if (!brute.length) mesaje.push(M.faraIndicatori);
      var ent = [], vazut = {};
      function adauga(cheie, eticheta) {
        if (cheie == null) return;
        var c = String(cheie);
        if (vazut[c]) return;
        vazut[c] = 1;
        ent.push({ cheie: c, eticheta: eticheta != null ? eticheta : c });
      }
      (Array.isArray(cfg.entitati) ? cfg.entitati : []).forEach(function (e) { if (e) adauga(e.cheie, e.eticheta); });
      brute.forEach(function (i) {
        (Array.isArray(i.categorii) ? i.categorii : []).forEach(function (c) { if (c) adauga(c.cheie, c.eticheta); });
        if (i.valori && typeof i.valori === 'object') Object.keys(i.valori).forEach(function (k) { adauga(k, k); });
      });
      if (!ent.length && brute.length) mesaje.push(M.faraEntitati);
      if (ent.length > 8) { mesaje.push(M.preaMulte); ent = ent.slice(0, 8); }
      ent.forEach(function (e, k) { e.slot = k; });
      var lipsa = false;
      var indicatori = brute.map(function (i, k) {
        var v = {};
        (Array.isArray(i.categorii) ? i.categorii : []).forEach(function (c) {
          if (c && c.cheie != null) v[String(c.cheie)] = esteNumar(c.valoare) ? c.valoare : null;
        });
        if (i.valori && typeof i.valori === 'object') {
          Object.keys(i.valori).forEach(function (c) { v[c] = esteNumar(i.valori[c]) ? i.valori[c] : null; });
        }
        ent.forEach(function (e) { if (!esteNumar(v[e.cheie])) { v[e.cheie] = null; lipsa = true; } });
        return {
          cheie: i.cheie != null ? String(i.cheie) : 'i' + (k + 1),
          eticheta: i.eticheta != null ? i.eticheta : String(k + 1),
          etichetaText: i.eticheta_text != null ? i.eticheta_text : null,
          unitate: i.unitate_scurta || '',
          zecimale: Math.round(limiteaza(numar(i.zecimale, 1), 0, 4)),
          valori: v
        };
      });
      if (lipsa && ent.length) mesaje.push(M.valoareLipsa);
      return { indicatori: indicatori, entitati: ent, mesaje: mesaje };
    },

    /* Cheile entităților în ordinea descrescătoare a indicatorului k; valorile lipsă la
     * sfârșit; la egalitate, ordinea din configurație (sortare stabilă). */
    ordine: function (d, k) {
      var ind = d.indicatori[k];
      if (!ind) return d.entitati.map(function (e) { return e.cheie; });
      return d.entitati.map(function (e, i) { return { c: e.cheie, v: ind.valori[e.cheie], i: i }; })
        .sort(function (a, b) {
          var av = esteNumar(a.v), bv = esteNumar(b.v);
          if (av && bv && a.v !== b.v) return b.v - a.v;
          if (av !== bv) return av ? -1 : 1;
          return a.i - b.i;
        })
        .map(function (x) { return x.c; });
    },

    primul: function (d, k) { return calc.ordine(d, k)[0] || null; },

    /* Primul indicator (după cel de referință 0) care schimbă liderul; -1 dacă nu există. */
    indicatorInversare: function (d) {
      var p = calc.primul(d, 0);
      for (var k = 1; k < d.indicatori.length; k++) if (calc.primul(d, k) !== p) return k;
      return -1;
    }
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = calc; return; }

  function monteaza(el, cfg, ctx) {
    var G = (window.Atelier && window.Atelier.grafic) || window.AtelierGrafic;
    if (!G) throw new Error('grafic.js nu este încărcat');
    var t = ctx.t;
    var cad = G.cadru(el, cfg, ctx);
    var d = calc.normalizeaza(cfg);
    cad.mesaje(d.mesaje);
    var activ = 0;
    var eticheta = {};
    d.entitati.forEach(function (e) { eticheta[e.cheie] = t(e.eticheta); });
    function textInd(ind) {
      if (ind.etichetaText) return t(ind.etichetaText);
      var s = t(ind.eticheta);
      return s.charAt(0).toLowerCase() + s.slice(1);
    }
    function valText(ind, v) { return esteNumar(v) ? G.cuUnitate(G.fmtN(ctx, v, ind.zecimale), t(ind.unitate)) : '—'; }

    var sel = G.H('div', { 'class': 'w-segmentat', role: 'group', 'aria-label': t(T.alege) }, cad.corp);
    var butoane = d.indicatori.map(function (ind, k) {
      var b = G.H('button', { type: 'button', 'aria-pressed': k === activ ? 'true' : 'false' }, sel, t(ind.eticheta));
      b.addEventListener('click', function () {
        if (activ === k) return;
        activ = k;
        butoane.forEach(function (x, j) { x.setAttribute('aria-pressed', j === k ? 'true' : 'false'); });
        deseneaza(true);
        var ord = calc.ordine(d, activ).map(function (c) { return eticheta[c]; });
        ctx.anunta(sablon(t(T.anunt), { ind: textInd(ind), ordine: ord.join(', ') }));
      });
      return b;
    });
    var g = G.graficNou(ctx, cad.corp, { inaltime: 140 });
    var conc = G.concluzie(cad.corp);
    var k1 = calc.indicatorInversare(d);
    if (d.indicatori.length > 1 && d.entitati.length > 1) {
      conc.seteaza(k1 > 0
        ? sablon(t(T.inversare), { i1: textInd(d.indicatori[0]), a: eticheta[calc.primul(d, 0)], i2: textInd(d.indicatori[k1]), b: eticheta[calc.primul(d, k1)] })
        : t(T.aceeasi));
    } else conc.seteaza('');
    G.vizualizareTabel(ctx, cad.corp, function () {
      return G.tabel({
        legenda: t(T.tabel),
        antete: [[{ text: t(T.entitate) }].concat(d.indicatori.map(function (ind) { return { text: t(ind.eticheta), num: true }; }))],
        randuri: d.entitati.map(function (e) {
          return [{ text: eticheta[e.cheie], antet: true }].concat(d.indicatori.map(function (ind) {
            return { text: valText(ind, ind.valori[e.cheie]), num: true };
          }));
        })
      });
    });

    var R = null, geom = null;

    /* animație FLIP: de la poziția veche la cea nouă, numai dacă browserul are Web Animations */
    function anima(nod, cadre) {
      if (!nod || typeof nod.animate !== 'function') return;
      try { nod.animate(cadre, { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' }); } catch (err) { /* opțională */ }
    }

    function deseneaza(animat) {
      var f = g.masoara();
      var ind = d.indicatori[activ];
      if (!ind || !d.entitati.length) {
        g.goleste();
        R = null;
        g.descrie(t(T.faraDate), t(T.faraDate));
        return;
      }
      var ord = calc.ordine(d, activ);
      var n = ord.length;
      var gros = g.px(22), aer = g.px(16), rz = g.px(4);
      var banda = gros + aer;
      var latEt = 0, latVal = 0;
      d.entitati.forEach(function (e) {
        latEt = Math.max(latEt, G.latimeText(eticheta[e.cheie], f));
        d.indicatori.forEach(function (i) { latVal = Math.max(latVal, G.latimeText(valText(i, i.valori[e.cheie]), f)); });
      });
      var latRang = G.latimeText(String(n), f) + 6;
      var x0 = Math.round(latRang + 10 + latEt + 10), x1 = G.LATIME - Math.round(latVal + 12);
      var sus = Math.round(f * 0.5);
      var Hh = Math.round(sus + n * banda + f * 0.3);
      var vmax = 0;
      d.entitati.forEach(function (e) { var v = ind.valori[e.cheie]; if (esteNumar(v)) vmax = Math.max(vmax, v); });
      if (vmax <= 0) vmax = 1;
      var sx = G.scaraLiniara(0, vmax, x0, x1);
      g.inaltime(Hh);
      var vechi = null;
      if (animat && R) {
        vechi = {};
        Object.keys(R.randuri).forEach(function (c) { vechi[c] = { y: R.randuri[c].y, capat: R.randuri[c].capat }; });
      } else {
        var cont = g.goleste();
        var fundal = G.S('g', null, cont);
        var ranguri = G.S('g', null, cont);
        for (var r = 0; r < n; r++) {
          var yc = sus + r * banda + aer / 2 + gros / 2;
          G.T(ranguri, latRang, yc, String(r + 1), 't-mut w-rang', { 'text-anchor': 'end', dy: '0.32em' });
        }
        var ax = G.S('g', { 'class': 'axa' }, cont);
        G.S('line', { x1: G.r1(x0), x2: G.r1(x0), y1: sus - 2, y2: G.r1(Hh - f * 0.3) }, ax);
        R = { fundal: fundal, randuri: {} };
        d.entitati.forEach(function (e) {
          var grup = G.S('g', { 'class': 'w-rand' }, cont);
          R.randuri[e.cheie] = {
            grup: grup,
            et: G.T(grup, 0, 0, eticheta[e.cheie], 't-et', { 'text-anchor': 'end', dy: '0.32em' }),
            bara: G.S('path', { 'class': 'w-bara w-bara-cl', style: 'fill:' + ctx.culoareSerie(e.slot) }, grup),
            val: G.T(grup, 0, 0, '', 't-val', { 'text-anchor': 'start', dy: '0.32em' }),
            y: null, capat: null
          };
        });
      }
      geom = { sus: sus, banda: banda, n: n, ord: ord, randuri: [] };
      ord.forEach(function (c, i) {
        var o = R.randuri[c];
        var yBar = sus + i * banda + aer / 2, yC = yBar + gros / 2;
        var v = ind.valori[c];
        var capat = esteNumar(v) && v > 0 ? sx(v) : x0;
        o.et.setAttribute('x', G.r1(x0 - 10));
        o.et.setAttribute('y', G.r1(yC));
        o.bara.setAttribute('d', capat - x0 >= 0.5 ? G.caleBara(x0, yBar, capat - x0, gros, 'dreapta', rz) : 'M' + G.r1(x0) + ' ' + G.r1(yBar));
        o.val.setAttribute('x', G.r1(capat + 6));
        o.val.setAttribute('y', G.r1(yC));
        o.val.textContent = valText(ind, v);
        if (vechi && vechi[c] && vechi[c].y != null) {
          var dy = vechi[c].y - yC;
          if (Math.abs(dy) > 0.5) anima(o.grup, [{ transform: 'translate(0px,' + G.r1(dy) + 'px)' }, { transform: 'translate(0px,0px)' }]);
          var w0 = vechi[c].capat - x0, w1 = capat - x0;
          if (w1 > 0.5 && Math.abs(w0 - w1) > 0.5) anima(o.bara, [{ transform: 'scaleX(' + Math.max(0.02, w0 / w1) + ')' }, { transform: 'scaleX(1)' }]);
          if (Math.abs(vechi[c].capat - capat) > 0.5) anima(o.val, [{ transform: 'translate(' + G.r1(vechi[c].capat - capat) + 'px,0px)' }, { transform: 'translate(0px,0px)' }]);
        }
        o.y = yC;
        o.capat = capat;
        geom.randuri.push({ yB: sus + i * banda, yC: yC, capat: capat, cheie: c });
      });
      g.descrie(sablon(t(T.graficEticheta), { ind: t(ind.eticheta), n: G.fmtN(ctx, n, 0), de: G.de(n) }), t(T.graficDesc));
    }

    G.interactiune(g, {
      n: function () { return geom ? geom.n : 0; },
      implicit: function () { return 0; },
      sus: -1,
      index: function (ux, uy) {
        if (!geom) return -1;
        var i = Math.floor((uy - geom.sus) / geom.banda);
        return i >= 0 && i < geom.n ? i : -1;
      },
      arata: function (i) {
        if (!geom || !R) return;
        var gm = geom.randuri[i];
        G.golesteNod(R.fundal);
        G.S('rect', { 'class': 'w-banda', x: 0, y: G.r1(gm.yB), width: G.LATIME, height: G.r1(geom.banda), rx: 4 }, R.fundal);
        var e = d.entitati.filter(function (x) { return x.cheie === gm.cheie; })[0];
        g.tooltip.arata(eticheta[gm.cheie] + ' · ' + sablon(t(T.locul), { n: i + 1 }), d.indicatori.map(function (ind) {
          return { culoare: ctx.culoareSerie(e.slot), valoare: valText(ind, ind.valori[gm.cheie]), eticheta: t(ind.eticheta) };
        }), gm.capat, gm.yC);
      },
      ascunde: function () { if (R) G.golesteNod(R.fundal); }
    });

    deseneaza(false);
    g.laRedimensionare(function () { deseneaza(false); });
    cad.incheie();
  }

  window.Atelier.inregistreaza('clasament', { calc: calc, monteaza: monteaza });
})();
