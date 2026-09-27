/* rose.js — paradoxul prevenției (Geoffrey Rose), cu valori construite.
 *
 * Expunerea X ~ Normală(medie, ds); riscul individual e logistic: r(x) = 1 / (1 + e^−(a + b·x)).
 * Cazuri așteptate = N · ∫ φ(x) · r(x') dx, unde x' e expunerea după intervenție:
 *   fără intervenție:            x' = x
 *   strategia populațională:     x' = x − deplasare (pentru toată lumea)
 *   strategia pe risc înalt:     x' = x − reducere doar pentru x ≥ prag
 * Integrare numerică: regula lui Simpson compusă pe [medie − 8·ds, medie + 8·ds], pas ≈ ds/100
 * (cel puțin 1600 de intervale), cu intervalul tăiat exact în prag, ca discontinuitatea strategiei
 * pe risc înalt să nu strice precizia. Se raportează și ponderea cazurilor de bază care apar sub prag.
 * Ideea didactică: mulți oameni cu risc mic produc mai multe cazuri decât puțini oameni cu risc mare.
 */
(function () {
  'use strict';

  function esteNumar(x) { return typeof x === 'number' && isFinite(x); }
  function numar(x, i) { return esteNumar(x) ? x : i; }
  function limiteaza(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function sablon(t, v) {
    return String(t).replace(/\{([A-Za-z0-9_]+)\}/g, function (m, k) { return v[k] != null ? String(v[k]) : m; });
  }
  var RAD2PI = Math.sqrt(2 * Math.PI);

  /* „de” între numeral și substantiv (română): 20 de, 100 de, 1794 de; dar 9, 108, 1815 fără. */
  function de(x) {
    if (typeof x !== 'number' || !isFinite(x) || Math.abs(x - Math.round(x)) > 1e-9) return '';
    var r = Math.round(Math.abs(x)) % 100;
    return (r === 0 && Math.round(x) !== 0) || r >= 20 ? ' de' : '';
  }

  var T = {
    deplasare_populatie: { ro: 'Strategia populațională: scădere pentru toată lumea', en: 'Population strategy: reduction for everyone' },
    reducere_risc_inalt: { ro: 'Strategia pe risc înalt: scădere doar peste prag', en: 'High-risk strategy: reduction only above the cut-off' },
    prag: { ro: 'Pragul de risc înalt', en: 'High-risk cut-off' },
    expunere: { ro: 'Expunerea', en: 'Exposure' },
    densitate: { ro: 'Persoane pe {u}', en: 'People per {u}' },
    actuala: { ro: 'Distribuția actuală', en: 'Current distribution' },
    deplasata: { ro: 'După strategia populațională', en: 'After the population strategy' },
    etPrag: { ro: 'prag {p}', en: 'cut-off {p}' },
    risc: { ro: 'risc individual la această expunere', en: 'individual risk at this exposure' },
    baza: { ro: 'Cazuri așteptate fără intervenție', en: 'Expected cases without intervention' },
    subBaza: { ro: 'risc mediu {r}', en: 'mean risk {r}' },
    pop: { ro: 'Previne strategia populațională', en: 'Prevented by the population strategy' },
    subPop: { ro: '{p} din cazuri; toți cu −{d}', en: '{p} of cases; everyone −{d}' },
    ri: { ro: 'Previne strategia pe risc înalt', en: 'Prevented by the high-risk strategy' },
    subRi: { ro: '{p} din cazuri; doar cei de la {prag} în sus, cu −{d}', en: '{p} of cases; only those at {prag} or above, −{d}' },
    sub: { ro: 'Cazuri care apar sub prag', en: 'Cases arising below the cut-off' },
    subSub: { ro: 'la {q} din populație, aflați sub prag', en: 'among the {q} of the population below the cut-off' },
    peste: { ro: 'Populația de la prag în sus', en: 'Population at or above the cut-off' },
    subPeste: { ro: '{n}{de} persoane', en: '{n} people' },
    graficEticheta: { ro: 'Distribuția expunerii înainte și după strategia populațională, cu pragul de risc înalt la {p}', en: 'Exposure distribution before and after the population strategy, with the high-risk cut-off at {p}' },
    graficDesc: {
      ro: 'Două curbe de densitate (persoane pe unitate de expunere); zona umbrită de sub curba actuală, la dreapta pragului, este grupul cu risc înalt.',
      en: 'Two density curves (people per unit of exposure); the shaded area under the current curve, right of the cut-off, is the high-risk group.'
    },
    tabel: { ro: 'Densitatea expunerii (persoane pe {u}) și riscul individual', en: 'Exposure density (people per {u}) and individual risk' },
    riscCol: { ro: 'Risc individual', en: 'Individual risk' },
    concluzie: {
      ro: 'Cu aceste valori, strategia populațională (toată lumea −{dp}) previne {x}{de} cazuri, iar strategia pe grupul cu risc înalt ({pp} din populație, −{dr}) previne {y}: {cine}. {fs} din cazuri apar la persoanele de sub pragul de {prag}, pe care strategia pe risc înalt nu le atinge.',
      en: 'With these values, the population strategy (everyone −{dp}) prevents {x} cases, while the high-risk strategy ({pp} of the population, −{dr}) prevents {y}: {cine}. {fs} of cases arise among people below the cut-off of {prag}, whom the high-risk strategy does not reach.'
    },
    castigaPop: { ro: 'strategia populațională previne mai multe', en: 'the population strategy prevents more' },
    castigaRi: { ro: 'strategia pe risc înalt previne mai multe', en: 'the high-risk strategy prevents more' },
    egal: { ro: 'cele două strategii previn la fel de multe', en: 'the two strategies prevent the same number' },
    anunt: { ro: 'Populațională: {x}{de} cazuri prevenite; risc înalt: {y}.', en: 'Population strategy: {x} cases prevented; high-risk: {y}.' }
  };

  var M = {
    ds: { ro: 'Deviația standard trebuie să fie pozitivă; s-a folosit 1.', en: 'The standard deviation must be positive; 1 was used.' },
    populatie: { ro: 'Populația trebuie să fie pozitivă; s-a folosit 100 000.', en: 'The population must be positive; 100,000 was used.' },
    risc: { ro: 'Funcția de risc are nevoie de coeficienții numerici „a” și „b”; s-au folosit valori implicite.', en: 'The risk function needs numeric coefficients “a” and “b”; defaults were used.' },
    negativ: { ro: 'Scăderile de expunere nu pot fi negative; s-a folosit 0.', en: 'Exposure reductions cannot be negative; 0 was used.' }
  };

  var CURSOARE = ['deplasare_populatie', 'reducere_risc_inalt', 'prag'];

  var calc = {
    texte: T,
    mesaje: M,

    normalizeaza: function (cfg) {
      cfg = cfg || {};
      var mesaje = [];
      function msg(m) { if (mesaje.indexOf(m) < 0) mesaje.push(m); }
      var p = {};
      p.medie = numar(cfg.medie, 125);
      p.ds = numar(cfg.ds, 15);
      if (!(p.ds > 0)) { msg(M.ds); p.ds = 1; }
      p.prag = numar(cfg.prag, p.medie + p.ds);
      var r = cfg.risc || {};
      if (!esteNumar(r.a) || !esteNumar(r.b)) msg(M.risc);
      p.a = numar(r.a, -10);
      p.b = numar(r.b, 0.05);
      p.deplasare = numar(cfg.deplasare_populatie, 5);
      p.reducere = numar(cfg.reducere_risc_inalt, 15);
      if (p.deplasare < 0 || p.reducere < 0) { msg(M.negativ); p.deplasare = Math.max(0, p.deplasare); p.reducere = Math.max(0, p.reducere); }
      p.populatie = numar(cfg.populatie, 100000);
      if (!(p.populatie > 0)) { msg(M.populatie); p.populatie = 100000; }
      p.unitate = cfg.unitate || '';
      p.eticheta = cfg.eticheta_expunere || null;
      p.zecimale = Math.round(limiteaza(numar(cfg.zecimale, 0), 0, 3));
      var iv = cfg.intervale || {};
      var impl = {
        deplasare_populatie: [0, Math.max(20, p.deplasare), 0.5],
        reducere_risc_inalt: [0, Math.max(40, p.reducere), 1],
        prag: [p.medie - p.ds, p.medie + 3 * p.ds, p.ds / 15]
      };
      var intervale = {};
      var val = { deplasare_populatie: p.deplasare, reducere_risc_inalt: p.reducere, prag: p.prag };
      CURSOARE.forEach(function (k) {
        var a = Array.isArray(iv[k]) ? iv[k] : impl[k];
        var lo = numar(a[0], impl[k][0]), hi = numar(a[1], impl[k][1]), pas = numar(a[2], impl[k][2]);
        if (!(hi > lo)) { lo = impl[k][0]; hi = impl[k][1]; }
        intervale[k] = [Math.min(lo, val[k]), Math.max(hi, val[k]), pas > 0 ? pas : impl[k][2]];
      });
      p.intervale = intervale;
      p.cursoare = Array.isArray(cfg.cursoare) ? cfg.cursoare.filter(function (k) { return CURSOARE.indexOf(k) >= 0; }) : ['deplasare_populatie', 'reducere_risc_inalt'];
      p.mesaje = mesaje;
      return p;
    },

    densitate: function (x, medie, ds) {
      var z = (x - medie) / ds;
      return Math.exp(-0.5 * z * z) / (ds * RAD2PI);
    },

    risc: function (x, a, b) { return 1 / (1 + Math.exp(-(a + b * x))); },

    simpson: function (f, a, b, n) {
      if (n % 2) n++;
      var h = (b - a) / n, s = f(a) + f(b);
      for (var i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
      return s * h / 3;
    },

    /* Simpson compus cu pasul cel mult „pas”; 0 pentru un interval gol. */
    integreaza: function (f, a, b, pas) {
      if (!(b > a)) return 0;
      var n = 2 * Math.max(1, Math.ceil((b - a) / (2 * pas)));
      return calc.simpson(f, a, b, n);
    },

    /* p = {medie, ds, prag, a, b, deplasare, reducere, populatie} */
    cazuri: function (p) {
      var mu = p.medie, sd = p.ds, a = p.a, b = p.b, N = p.populatie;
      var L = mu - 8 * sd, U = mu + 8 * sd, h = sd / 100;
      var c = limiteaza(p.prag, L, U);
      var phi = function (x) { return calc.densitate(x, mu, sd); };
      var f0 = function (x) { return phi(x) * calc.risc(x, a, b); };
      var fPop = function (x) { return phi(x) * calc.risc(x - p.deplasare, a, b); };
      var fRi = function (x) { return phi(x) * calc.risc(x - p.reducere, a, b); };
      var sub = calc.integreaza(f0, L, c, h), peste = calc.integreaza(f0, c, U, h);
      var pop = calc.integreaza(fPop, L, c, h) + calc.integreaza(fPop, c, U, h);
      var ri = sub + calc.integreaza(fRi, c, U, h);
      var fracPeste = calc.integreaza(phi, c, U, h);
      var baza = N * (sub + peste);
      return {
        baza: baza, populational: N * pop, riscInalt: N * ri,
        prevenitePop: baza - N * pop, preveniteRi: baza - N * ri,
        cazuriSub: N * sub, cazuriPeste: N * peste,
        fractieSub: sub + peste > 0 ? sub / (sub + peste) : null,
        fractiePeste: fracPeste,
        riscMediu: sub + peste
      };
    },

    /* Punctele curbelor (persoane pe unitate de expunere) pe [x0, x1], n intervale. */
    curbe: function (p, x0, x1, n) {
      var baza = [], depl = [], N = p.populatie;
      for (var i = 0; i <= n; i++) {
        var x = x0 + (x1 - x0) * i / n;
        baza.push([x, N * calc.densitate(x, p.medie, p.ds)]);
        depl.push([x, N * calc.densitate(x, p.medie - p.deplasare, p.ds)]);
      }
      return { baza: baza, deplasata: depl };
    },

    concluzie: function (rez, p, tx, fmt, fmtProc, u) {
      var dif = rez.prevenitePop - rez.preveniteRi;
      var tol = 1e-6 * Math.max(1, rez.baza);
      var cine = Math.abs(dif) <= tol ? T.egal : (dif > 0 ? T.castigaPop : T.castigaRi);
      function cuU(v) { return fmt(v, p.zecimale) + (u ? ' ' + u : ''); }
      return sablon(tx(T.concluzie), {
        dp: cuU(p.deplasare), x: fmt(rez.prevenitePop, 0), de: de(Math.round(rez.prevenitePop)), pp: fmtProc(rez.fractiePeste, 1), dr: cuU(p.reducere),
        y: fmt(rez.preveniteRi, 0), cine: tx(cine), fs: fmtProc(rez.fractieSub, 0), prag: cuU(p.prag)
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = calc; return; }

  function monteaza(el, cfg, ctx) {
    var G = (window.Atelier && window.Atelier.grafic) || window.AtelierGrafic;
    if (!G) throw new Error('grafic.js nu este încărcat');
    var H = G.H, t = ctx.t;
    var cad = G.cadru(el, cfg, ctx);
    var p = calc.normalizeaza(cfg);
    cad.mesaje(p.mesaje);
    var u = t(p.unitate);
    var fmt = function (x, z) { return G.fmtN(ctx, x, z); };
    function cuU(v) { return fmt(v, p.zecimale) + (u ? ' ' + u : ''); }
    var anunt = G.anuntator(ctx);
    var rez = null, curbe = null;
    var dMax = p.intervale.deplasare_populatie[1];
    var x0 = p.medie - 4 * p.ds - dMax, x1 = p.medie + 4 * p.ds;
    var serii = [
      { cheie: 'actuala', eticheta: t(T.actuala), culoare: ctx.culoareSerie(0) },
      { cheie: 'deplasata', eticheta: t(T.deplasata), culoare: ctx.culoareSerie(1) }
    ];
    var camp = { deplasare_populatie: 'deplasare', reducere_risc_inalt: 'reducere', prag: 'prag' };

    if (p.cursoare.length) {
      var ctrl = H('div', { 'class': 'controale' }, cad.corp);
      p.cursoare.forEach(function (k) {
        var iv = p.intervale[k];
        G.cursor(ctx, ctrl, {
          eticheta: t(T[k]), min: iv[0], max: iv[1], pas: iv[2], valoare: p[camp[k]],
          rotunjire: function (v) { return G.rotunjeste(v, 3); },
          format: function (v) { return (k === 'prag' ? '' : '−') + fmt(v, G.zecimaleNecesare([iv[2]], 2)) + (u ? ' ' + u : ''); },
          laSchimbare: function (v) { p[camp[k]] = v; recalculeaza(true); }
        });
      });
    }
    var dl = G.dale(cad.corp);
    var conc = G.concluzie(cad.corp);
    G.legenda(ctx, cad.corp, serii.map(function (s) { return { cheie: s.cheie, eticheta: s.eticheta, culoare: s.culoare, forma: 'linie' }; }));
    var g = G.graficNou(ctx, cad.corp, { inaltime: 300 });
    var tv = G.vizualizareTabel(ctx, cad.corp, function () {
      var pas = Math.max(1, Math.round(curbe.baza.length / 60));
      var randuri = [];
      for (var i = 0; i < curbe.baza.length; i += pas) {
        var x = curbe.baza[i][0];
        randuri.push([{ text: fmt(x, 1), antet: true }, { text: fmt(curbe.baza[i][1], 1), num: true },
                      { text: fmt(curbe.deplasata[i][1], 1), num: true }, { text: ctx.fmtProc(calc.risc(x, p.a, p.b), 2), num: true }]);
      }
      return G.tabel({
        legenda: G.sablon(t(T.tabel), { u: u || '1' }),
        antete: [[{ text: t(p.eticheta) || t(T.expunere) }, { text: t(T.actuala), num: true }, { text: t(T.deplasata), num: true }, { text: t(T.riscCol), num: true }]],
        randuri: randuri
      });
    });

    function deseneaza() {
      curbe = calc.curbe(p, x0, x1, 320);
      var arie = [[p.prag, p.populatie * calc.densitate(p.prag, p.medie, p.ds)]].concat(curbe.baza.filter(function (q) { return q[0] > p.prag; }));
      serii[0].puncte = curbe.baza;
      serii[1].puncte = curbe.deplasata;
      G.linii(ctx, g, {
        serii: serii,
        titluY: G.sablon(t(T.densitate), { u: u || '1' }),
        titluX: (t(p.eticheta) || t(T.expunere)) + (u ? ' (' + u + ')' : ''),
        xDomeniu: [x0, x1],
        yDeLaZero: true,
        eticheteVarf: true,
        inaltime: 300,
        referinte: [{ axa: 'x', valoare: p.prag, eticheta: G.sablon(t(T.etPrag), { p: cuU(p.prag) }) }],
        arii: p.prag < x1 ? [{ culoare: ctx.culoareSerie(0), puncte: arie }] : [],
        formatAntetX: function (x) { return (t(p.eticheta) || t(T.expunere)) + ': ' + cuU(x); },
        formatValoare: function (y) { return fmt(y, 1); },
        randuriExtra: function (x) { return [{ valoare: ctx.fmtProc(calc.risc(x, p.a, p.b), 2), eticheta: t(T.risc) }]; }
      });
      g.descrie(G.sablon(t(T.graficEticheta), { p: cuU(p.prag) }), t(T.graficDesc));
    }

    function recalculeaza(anuntaAcum) {
      rez = calc.cazuri(p);
      var pr = function (x) { return ctx.fmtProc(x, 1); };
      dl.seteaza([
        { et: t(T.baza), val: fmt(rez.baza, 0), sub: G.sablon(t(T.subBaza), { r: ctx.fmtProc(rez.riscMediu, 2) }) },
        { et: t(T.pop), val: fmt(rez.prevenitePop, 0), sub: G.sablon(t(T.subPop), { p: pr(rez.prevenitePop / rez.baza), d: cuU(p.deplasare) }) },
        { et: t(T.ri), val: fmt(rez.preveniteRi, 0), sub: G.sablon(t(T.subRi), { p: pr(rez.preveniteRi / rez.baza), prag: cuU(p.prag), d: cuU(p.reducere) }) },
        { et: t(T.sub), val: pr(rez.fractieSub), sub: G.sablon(t(T.subSub), { q: pr(1 - rez.fractiePeste) }) },
        { et: t(T.peste), val: pr(rez.fractiePeste), sub: G.sablon(t(T.subPeste), { n: fmt(rez.fractiePeste * p.populatie, 0), de: G.de(Math.round(rez.fractiePeste * p.populatie)) }) }
      ]);
      conc.seteaza(calc.concluzie(rez, p, t, fmt, ctx.fmtProc, u));
      deseneaza();
      tv.actualizeaza();
      if (anuntaAcum) anunt(G.sablon(t(T.anunt), { x: fmt(rez.prevenitePop, 0), de: G.de(Math.round(rez.prevenitePop)), y: fmt(rez.preveniteRi, 0) }));
    }

    recalculeaza(false);
    g.laRedimensionare(deseneaza);
    cad.incheie();
  }

  window.Atelier.inregistreaza('rose', { calc: calc, monteaza: monteaza });
})();
