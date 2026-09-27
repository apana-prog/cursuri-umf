/* piramida.js — piramida vârstelor: bărbați la stânga, femei la dreapta, scară simetrică comună.
 *
 * Date: „grupe” (de la cea mai tânără) și fie „barbati”/„femei”, fie „ani”: {an: {barbati, femei}}
 * cu selector de an. Valorile din configurație sunt efective (persoane); cu unitate „procent”
 * se afișează ca procent din populația totală a anului (bărbați + femei, toate vârstele).
 * Scara X e aceeași pentru toți anii (maximul peste ani și sexe), ca schimbarea să se vadă.
 * „suprapunere”: un an desenat ca contur peste anul afișat, pentru comparație.
 */
(function () {
  'use strict';

  function esteNumar(x) { return typeof x === 'number' && isFinite(x); }
  function numar(x, i) { return esteNumar(x) ? x : i; }
  function limiteaza(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function suma(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function r1(v) { var r = Math.round(v * 10) / 10; return r === 0 ? 0 : r; }
  function alege(d, l) {
    if (d == null) return '';
    if (typeof d === 'string') return d;
    return d[l] != null ? d[l] : (d.ro != null ? d.ro : (d.en || ''));
  }

  var T = {
    barbati: { ro: 'Bărbați', en: 'Men' },
    femei: { ro: 'Femei', en: 'Women' },
    anul: { ro: 'Anul afișat', en: 'Year shown' },
    grupa: { ro: 'Grupa de vârstă', en: 'Age group' },
    contur: { ro: 'Contur: {an}', en: 'Outline: {an}' },
    bf: { ro: '{an}: bărbați / femei', en: '{an}: men / women' },
    total: { ro: 'Total', en: 'Total' },
    tineri: { ro: '0–14 ani', en: 'Aged 0–14' },
    activi: { ro: '15–64 ani', en: 'Aged 15–64' },
    varstnici: { ro: '65 de ani și peste', en: 'Aged 65 and over' },
    dependenta: { ro: 'Raportul de dependență', en: 'Dependency ratio' },
    subDependenta: { ro: 'persoane 0–14 și 65+ la 100 de persoane 15–64', en: 'people aged 0–14 and 65+ per 100 aged 15–64' },
    dinTotal: { ro: 'din populația totală', en: 'of the total population' },
    inAnul: { ro: 'în {an}: {v}', en: 'in {an}: {v}' },
    graficEticheta: { ro: 'Piramida vârstelor{an}: bărbați la stânga, femei la dreapta', en: 'Population pyramid{an}: men on the left, women on the right' },
    graficDesc: {
      ro: 'Bare orizontale pe grupe de vârstă, de la cea mai tânără (jos) la cea mai vârstnică (sus).',
      en: 'Horizontal bars by age group, from the youngest (bottom) to the oldest (top).'
    },
    graficDescContur: { ro: 'Conturul arată anul {an}.', en: 'The outline shows {an}.' },
    tabel: { ro: 'Populația pe grupe de vârstă și sexe ({u})', en: 'Population by age group and sex ({u})' },
    uProcent: { ro: '% din populația totală a anului', en: '% of the year’s total population' },
    uPersoane: { ro: 'persoane', en: 'people' },
    anuntStructura: { ro: 'Anul {an}: 65 de ani și peste — {v} din populație.', en: 'Year {an}: aged 65 and over — {v} of the population.' },
    anuntMaxim: { ro: 'Anul {an}: cea mai numeroasă grupă este {g} ({sex}, {v}).', en: 'Year {an}: the largest group is {g} ({sex}, {v}).' }
  };

  var M = {
    faraGrupe: { ro: 'Lipsesc grupele de vârstă.', en: 'The age groups are missing.' },
    faraDate: { ro: 'Lipsesc datele pentru bărbați și femei.', en: 'The data for men and women are missing.' },
    lungimi: { ro: 'Numărul de valori nu corespunde numărului de grupe; valorile lipsă au fost puse 0.', en: 'The number of values does not match the number of groups; missing values were set to 0.' },
    negativ: { ro: 'Valorile nu pot fi negative; au fost puse 0.', en: 'Values cannot be negative; they were set to 0.' },
    unitate: { ro: 'Unitatea trebuie să fie „procent” sau „persoane”; s-a folosit „procent”.', en: 'The unit must be “procent” or “persoane”; “procent” was used.' },
    suprapunere: { ro: 'Anul de suprapunere nu există în date; conturul a fost omis.', en: 'The overlay year is not in the data; the outline was omitted.' }
  };

  function tablou(x) { return Array.isArray(x) ? x : []; }

  var calc = {
    texte: T,
    mesaje: M,

    normalizeaza: function (cfg) {
      cfg = cfg || {};
      var mesaje = [];
      function msg(m) { if (mesaje.indexOf(m) < 0) mesaje.push(m); }
      var grupe = tablou(cfg.grupe).slice();
      var sursa = {};
      if (cfg.ani && typeof cfg.ani === 'object' && !Array.isArray(cfg.ani)) {
        Object.keys(cfg.ani).forEach(function (k) { if (cfg.ani[k] && typeof cfg.ani[k] === 'object') sursa[k] = cfg.ani[k]; });
      } else if (cfg.barbati || cfg.femei) {
        sursa[''] = { barbati: cfg.barbati, femei: cfg.femei };
      }
      var chei = Object.keys(sursa);
      if (!chei.length) { msg(M.faraDate); sursa[''] = { barbati: [], femei: [] }; chei = ['']; }
      var n = grupe.length;
      if (!n) {
        chei.forEach(function (k) { n = Math.max(n, tablou(sursa[k].barbati).length, tablou(sursa[k].femei).length); });
        for (var i = 0; i < n; i++) grupe.push(String(i + 1));
        msg(M.faraGrupe);
      }
      var ani = {};
      chei.forEach(function (k) {
        var o = {};
        ['barbati', 'femei'].forEach(function (s) {
          var a = tablou(sursa[k][s]);
          if (a.length !== n) msg(M.lungimi);
          var v = [];
          for (var i = 0; i < n; i++) {
            var x = numar(a[i], 0);
            if (x < 0) { msg(M.negativ); x = 0; }
            v.push(x);
          }
          o[s] = v;
        });
        ani[k] = o;
      });
      var unitate = cfg.unitate == null ? 'procent' : cfg.unitate;
      if (unitate !== 'procent' && unitate !== 'persoane') { msg(M.unitate); unitate = 'procent'; }
      var sup = cfg.suprapunere != null ? String(cfg.suprapunere) : null;
      if (sup != null && !ani.hasOwnProperty(sup)) { msg(M.suprapunere); sup = null; }
      var init = cfg.an_initial != null && ani.hasOwnProperty(String(cfg.an_initial)) ? String(cfg.an_initial) : null;
      if (init == null) init = chei.filter(function (k) { return k !== sup; })[0] || chei[0];
      var zImplicit = unitate === 'procent' ? 1 : 0;
      return {
        grupe: grupe, ani: ani, chei: chei, unitate: unitate, suprapunere: sup, anInitial: init,
        zecimale: Math.round(limiteaza(numar(cfg.zecimale, zImplicit), 0, 3)), mesaje: mesaje
      };
    },

    total: function (date) { return suma(date.barbati) + suma(date.femei); },

    /* Valorile de afișat: procent din totalul anului sau persoane. */
    afisate: function (date, unitate) {
      if (unitate !== 'procent') return { barbati: date.barbati.slice(), femei: date.femei.slice() };
      var tot = calc.total(date);
      function p(v) { return tot > 0 ? 100 * v / tot : 0; }
      return { barbati: date.barbati.map(p), femei: date.femei.map(p) };
    },

    /* Maximul peste toți anii și ambele sexe — scara comună, simetrică. */
    maximGlobal: function (norm) {
      var m = 0;
      norm.chei.forEach(function (k) {
        var a = calc.afisate(norm.ani[k], norm.unitate);
        a.barbati.concat(a.femei).forEach(function (v) { if (v > m) m = v; });
      });
      return m;
    },

    grupaMaxima: function (valori) {
      var b = { i: -1, sex: null, v: -Infinity };
      ['barbati', 'femei'].forEach(function (s) {
        valori[s].forEach(function (v, i) { if (v > b.v) b = { i: i, sex: s, v: v }; });
      });
      return b;
    },

    /* Limitele inferioare ale grupelor („0–4” → 0, „85+” → 85); null dacă nu se pot citi. */
    limiteInferioare: function (grupe) {
      var lim = [];
      for (var i = 0; i < grupe.length; i++) {
        var m = String(alege(grupe[i], 'ro')).match(/^\s*(\d+)/);
        if (!m) return null;
        lim.push(parseInt(m[1], 10));
        if (i && lim[i] <= lim[i - 1]) return null;
      }
      return lim;
    },

    /* Ponderile 0–14, 15–64, 65+ și raportul de dependență; null dacă grupele nu au limite la 15 și 65. */
    structura: function (grupe, date) {
      var lim = calc.limiteInferioare(grupe);
      if (!lim || lim[0] !== 0 || lim.indexOf(15) < 0 || lim.indexOf(65) < 0) return null;
      var tot = 0, t0 = 0, t65 = 0;
      for (var i = 0; i < lim.length; i++) {
        var v = date.barbati[i] + date.femei[i];
        tot += v;
        if (lim[i] < 15) t0 += v; else if (lim[i] >= 65) t65 += v;
      }
      var activi = tot - t0 - t65;
      if (!(tot > 0)) return null;
      return { tineri: t0 / tot, activi: activi / tot, varstnici: t65 / tot, dependenta: activi > 0 ? (t0 + t65) / activi : null };
    },

    /* Conturul în trepte al unei jumătăți: valori[i] de jos în sus; fx(v) → x; ySus(i) → marginea de sus a benzii i; h = înălțimea benzii. */
    caleContur: function (valori, fx, ySus, h) {
      var d = '';
      for (var i = 0; i < valori.length; i++) {
        var x = r1(fx(valori[i])), yB = r1(ySus(i) + h), yT = r1(ySus(i));
        d += (i === 0 ? 'M' + x + ' ' + yB : 'H' + x) + 'V' + yT;
      }
      return d;
    }
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = calc; return; }

  function monteaza(el, cfg, ctx) {
    var G = (window.Atelier && window.Atelier.grafic) || window.AtelierGrafic;
    if (!G) throw new Error('grafic.js nu este încărcat');
    var H = G.H, S = G.S, t = ctx.t;
    var cad = G.cadru(el, cfg, ctx);
    var d = calc.normalizeaza(cfg);
    cad.mesaje(d.mesaje);
    var zec = d.zecimale, procent = d.unitate === 'procent';
    var fmt = function (x, z) { return G.fmtN(ctx, x, z); };
    function fv(v) { return procent ? G.cuUnitate(fmt(v, zec), '%') : fmt(v, zec); }
    var anCurent = d.anInitial;
    var vmaxGlobal = calc.maximGlobal(d);
    var anunt = G.anuntator(ctx, 200);
    var stare = null;
    var n = d.grupe.length;
    var grupe = d.grupe.map(function (x) { return t(x); });

    var zonaAni = null, butoane = {};
    if (d.chei.length > 1) {
      zonaAni = H('div', { 'class': 'w-ani', role: 'group', 'aria-label': t(T.anul) }, cad.corp);
      d.chei.forEach(function (k) {
        var b = H('button', { type: 'button', 'class': 'w-buton-an', 'aria-pressed': k === anCurent ? 'true' : 'false' }, zonaAni, k);
        butoane[k] = b;
        b.addEventListener('click', function () {
          if (k === anCurent) return;
          anCurent = k;
          for (var j in butoane) butoane[j].setAttribute('aria-pressed', j === k ? 'true' : 'false');
          actualizeaza(true);
        });
      });
    }
    var dl = G.dale(cad.corp);
    var zonaLeg = H('div', null, cad.corp);
    var g = G.graficNou(ctx, cad.corp, { inaltime: 360 });
    var tv = G.vizualizareTabel(ctx, cad.corp, function () {
      var a = calc.afisate(d.ani[anCurent], d.unitate);
      var sup = conturActiv() ? calc.afisate(d.ani[d.suprapunere], d.unitate) : null;
      var z = procent ? Math.max(zec, 2) : G.zecimaleNecesare(d.ani[anCurent].barbati.concat(d.ani[anCurent].femei), 2);
      var ante = [{ text: t(T.grupa) }, { text: t(T.barbati) + (anCurent ? ' ' + anCurent : ''), num: true },
                  { text: t(T.femei) + (anCurent ? ' ' + anCurent : ''), num: true }];
      if (sup) ante.push({ text: t(T.barbati) + ' ' + d.suprapunere, num: true }, { text: t(T.femei) + ' ' + d.suprapunere, num: true });
      var randuri = grupe.map(function (gr, i) {
        var r = [{ text: gr, antet: true }, { text: fmt(a.barbati[i], z), num: true }, { text: fmt(a.femei[i], z), num: true }];
        if (sup) r.push({ text: fmt(sup.barbati[i], z), num: true }, { text: fmt(sup.femei[i], z), num: true });
        return r;
      });
      var tot = [{ text: t(T.total), antet: true }, { text: fmt(a.barbati.reduce(function (x, y) { return x + y; }, 0), z), num: true },
                 { text: fmt(a.femei.reduce(function (x, y) { return x + y; }, 0), z), num: true }];
      if (sup) tot.push({ text: fmt(sup.barbati.reduce(function (x, y) { return x + y; }, 0), z), num: true },
                        { text: fmt(sup.femei.reduce(function (x, y) { return x + y; }, 0), z), num: true });
      randuri.push(tot);
      return G.tabel({ legenda: G.sablon(t(T.tabel), { u: t(procent ? T.uProcent : T.uPersoane) }), antete: [ante], randuri: randuri });
    });

    function conturActiv() { return d.suprapunere != null && d.suprapunere !== anCurent; }

    function legenda() {
      G.golesteNod(zonaLeg);
      var art = [
        { cheie: 'b', eticheta: t(T.barbati), culoare: ctx.culoareSerie(0) },
        { cheie: 'f', eticheta: t(T.femei), culoare: ctx.culoareSerie(1) }
      ];
      if (conturActiv()) art.push({ cheie: 'c', eticheta: G.sablon(t(T.contur), { an: d.suprapunere }), culoare: 'var(--ink-2)', forma: 'contur' });
      G.legenda(ctx, zonaLeg, art);
    }

    function dale() {
      var s = calc.structura(d.grupe, d.ani[anCurent]);
      if (!s) { dl.seteaza([]); return; }
      var s2 = conturActiv() ? calc.structura(d.grupe, d.ani[d.suprapunere]) : null;
      function sub(camp, f) { return s2 ? G.sablon(t(T.inAnul), { an: d.suprapunere, v: f(s2[camp]) }) : t(T.dinTotal); }
      var p = function (x) { return ctx.fmtProc(x, 1); };
      var r = function (x) { return fmt(x == null ? null : x * 100, 1); };
      dl.seteaza([
        { et: t(T.tineri), val: p(s.tineri), sub: sub('tineri', p) },
        { et: t(T.activi), val: p(s.activi), sub: sub('activi', p) },
        { et: t(T.varstnici), val: p(s.varstnici), sub: sub('varstnici', p) },
        { et: t(T.dependenta), val: r(s.dependenta), sub: s2 ? G.sablon(t(T.inAnul), { an: d.suprapunere, v: r(s2.dependenta) }) : t(T.subDependenta) }
      ]);
    }

    function deseneaza() {
      var f = g.masoara(), cont = g.goleste();
      var a = calc.afisate(d.ani[anCurent], d.unitate);
      var sup = conturActiv() ? calc.afisate(d.ani[d.suprapunere], d.unitate) : null;
      var banda = Math.max(Math.round(f * 1.3), 12);
      var gros = Math.min(banda - g.px(2), g.px(22));
      var sus = Math.round(f * 2.2), jos = Math.round(f * 2 + 8);
      var Hh = sus + n * banda + jos;
      g.inaltime(Hh);
      var latG = G.maxim(grupe.map(function (x) { return G.latimeText(x, f); }).concat([f * 2]));
      var gutter = Math.round(latG + 14);
      var cx = G.LATIME / 2;
      var tX = G.tickuriFrumoase(0, vmaxGlobal > 0 ? vmaxGlobal : 1, Math.max(2, Math.round(40 / f)));
      var fmtT = function (v) { return procent ? G.cuUnitate(fmt(v, tX.zecimale), '%') : fmt(v, tX.zecimale); };
      var latT = G.maxim(tX.valori.map(function (v) { return G.latimeText(fmtT(v), f); }));
      /* marginea exterioară lasă loc jumătății etichetei ultimei gradații, centrată pe ea */
      var margine = Math.max(6, Math.ceil(latT / 2) + 2);
      var jum = cx - gutter / 2 - margine;
      var k = jum / tX.max;
      function xM(v) { return cx - gutter / 2 - v * k; }
      function xF(v) { return cx + gutter / 2 + v * k; }
      function ySus(i) { return sus + (n - 1 - i) * banda; }
      var fundal = S('g', null, cont);
      var gr = S('g', { 'class': 'grila' }, cont);
      var et = S('g', null, cont);
      var yAx = sus + n * banda;
      var pas = Math.max(1, Math.ceil((latT + 8) / (tX.pas * k)));
      tX.valori.forEach(function (v, j) {
        [xM(v), xF(v)].forEach(function (x, s) {
          if (v > 0) S('line', { x1: r1(x), x2: r1(x), y1: sus, y2: yAx }, gr);
          if (j % pas === 0 && !(v === 0 && s === 1)) {
            G.T(et, v === 0 ? cx : x, yAx + f + 5, fmtT(v), 't-mut', { 'text-anchor': 'middle' });
          }
        });
      });
      var ax = S('g', { 'class': 'axa' }, cont);
      S('line', { x1: r1(xM(tX.max)), x2: r1(xM(0)), y1: yAx, y2: yAx }, ax);
      S('line', { x1: r1(xF(0)), x2: r1(xF(tX.max)), y1: yAx, y2: yAx }, ax);
      G.T(et, xM(0) - 2, sus - 7, t(T.barbati), 't-et', { 'text-anchor': 'end' });
      G.T(et, xF(0) + 2, sus - 7, t(T.femei), 't-et', { 'text-anchor': 'start' });
      var marcaje = S('g', null, cont);
      for (var i = 0; i < n; i++) {
        var y = ySus(i) + (banda - gros) / 2;
        var vm = a.barbati[i], vf = a.femei[i];
        if (vm > 0) S('path', { d: G.caleBara(xM(vm), y, xM(0) - xM(vm), gros, 'stanga', g.px(4)), 'class': 'w-bara', style: 'fill:' + ctx.culoareSerie(0) }, marcaje);
        if (vf > 0) S('path', { d: G.caleBara(xF(0), y, xF(vf) - xF(0), gros, 'dreapta', g.px(4)), 'class': 'w-bara', style: 'fill:' + ctx.culoareSerie(1) }, marcaje);
        G.T(marcaje, cx, ySus(i) + banda / 2, grupe[i], 't-et t-mic', { 'text-anchor': 'middle', dy: '0.32em' });
      }
      if (sup) {
        S('path', { d: calc.caleContur(sup.barbati, xM, ySus, banda), 'class': 'w-contur' }, cont);
        S('path', { d: calc.caleContur(sup.femei, xF, ySus, banda), 'class': 'w-contur' }, cont);
      }
      stare = { a: a, sup: sup, sus: sus, banda: banda, ySus: ySus, xM: xM, xF: xF, fundal: fundal };
      var desc = t(T.graficDesc) + (sup ? ' ' + G.sablon(t(T.graficDescContur), { an: d.suprapunere }) : '');
      g.descrie(G.sablon(t(T.graficEticheta), { an: anCurent ? ' ' + anCurent : '' }), desc);
    }

    G.interactiune(g, {
      n: function () { return n; },
      implicit: function () { return n - 1; },
      sus: 1,
      index: function (ux, uy) {
        if (!stare) return -1;
        var r = Math.floor((uy - stare.sus) / stare.banda);
        return r >= 0 && r < n ? n - 1 - r : -1;
      },
      arata: function (i) {
        G.golesteNod(stare.fundal);
        S('rect', { 'class': 'w-banda', x: 0, y: r1(stare.ySus(i)), width: G.LATIME, height: stare.banda, rx: 4 }, stare.fundal);
        var randuri = [
          { culoare: ctx.culoareSerie(0), valoare: fv(stare.a.barbati[i]), eticheta: t(T.barbati) },
          { culoare: ctx.culoareSerie(1), valoare: fv(stare.a.femei[i]), eticheta: t(T.femei) }
        ];
        if (stare.sup) randuri.push({ culoare: 'var(--ink-2)', valoare: fv(stare.sup.barbati[i]) + ' / ' + fv(stare.sup.femei[i]), eticheta: G.sablon(t(T.bf), { an: d.suprapunere }) });
        g.tooltip.arata(grupe[i], randuri, stare.xF(stare.a.femei[i]), stare.ySus(i) + stare.banda / 2);
      },
      ascunde: function () { if (stare) G.golesteNod(stare.fundal); }
    });

    function actualizeaza(anuntaAcum) {
      legenda();
      dale();
      deseneaza();
      tv.actualizeaza();
      if (anuntaAcum) {
        var s = calc.structura(d.grupe, d.ani[anCurent]);
        if (s) anunt(G.sablon(t(T.anuntStructura), { an: anCurent, v: ctx.fmtProc(s.varstnici, 1) }));
        else {
          var m = calc.grupaMaxima(calc.afisate(d.ani[anCurent], d.unitate));
          anunt(G.sablon(t(T.anuntMaxim), { an: anCurent, g: grupe[m.i] || '', sex: t(T[m.sex] || T.barbati).toLowerCase(), v: fv(m.v) }));
        }
      }
    }

    actualizeaza(false);
    g.laRedimensionare(deseneaza);
    cad.incheie();
  }

  window.Atelier.inregistreaza('piramida', { calc: calc, monteaza: monteaza });
})();
