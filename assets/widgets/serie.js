/* serie.js — explorator de serii de timp pentru date REALE (extrase la construcție de date_sursa.py).
 *
 * Linii de 2px, câte o culoare pe entitate (slotul = poziția seriei în cfg.serii, niciodată
 * rangul ei), legendă cu comutatoare, etichete directe la capăt când sunt vizibile cel mult
 * 4 serii și nu se ciocnesc, indicator vertical cu tooltip pentru toate seriile vizibile,
 * tabel cu valorile exacte. Ascunderea unei serii nu recolorează celelalte.
 * Axa X: numere (ani, afișați fără separator de mii) sau coduri de perioadă (ex. „2020Q1”),
 * tratate ca poziții ordonate.
 */
(function () {
  'use strict';

  function esteNumar(x) { return typeof x === 'number' && isFinite(x); }
  function numar(x, i) { return esteNumar(x) ? x : i; }
  function limiteaza(x, a, b) { return x < a ? a : (x > b ? b : x); }

  var T = {
    an: { ro: 'Anul', en: 'Year' },
    perioada: { ro: 'Perioada', en: 'Period' },
    x: { ro: 'X', en: 'X' },
    graficEticheta: { ro: '{axa}: {n}{de} serii, {x0}–{x1}', en: '{axa}: {n} series, {x0}–{x1}' },
    graficEticheta1: { ro: '{axa}: o serie, {x0}–{x1}', en: '{axa}: one series, {x0}–{x1}' },
    graficDesc: {
      ro: 'Grafic de linii; fiecare serie are culoarea ei din legendă. Valorile exacte sunt în tabelul de sub grafic.',
      en: 'Line chart; each series keeps its legend colour. The exact values are in the table below the chart.'
    },
    tabel: { ro: 'Valorile seriilor', en: 'Series values' },
    faraDate: { ro: 'Fără date de afișat', en: 'No data to show' },
    valoare: { ro: 'Valoare', en: 'Value' }
  };

  var M = {
    faraSerii: { ro: 'Configurația nu conține nicio serie.', en: 'The configuration contains no series.' },
    preaMulte: { ro: 'Se afișează cel mult 8 serii (paleta are 8 culori); seriile de după a opta au fost omise.', en: 'At most 8 series are shown (the palette has 8 colours); series after the eighth were omitted.' },
    faraPuncte: { ro: 'O serie fără puncte valide a fost omisă.', en: 'A series without valid points was omitted.' },
    valoareInvalida: { ro: 'Unele valori nu erau numere și au fost tratate ca lipsă.', en: 'Some values were not numbers and were treated as missing.' },
    duplicat: { ro: 'Unele serii aveau două valori pentru același X; s-a păstrat prima.', en: 'Some series had two values for the same X; the first was kept.' },
    evidentiaza: { ro: 'Seria de evidențiat („evidentiaza”) nu există; nicio serie nu e evidențiată.', en: 'The series to highlight (“evidentiaza”) does not exist; no series is highlighted.' }
  };

  function comparaCoduri(a, b) {
    try { return String(a).localeCompare(String(b), 'en', { numeric: true }); }
    catch (e) { return String(a) < String(b) ? -1 : (String(a) > String(b) ? 1 : 0); }
  }

  var calc = {
    texte: T,
    mesaje: M,

    normalizeaza: function (cfg) {
      cfg = cfg || {};
      var mesaje = [];
      function msg(m) { if (mesaje.indexOf(m) < 0) mesaje.push(m); }
      /* slotul de culoare = poziția seriei în cfg.serii (culoarea urmează entitatea, nu rangul) */
      var brute = Array.isArray(cfg.serii) ? cfg.serii : [];
      if (!brute.some(function (s) { return s && typeof s === 'object'; })) msg(M.faraSerii);
      var toateX = [];
      brute.forEach(function (s, i) {
        if (!s || typeof s !== 'object' || i >= 8) return;
        (Array.isArray(s.puncte) ? s.puncte : []).forEach(function (p) { if (Array.isArray(p) && p[0] != null) toateX.push(p[0]); });
      });
      var ordinal = toateX.some(function (x) { return !esteNumar(x); });
      var eticheteX = null, indexX = null;
      if (ordinal) {
        var unice = [];
        toateX.forEach(function (x) { var s = String(x); if (unice.indexOf(s) < 0) unice.push(s); });
        unice.sort(comparaCoduri);
        eticheteX = unice;
        indexX = {};
        unice.forEach(function (s, i) { indexX[s] = i; });
      }
      var chei = {};
      var serii = [];
      brute.forEach(function (s, i) {
        if (!s || typeof s !== 'object') return;
        if (i >= 8) { msg(M.preaMulte); return; }
        var vazut = {}, puncte = [];
        (Array.isArray(s.puncte) ? s.puncte : []).forEach(function (p) {
          if (!Array.isArray(p) || p[0] == null) return;
          var x = ordinal ? indexX[String(p[0])] : p[0];
          if (!esteNumar(x)) return;
          if (vazut[x]) { msg(M.duplicat); return; }
          vazut[x] = true;
          var y = p[1];
          if (y != null && !esteNumar(y)) { msg(M.valoareInvalida); y = null; }
          puncte.push([x, y == null ? null : y]);
        });
        puncte.sort(function (a, b) { return a[0] - b[0]; });
        if (!puncte.some(function (p) { return esteNumar(p[1]); })) { msg(M.faraPuncte); return; }
        var cheie = s.cheie != null ? String(s.cheie) : 's' + (i + 1);
        if (chei[cheie]) cheie = cheie + '_' + (i + 1);
        chei[cheie] = true;
        serii.push({ cheie: cheie, eticheta: s.eticheta != null ? s.eticheta : cheie, puncte: puncte, slot: i });
      });
      var xs = calc.xUnice(serii);
      var xAn = !ordinal && xs.length > 0 && xs.every(function (x) { return Math.round(x) === x && x >= 1000 && x <= 2999; });
      if (cfg.format_x === 'an' && !ordinal) xAn = true;
      if (cfg.format_x === 'numar') xAn = false;
      var ev = cfg.evidentiaza != null ? String(cfg.evidentiaza) : null;
      if (ev != null && !serii.some(function (s) { return s.cheie === ev; })) { msg(M.evidentiaza); ev = null; }
      return {
        serii: serii, ordinal: ordinal, eticheteX: eticheteX, xAn: xAn,
        zecimale: Math.round(limiteaza(numar(cfg.zecimale, 1), 0, 4)),
        unitate: cfg.unitate || '', axaY: cfg.axa_y || '', axaX: cfg.axa_x || null,
        evidentiaza: ev, yDeLaZero: !!cfg.y_de_la_zero, mesaje: mesaje
      };
    },

    xUnice: function (serii) {
      var v = {}, xs = [];
      serii.forEach(function (s) { s.puncte.forEach(function (p) { if (!v[p[0]]) { v[p[0]] = 1; xs.push(p[0]); } }); });
      return xs.sort(function (a, b) { return a - b; });
    },

    valoareLa: function (serie, x) {
      for (var i = 0; i < serie.puncte.length; i++) if (serie.puncte[i][0] === x) return serie.puncte[i][1];
      return null;
    },

    /* Minimul și maximul valorilor seriilor vizibile (cu 0 inclus la cerere). */
    domeniuY: function (serii, deLaZero) {
      var mn = Infinity, mx = -Infinity;
      serii.forEach(function (s) {
        if (s.vizibil === false) return;
        s.puncte.forEach(function (p) { if (esteNumar(p[1])) { mn = Math.min(mn, p[1]); mx = Math.max(mx, p[1]); } });
      });
      if (!isFinite(mn)) { mn = 0; mx = 1; }
      if (deLaZero) { mn = Math.min(0, mn); mx = Math.max(0, mx); }
      return [mn, mx];
    },

    /* Rânduri pentru tabel: [{x, valori: [y pentru fiecare serie sau null]}]. */
    randuriTabel: function (serii) {
      return calc.xUnice(serii).map(function (x) {
        return { x: x, valori: serii.map(function (s) { return calc.valoareLa(s, x); }) };
      });
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
    var zec = d.zecimale, unitate = t(d.unitate);
    var fmt = function (x, z) { return G.fmtN(ctx, x, z); };
    var serii = d.serii.map(function (s) {
      return {
        cheie: s.cheie, eticheta: t(s.eticheta), puncte: s.puncte, culoare: ctx.culoareSerie(s.slot),
        vizibil: true, atenuat: d.evidentiaza != null && s.cheie !== d.evidentiaza
      };
    });
    function etX(x) {
      if (d.ordinal) return d.eticheteX[Math.round(x)] || '';
      return d.xAn ? String(Math.round(x)) : fmt(x, G.zecimaleNecesare([x], 3));
    }
    var zecTabel = Math.max(zec, G.zecimaleNecesare([].concat.apply([], d.serii.map(function (s) {
      return s.puncte.map(function (p) { return p[1]; });
    })), 4));

    /* o singură serie nu primește legendă: titlul o numește (dataviz) */
    if (serii.length > 1) {
      G.legenda(ctx, cad.corp, serii.map(function (s) {
        return { cheie: s.cheie, eticheta: s.eticheta, culoare: s.culoare, forma: 'linie', activ: true };
      }), {
        comutabil: true,
        laComutare: function (cheie, activ) {
          serii.forEach(function (s) { if (s.cheie === cheie) s.vizibil = activ; });
          deseneaza();
        }
      });
    }
    var g = G.graficNou(ctx, cad.corp, { inaltime: 300 });
    G.vizualizareTabel(ctx, cad.corp, function () {
      var rand = calc.randuriTabel(d.serii);
      var capX = t(d.axaX) || t(d.ordinal ? T.perioada : (d.xAn ? T.an : T.x));
      return G.tabel({
        legenda: t(d.axaY) ? t(d.axaY) + (unitate ? ' (' + unitate + ')' : '') : t(T.tabel),
        antete: [[{ text: capX }].concat(serii.map(function (s) { return { text: s.eticheta, num: true }; }))],
        randuri: rand.map(function (r) {
          return [{ text: etX(r.x), antet: true }].concat(r.valori.map(function (v) { return { text: fmt(v, zecTabel), num: true }; }));
        })
      });
    });

    function deseneaza() {
      if (!serii.length) { g.descrie(t(T.faraDate), t(T.faraDate)); return; }
      G.linii(ctx, g, {
        serii: serii,
        titluY: t(d.axaY),
        xIntregi: d.xAn || d.ordinal,
        yDeLaZero: d.yDeLaZero,
        inaltime: 300,
        formatTickX: etX,
        formatAntetX: etX,
        formatValoare: function (y) { return G.cuUnitate(fmt(y, zec), unitate); }
      });
      var xs = calc.xUnice(d.serii);
      var viz = serii.filter(function (s) { return s.vizibil; }).length;
      g.descrie(G.sablon(t(viz === 1 ? T.graficEticheta1 : T.graficEticheta), {
        axa: t(d.axaY) || t(T.valoare), n: fmt(viz, 0), de: G.de(viz), x0: etX(xs[0]), x1: etX(xs[xs.length - 1])
      }), t(T.graficDesc));
    }

    deseneaza();
    g.laRedimensionare(deseneaza);
    cad.incheie();
  }

  window.Atelier.inregistreaza('serie', { calc: calc, monteaza: monteaza });
})();
