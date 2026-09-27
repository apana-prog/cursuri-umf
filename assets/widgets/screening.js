/* screening.js — sensibilitate, specificitate, prevalență → tabelul 2×2, VPP, VPN, RV+ și RV−.
 *
 * Pentru n persoane (implicit 1000): bolnavi = n·p; AP = bolnavi·Se; FN = bolnavi − AP;
 * fără boală = n·(1 − p); AN = fără boală·Sp; FP = fără boală − AN.
 * VPP = AP / (AP + FP); VPN = AN / (AN + FN); RV+ = Se / (1 − Sp); RV− = (1 − Se) / Sp.
 * Grila de pictograme arată 1000 de persoane (100 dacă n = 100), rotunjite la întreg prin
 * metoda celui mai mare rest (suma rămâne exact 1000).
 * Ideea didactică: VPP depinde de prevalență, nu doar de calitatea testului.
 */
(function () {
  'use strict';

  function esteNumar(x) { return typeof x === 'number' && isFinite(x); }
  function numar(x, i) { return esteNumar(x) ? x : i; }
  function limiteaza(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function suma(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function sablon(t, v) {
    return String(t).replace(/\{([A-Za-z0-9_]+)\}/g, function (m, k) { return v[k] != null ? String(v[k]) : m; });
  }

  var T = {
    se: { ro: 'Sensibilitatea (Se)', en: 'Sensitivity (Se)' },
    sp: { ro: 'Specificitatea (Sp)', en: 'Specificity (Sp)' },
    prev: { ro: 'Prevalența', en: 'Prevalence' },
    scaraLog: { ro: '(scară logaritmică)', en: '(log scale)' },
    bolnavi: { ro: 'Bolnavi', en: 'Diseased' },
    sanatosi: { ro: 'Fără boală', en: 'Not diseased' },
    total: { ro: 'Total', en: 'Total' },
    testPoz: { ro: 'Test pozitiv', en: 'Test positive' },
    testNeg: { ro: 'Test negativ', en: 'Test negative' },
    rezultat: { ro: 'Rezultatul testului', en: 'Test result' },
    legenda2x2: { ro: 'Tabelul 2×2 pentru {n}{de} persoane (valori așteptate)', en: '2×2 table for {n} people (expected counts)' },
    vpp: { ro: 'Valoarea predictivă pozitivă (VPP)', en: 'Positive predictive value (PPV)' },
    vpn: { ro: 'Valoarea predictivă negativă (VPN)', en: 'Negative predictive value (NPV)' },
    rvp: { ro: 'Raportul de verosimilitate pozitiv (RV+)', en: 'Positive likelihood ratio (LR+)' },
    rvn: { ro: 'Raportul de verosimilitate negativ (RV−)', en: 'Negative likelihood ratio (LR−)' },
    subVpp: { ro: 'AP ÷ (AP + FP)', en: 'TP ÷ (TP + FP)' },
    subVpn: { ro: 'AN ÷ (AN + FN)', en: 'TN ÷ (TN + FN)' },
    subRvp: { ro: 'Se ÷ (1 − Sp)', en: 'Se ÷ (1 − Sp)' },
    subRvn: { ro: '(1 − Se) ÷ Sp', en: '(1 − Se) ÷ Sp' },
    ap: { ro: 'AP', en: 'TP' }, fp: { ro: 'FP', en: 'FP' }, fn: { ro: 'FN', en: 'FN' }, an: { ro: 'AN', en: 'TN' },
    apLung: { ro: 'Adevărat pozitivi: bolnavi, test pozitiv', en: 'True positives: diseased, test positive' },
    fpLung: { ro: 'Fals pozitivi: fără boală, test pozitiv', en: 'False positives: not diseased, test positive' },
    fnLung: { ro: 'Fals negativi: bolnavi, test negativ', en: 'False negatives: diseased, test negative' },
    anLung: { ro: 'Adevărat negativi: fără boală, test negativ', en: 'True negatives: not diseased, test negative' },
    notaIconite: {
      ro: 'Fiecare pătrat este o persoană din {ni}; numerele sunt rotunjite la persoane întregi.',
      en: 'Each square is one person out of {ni}; counts are rounded to whole people.'
    },
    notaIconiteN: {
      ro: 'Tabelul folosește {n}{de} persoane; grila arată aceleași proporții pentru {ni} de persoane, rotunjite la întreg.',
      en: 'The table uses {n} people; the grid shows the same proportions for {ni} people, rounded to whole people.'
    },
    graficEticheta: {
      ro: 'Grilă de {ni} de persoane: adevărat pozitivi {ap}, fals pozitivi {fp}, fals negativi {fn}, adevărat negativi {an}',
      en: 'Grid of {ni} people: true positives {ap}, false positives {fp}, false negatives {fn}, true negatives {an}'
    },
    graficDesc: {
      ro: 'Pătratele sunt ordonate: întâi adevărat pozitivii, apoi fals pozitivii, fals negativii și adevărat negativii.',
      en: 'Squares are ordered: true positives first, then false positives, false negatives and true negatives.'
    },
    dinNi: { ro: 'din {ni} de persoane', en: 'out of {ni} people' },
    categoria: { ro: 'Categoria', en: 'Category' },
    patrate: { ro: 'Pătrate în grilă (din {ni})', en: 'Squares in the grid (of {ni})' },
    asteptat: { ro: 'Valoare așteptată (din {n})', en: 'Expected count (of {n})' },
    proportie: { ro: 'Proporție', en: 'Proportion' },
    tabelIconite: { ro: 'Datele grilei de pictograme', en: 'Data behind the icon array' },
    conc: {
      ro: 'Din {poz}{de} persoane cu test pozitiv, {ap} sunt bolnave: valoarea predictivă pozitivă este {vpp}.',
      en: 'Of the {poz} people who test positive, {ap} have the disease: the positive predictive value is {vpp}.'
    },
    concFP: {
      ro: 'Celelalte {fp} sunt fals pozitive. Deși testul are sensibilitatea {se} și specificitatea {sp}, la o prevalență de {prev} bolnavii sunt atât de puțini încât majoritatea rezultatelor pozitive aparțin unor persoane fără boală.',
      en: 'The other {fp} are false positives. Although the test has sensitivity {se} and specificity {sp}, at a prevalence of {prev} the diseased are so few that most positive results belong to people without the disease.'
    },
    concFaraPoz: {
      ro: 'Cu aceste valori niciun rezultat nu iese pozitiv, deci valoarea predictivă pozitivă nu se poate calcula.',
      en: 'With these values no result is positive, so the positive predictive value cannot be calculated.'
    },
    anunt: {
      ro: 'VPP {vpp}: din {poz}{de} persoane cu test pozitiv, {ap} sunt bolnave.',
      en: 'PPV {vpp}: of {poz} people who test positive, {ap} have the disease.'
    }
  };

  var M = {
    se: { ro: 'Sensibilitatea trebuie să fie între 0 și 1; valoarea a fost limitată.', en: 'Sensitivity must be between 0 and 1; the value was clamped.' },
    sp: { ro: 'Specificitatea trebuie să fie între 0 și 1; valoarea a fost limitată.', en: 'Specificity must be between 0 and 1; the value was clamped.' },
    prev: { ro: 'Prevalența trebuie să fie între 0 și 1; valoarea a fost limitată.', en: 'Prevalence must be between 0 and 1; the value was clamped.' },
    n: { ro: 'Numărul de persoane trebuie să fie pozitiv; s-a folosit 1000.', en: 'The number of people must be positive; 1000 was used.' }
  };

  var calc = {
    texte: T,
    mesaje: M,

    normalizeaza: function (cfg) {
      cfg = cfg || {};
      var mesaje = [];
      function msg(m) { if (mesaje.indexOf(m) < 0) mesaje.push(m); }
      function proportie(v, implicit, m) {
        var x = numar(v, implicit);
        if (x < 0 || x > 1) { msg(m); x = limiteaza(x, 0, 1); }
        return x;
      }
      var se = proportie(cfg.se, 0.9, M.se);
      var sp = proportie(cfg.sp, 0.9, M.sp);
      var prev = proportie(cfg.prevalenta, 0.01, M.prev);
      var n = numar(cfg.n, 1000);
      if (!(n > 0)) { msg(M.n); n = 1000; }
      var iv = cfg.intervale || {};
      function interval(camp, implicit, val) {
        var a = Array.isArray(iv[camp]) ? iv[camp] : implicit;
        var lo = limiteaza(numar(a[0], implicit[0]), 0, 1), hi = limiteaza(numar(a[1], implicit[1]), 0, 1);
        if (lo > hi) { var t = lo; lo = hi; hi = t; }
        if (lo === hi) { lo = implicit[0]; hi = implicit[1]; }
        return [Math.min(lo, val), Math.max(hi, val)];
      }
      var intPrev = interval('prevalenta', [0.001, 0.5], prev);
      var scara = cfg.scara_prevalenta === 'liniara' ? 'liniara' : 'log';
      if (scara === 'log' && !(intPrev[0] > 0)) scara = 'liniara';
      return {
        se: se, sp: sp, prevalenta: prev, n: n, nIcon: n === 100 ? 100 : 1000,
        intervale: { se: interval('se', [0.5, 1], se), sp: interval('sp', [0.5, 1], sp), prevalenta: intPrev },
        scaraPrevalenta: scara,
        zecimale: Math.round(limiteaza(numar(cfg.zecimale, 1), 0, 3)),
        mesaje: mesaje
      };
    },

    calculeaza: function (se, sp, prev, n) {
      var bolnavi = n * prev, sanatosi = n * (1 - prev);
      var ap = bolnavi * se, fn = bolnavi - ap, an = sanatosi * sp, fp = sanatosi - an;
      var poz = ap + fp, neg = fn + an;
      return {
        se: se, sp: sp, prevalenta: prev, n: n,
        ap: ap, fp: fp, fn: fn, an: an, bolnavi: bolnavi, sanatosi: sanatosi, pozitivi: poz, negativi: neg,
        vpp: poz > 0 ? ap / poz : null,
        vpn: neg > 0 ? an / neg : null,
        rvPoz: calc.rvPozitiv(se, sp),
        rvNeg: calc.rvNegativ(se, sp)
      };
    },

    /* A doua formulare (teorema lui Bayes), folosită în teste ca verificare independentă. */
    vppBayes: function (se, sp, prev) {
      var num = se * prev, den = num + (1 - sp) * (1 - prev);
      return den > 0 ? num / den : null;
    },
    vpnBayes: function (se, sp, prev) {
      var num = sp * (1 - prev), den = num + (1 - se) * prev;
      return den > 0 ? num / den : null;
    },
    rvPozitiv: function (se, sp) { return sp < 1 ? se / (1 - sp) : (se > 0 ? Infinity : null); },
    rvNegativ: function (se, sp) { return sp > 0 ? (1 - se) / sp : (se < 1 ? Infinity : null); },

    /* Metoda celui mai mare rest: întregi proporționali cu „valori”, cu suma exact „total”. */
    alocaIntregi: function (valori, total) {
      var v = valori.map(function (x) { return esteNumar(x) && x > 0 ? x : 0; });
      var s = suma(v);
      if (!(s > 0)) return v.map(function () { return 0; });
      var exact = v.map(function (x) { return x * total / s; });
      var baza = exact.map(function (x) { return Math.floor(x + 1e-9); });
      var rest = total - suma(baza);
      var ordine = exact.map(function (x, i) { return i; }).sort(function (a, b) {
        return (exact[b] - baza[b]) - (exact[a] - baza[a]) || a - b;
      });
      for (var k = 0; k < rest && k < ordine.length; k++) baza[ordine[k]] += 1;
      return baza;
    },

    /* Numărul de pictograme pe categorie, în ordinea [AP, FP, FN, AN]. */
    iconite: function (rez, nIcon) {
      var k = nIcon / rez.n;
      return calc.alocaIntregi([rez.ap * k, rez.fp * k, rez.fn * k, rez.an * k], nIcon);
    },

    /* Zecimalele unui procent mic: 0,15% are nevoie de două zecimale, 12,3% de una. */
    zecimaleProc: function (p, minim) {
      var z = p > 0 && p < 0.001 ? 3 : (p > 0 && p < 0.01 ? 2 : 1);
      return Math.max(z, minim == null ? 1 : minim);
    },

    /* „de” între numeral și substantiv (română): 20 de persoane, 108 persoane, 100 de persoane. */
    de: function (x) {
      if (!esteNumar(x) || Math.abs(x - Math.round(x)) > 1e-9) return '';
      var r = Math.round(Math.abs(x)) % 100;
      return (r === 0 && Math.round(x) !== 0) || r >= 20 ? ' de' : '';
    },

    persoane: function (x, fmt) { return Math.abs(x - Math.round(x)) < 1e-9 ? fmt(Math.round(x), 0) : fmt(x, 1); },

    concluzie: function (rez, tx, fmt, fmtProc, zec, limba) {
      if (rez.vpp == null) return tx(T.concFaraPoz);
      var pozR = Math.abs(rez.pozitivi - Math.round(rez.pozitivi)) < 1e-9 ? Math.round(rez.pozitivi) : rez.pozitivi;
      var s = sablon(tx(T.conc), {
        poz: calc.persoane(rez.pozitivi, fmt), de: calc.de(pozR),
        ap: calc.persoane(rez.ap, fmt), vpp: fmtProc(rez.vpp, calc.zecimaleProc(rez.vpp, zec))
      });
      if (rez.vpp < 0.5) {
        s += ' ' + sablon(tx(T.concFP), {
          fp: calc.persoane(rez.fp, fmt), se: fmtProc(rez.se, zec), sp: fmtProc(rez.sp, zec),
          prev: fmtProc(rez.prevalenta, calc.zecimaleProc(rez.prevalenta, zec))
        });
      }
      return s;
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
    var st = { se: d.se, sp: d.sp, prev: d.prevalenta };
    var zec = d.zecimale;
    var anunt = G.anuntator(ctx);
    var fmt = function (x, z) { return G.fmtN(ctx, x, z); };
    function proc(x) { return ctx.fmtProc(x, calc.zecimaleProc(x, zec)); }
    var nTxt = fmt(d.n, 0), niTxt = fmt(d.nIcon, 0);
    var CAT = [
      { cheie: 'ap', culoare: ctx.culoareSerie(0) },
      { cheie: 'fp', culoare: ctx.culoareSerie(1) },
      { cheie: 'fn', culoare: ctx.culoareSerie(2) },
      { cheie: 'an', culoare: 'var(--muted)', clasa: 'w-neutru', forma: 'neutru' }
    ];
    var rez = null, stare = null;

    var ctrl = H('div', { 'class': 'controale' }, cad.corp);
    G.cursor(ctx, ctrl, {
      eticheta: t(T.se), min: d.intervale.se[0], max: d.intervale.se[1], pas: 0.005, valoare: st.se,
      rotunjire: function (v) { return G.rotunjeste(v, 4); }, format: function (v) { return ctx.fmtProc(v, 1); },
      laSchimbare: function (v) { st.se = v; recalculeaza(true); }
    });
    G.cursor(ctx, ctrl, {
      eticheta: t(T.sp), min: d.intervale.sp[0], max: d.intervale.sp[1], pas: 0.005, valoare: st.sp,
      rotunjire: function (v) { return G.rotunjeste(v, 4); }, format: function (v) { return ctx.fmtProc(v, 1); },
      laSchimbare: function (v) { st.sp = v; recalculeaza(true); }
    });
    var log = d.scaraPrevalenta === 'log';
    G.cursor(ctx, ctrl, {
      eticheta: t(T.prev) + (log ? ' ' + t(T.scaraLog) : ''), min: d.intervale.prevalenta[0], max: d.intervale.prevalenta[1],
      pas: 0.001, scara: log ? 'log' : null, valoare: st.prev,
      rotunjire: function (v) { return log ? G.rotunjesteSemnificativ(v, 2) : G.rotunjeste(v, 4); },
      format: proc,
      laSchimbare: function (v) { st.prev = v; recalculeaza(true); }
    });

    var cutie2x2 = H('div', { 'class': 'tabel-derulant w-2x2' }, cad.corp);
    var dl = G.dale(cad.corp);
    var conc = G.concluzie(cad.corp);
    var zonaLeg = H('div', null, cad.corp);
    var g = G.graficNou(ctx, cad.corp, { inaltime: 400 });
    var nota = H('p', { 'class': 'w-nota' }, cad.corp);
    var tv = G.vizualizareTabel(ctx, cad.corp, function () {
      var nr = calc.iconite(rez, d.nIcon);
      var ex = [rez.ap, rez.fp, rez.fn, rez.an];
      return G.tabel({
        legenda: t(T.tabelIconite),
        antete: [[{ text: t(T.categoria) }, { text: G.sablon(t(T.patrate), { ni: niTxt }), num: true },
                  { text: G.sablon(t(T.asteptat), { n: nTxt }), num: true }, { text: t(T.proportie), num: true }]],
        randuri: CAT.map(function (c, k) {
          return [{ text: t(T[c.cheie]) + ' — ' + t(T[c.cheie + 'Lung']), antet: true }, { text: fmt(nr[k], 0), num: true },
                  { text: fmt(ex[k], 3), num: true }, { text: ctx.fmtProc(ex[k] / rez.n, 2), num: true }];
        })
      });
    });

    function tabel2x2() {
      G.golesteNod(cutie2x2);
      var p = function (x) { return calc.persoane(x, fmt); };
      function cel(abrev, x) {
        var sp = H('span');
        H('span', { 'class': 'w-abrev' }, sp, t(T[abrev]));
        sp.appendChild(document.createTextNode(' ' + p(x)));
        return { nod: sp, num: true };
      }
      cutie2x2.appendChild(G.tabel({
        legenda: G.sablon(t(T.legenda2x2), { n: nTxt, de: G.de(d.n) }),
        antete: [[{ text: t(T.rezultat) }, { text: t(T.bolnavi), num: true }, { text: t(T.sanatosi), num: true }, { text: t(T.total), num: true }]],
        randuri: [
          [{ text: t(T.testPoz), antet: true }, cel('ap', rez.ap), cel('fp', rez.fp), { text: p(rez.pozitivi), num: true }],
          [{ text: t(T.testNeg), antet: true }, cel('fn', rez.fn), cel('an', rez.an), { text: p(rez.negativi), num: true }],
          [{ text: t(T.total), antet: true }, { text: p(rez.bolnavi), num: true }, { text: p(rez.sanatosi), num: true }, { text: p(rez.n), num: true }]
        ]
      }));
    }

    function legenda(nr) {
      G.golesteNod(zonaLeg);
      G.legenda(ctx, zonaLeg, CAT.map(function (c, k) {
        return { cheie: c.cheie, eticheta: t(T[c.cheie]) + ' · ' + t(T[c.cheie + 'Lung']) + ': ' + fmt(nr[k], 0), culoare: c.culoare, forma: c.forma };
      }));
    }

    function deseneaza() {
      g.masoara();
      var cont = g.goleste();
      var cols = d.nIcon === 100 ? 20 : 40, rows = d.nIcon / cols;
      var cel = G.LATIME / cols, gol = Math.min(g.px(2), cel * 0.3), lat = cel - gol;
      g.inaltime(rows * cel);
      var nr = calc.iconite(rez, d.nIcon);
      var grupuri = [], start = [], idx = 0;
      CAT.forEach(function (c, k) {
        start.push(idx);
        var gr = S('g', { 'class': 'w-cat' + (c.clasa ? ' ' + c.clasa : ''), style: c.clasa ? null : 'fill:' + c.culoare }, cont);
        grupuri.push(gr);
        for (var m = 0; m < nr[k]; m++, idx++) {
          S('rect', {
            x: G.r1((idx % cols) * cel + gol / 2), y: G.r1(Math.floor(idx / cols) * cel + gol / 2),
            width: G.r1(lat), height: G.r1(lat), rx: G.r1(lat * 0.2)
          }, gr);
        }
      });
      start.push(idx);
      stare = { nr: nr, cols: cols, cel: cel, start: start, grupuri: grupuri };
      legenda(nr);
      g.descrie(G.sablon(t(T.graficEticheta), { ni: niTxt, ap: fmt(nr[0], 0), fp: fmt(nr[1], 0), fn: fmt(nr[2], 0), an: fmt(nr[3], 0) }), t(T.graficDesc));
    }

    G.interactiune(g, {
      n: function () { return 4; },
      index: function (ux, uy) {
        if (!stare) return -1;
        var c = Math.floor(uy / stare.cel) * stare.cols + Math.floor(ux / stare.cel);
        if (ux < 0 || uy < 0 || ux >= G.LATIME || c >= stare.start[4]) return -1;
        for (var k = 0; k < 4; k++) if (c >= stare.start[k] && c < stare.start[k + 1]) return k;
        return -1;
      },
      arata: function (k) {
        stare.grupuri.forEach(function (gr, j) {
          var baza = 'w-cat' + (CAT[j].clasa ? ' ' + CAT[j].clasa : '');
          gr.setAttribute('class', j === k ? baza : baza + ' w-estompat');
        });
        var i0 = stare.start[k];
        var x = (i0 % stare.cols + 0.5) * stare.cel, y = (Math.floor(i0 / stare.cols) + 0.5) * stare.cel;
        g.tooltip.arata(t(T[CAT[k].cheie + 'Lung']), [
          { culoare: CAT[k].culoare, valoare: fmt(stare.nr[k], 0), eticheta: t(T[CAT[k].cheie]) + ' ' + G.sablon(t(T.dinNi), { ni: niTxt }) }
        ], x, y);
      },
      ascunde: function () {
        if (!stare) return;
        stare.grupuri.forEach(function (gr, j) { gr.setAttribute('class', 'w-cat' + (CAT[j].clasa ? ' ' + CAT[j].clasa : '')); });
      }
    });

    function recalculeaza(anuntaAcum) {
      rez = calc.calculeaza(st.se, st.sp, st.prev, d.n);
      tabel2x2();
      dl.seteaza([
        { et: t(T.vpp), val: rez.vpp == null ? '—' : proc(rez.vpp), sub: t(T.subVpp) },
        { et: t(T.vpn), val: rez.vpn == null ? '—' : proc(rez.vpn), sub: t(T.subVpn) },
        { et: t(T.rvp), val: fmt(rez.rvPoz, 2), sub: t(T.subRvp) },
        { et: t(T.rvn), val: fmt(rez.rvNeg, 2), sub: t(T.subRvn) }
      ]);
      conc.seteaza(calc.concluzie(rez, t, fmt, ctx.fmtProc, zec, ctx.limba));
      nota.textContent = d.n === d.nIcon ? G.sablon(t(T.notaIconite), { ni: niTxt }) : G.sablon(t(T.notaIconiteN), { n: nTxt, ni: niTxt, de: G.de(d.n) });
      deseneaza();
      tv.actualizeaza();
      if (anuntaAcum && rez.vpp != null) {
        var pozR = Math.abs(rez.pozitivi - Math.round(rez.pozitivi)) < 1e-9 ? Math.round(rez.pozitivi) : rez.pozitivi;
        anunt(G.sablon(t(T.anunt), {
          vpp: proc(rez.vpp), poz: calc.persoane(rez.pozitivi, fmt), de: calc.de(pozR),
          ap: calc.persoane(rez.ap, fmt)
        }));
      } else if (anuntaAcum) anunt(t(T.concFaraPoz));
    }

    recalculeaza(false);
    g.laRedimensionare(deseneaza);
    cad.incheie();
  }

  window.Atelier.inregistreaza('screening', { calc: calc, monteaza: monteaza });
})();
