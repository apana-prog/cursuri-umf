/* standardizare.js — standardizarea directă pe vârstă, pentru două populații.
 *
 * Calculează ratele specifice pe vârstă, rata brută și rata standardizată direct (la
 * „la” persoane) pentru fiecare populație, raportul ratelor brute și raportul ratelor
 * standardizate, și spune dacă ordinea celor două populații se inversează.
 * Ideea didactică: rata brută amestecă riscul cu structura pe vârstă.
 *
 *   rata specifică r_i = decese_i / populație_i
 *   rata brută = Σ decese / Σ populație  (= media ratelor specifice ponderată cu propria structură)
 *   rata standardizată direct = Σ w_i · r_i / Σ w_i  (w_i = populația standard; ponderile pot avea orice total)
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
    grupa: { ro: 'Grupa de vârstă', en: 'Age group' },
    decese: { ro: 'Decese', en: 'Deaths' },
    populatie: { ro: 'Populație', en: 'Population' },
    rataLa: { ro: 'Rata la {la}', en: 'Rate per {la}' },
    total: { ro: 'Total (rata brută)', en: 'Total (crude rate)' },
    standardSuma: { ro: 'Standard: suma celor două populații', en: 'Standard: sum of the two populations' },
    standardImplicit: { ro: 'Populația standard', en: 'Standard population' },
    legendaTabel: {
      ro: 'Rate specifice pe vârstă la {la}{de} persoane; ultima coloană arată ponderea fiecărei grupe în populația standard.',
      en: 'Age-specific rates per {la} persons; the last column shows each group’s share of the standard population.'
    },
    rataBruta: { ro: 'Rata brută', en: 'Crude rate' },
    rataStd: { ro: 'Rata standardizată', en: 'Standardized rate' },
    raportBrut: { ro: 'Raportul ratelor brute ({a} / {b})', en: 'Crude rate ratio ({a} / {b})' },
    raportStd: { ro: 'Raportul ratelor standardizate ({a} / {b})', en: 'Standardized rate ratio ({a} / {b})' },
    laPers: { ro: 'la {la}{de} persoane', en: 'per {la} persons' },
    graficEticheta: {
      ro: 'Rata brută și rata standardizată pe vârstă, la {la}{de} persoane, pentru {a} și {b}',
      en: 'Crude and age-standardized rates per {la} persons for {a} and {b}'
    },
    graficDesc: {
      ro: 'Coloane grupate: în stânga ratele brute, în dreapta ratele standardizate; o culoare pentru fiecare populație.',
      en: 'Grouped columns: crude rates on the left, standardized rates on the right; one colour per population.'
    },
    tabelGrafic: { ro: 'Ratele din grafic, la {la}{de} persoane', en: 'Rates shown in the chart, per {la} persons' },
    masura: { ro: 'Măsura', en: 'Measure' },
    raport: { ro: 'Raport {a} / {b}', en: 'Ratio {a} / {b}' },
    concInversare: {
      ro: 'Clasamentul se inversează. După rata brută, {sus1} are mortalitatea mai mare ({v1} față de {v2} la {la}); după standardizarea pe vârstă, {sus2} are rata mai mare ({w1} față de {w2}). Diferența brută venea din structura pe vârstă a populațiilor, nu dintr-un risc mai mare.',
      en: 'The ranking reverses. By the crude rate, {sus1} has the higher mortality ({v1} vs {v2} per {la}); after age standardization, {sus2} has the higher rate ({w1} vs {w2}). The crude difference came from the populations’ age structure, not from a higher risk.'
    },
    concAceeasi: {
      ro: 'Clasamentul nu se inversează: {sus} are rata mai mare și brut ({v1} față de {v2} la {la}), și standardizat ({w1} față de {w2}). Raportul ratelor trece de la {rb} (brut) la {rs} (standardizat).',
      en: 'The ranking does not reverse: {sus} has the higher rate both crude ({v1} vs {v2} per {la}) and standardized ({w1} vs {w2}). The rate ratio moves from {rb} (crude) to {rs} (standardized).'
    },
    concBruteEgale: {
      ro: 'Ratele brute sunt egale ({v1} la {la}), dar după standardizare {sus} are rata mai mare ({w1} față de {w2}): egalitatea brută ascundea o diferență de risc.',
      en: 'The crude rates are equal ({v1} per {la}), but after standardization {sus} has the higher rate ({w1} vs {w2}): the crude equality hid a difference in risk.'
    },
    concStdEgale: {
      ro: 'După standardizare ratele sunt egale ({w1} la {la}): diferența dintre ratele brute ({v1} față de {v2}) vine în întregime din structura pe vârstă.',
      en: 'After standardization the rates are equal ({w1} per {la}): the difference between the crude rates ({v1} vs {v2}) comes entirely from the age structure.'
    },
    concEgale: { ro: 'Ratele sunt egale atât brut, cât și standardizat.', en: 'The rates are equal both crude and standardized.' },
    concImposibil: {
      ro: 'Ratele nu pot fi calculate: fiecare grupă are nevoie de o populație pozitivă, iar standardul de ponderi pozitive.',
      en: 'The rates cannot be calculated: every group needs a positive population and the standard needs positive weights.'
    },
    anunt: {
      ro: 'Rate standardizate: {a} {w1}, {b} {w2} la {la}; clasamentul {stare} față de ratele brute.',
      en: 'Standardized rates: {a} {w1}, {b} {w2} per {la}; the ranking {stare} compared with the crude rates.'
    },
    seInverseaza: { ro: 'se inversează', en: 'reverses' },
    nuSeInverseaza: { ro: 'nu se inversează', en: 'does not reverse' },
    popImplicita: { ro: 'Populația {x}', en: 'Population {x}' }
  };

  var M = {
    douaPopulatii: { ro: 'Instrumentul compară exact două populații; s-au folosit primele două.', en: 'The tool compares exactly two populations; the first two were used.' },
    lipsaPopulatii: { ro: 'Lipsesc datele uneia dintre populații.', en: 'The data for one of the populations are missing.' },
    faraGrupe: { ro: 'Lipsesc etichetele grupelor de vârstă.', en: 'The age-group labels are missing.' },
    lungimi: { ro: 'Numărul de valori nu corespunde numărului de grupe; valorile lipsă au fost puse 0.', en: 'The number of values does not match the number of groups; missing values were set to 0.' },
    negativ: { ro: 'Decesele și populațiile nu pot fi negative; valorile negative au fost puse 0.', en: 'Deaths and populations cannot be negative; negative values were set to 0.' },
    decesePeste: { ro: 'Decesele nu pot depăși populația grupei; s-a folosit populația.', en: 'Deaths cannot exceed the group’s population; the population was used.' },
    populatieZero: { ro: 'O grupă are populația 0: rata ei nu poate fi calculată.', en: 'A group has a population of 0: its rate cannot be calculated.' },
    ponderiNegative: { ro: 'Ponderile standardului nu pot fi negative; au fost puse 0.', en: 'The standard’s weights cannot be negative; they were set to 0.' },
    ponderiZero: { ro: 'Ponderile standardului au suma 0; s-a folosit suma celor două populații.', en: 'The standard’s weights sum to 0; the sum of the two populations was used.' },
    faraStandard: { ro: 'Lipsește populația standard; s-a folosit suma celor două populații.', en: 'The standard population is missing; the sum of the two populations was used.' },
    la: { ro: 'Multiplicatorul „la” trebuie să fie pozitiv; s-a folosit 100 000.', en: 'The “la” multiplier must be positive; 100,000 was used.' },
    numarInvalid: { ro: 'Introduceți un număr (câmpul gol sau invalid a fost ignorat).', en: 'Enter a number (the empty or invalid field was ignored).' }
  };

  function tablou(x) { return Array.isArray(x) ? x : []; }

  var calc = {
    texte: T,
    mesaje: M,

    /* Citește și curăță configurația; nu aruncă niciodată. */
    normalizeaza: function (cfg) {
      cfg = cfg || {};
      var mesaje = [];
      function msg(m) { if (mesaje.indexOf(m) < 0) mesaje.push(m); }
      var pops = tablou(cfg.populatii);
      if (pops.length > 2) msg(M.douaPopulatii);
      if (pops.length < 2) msg(M.lipsaPopulatii);
      pops = pops.slice(0, 2);
      var grupe = tablou(cfg.grupe).slice();
      var n = grupe.length;
      if (!n) {
        n = 0;
        pops.forEach(function (p) { n = Math.max(n, tablou(p && p.decese).length, tablou(p && p.populatie).length); });
        for (var g = 0; g < n; g++) grupe.push(String(g + 1));
        msg(M.faraGrupe);
      }
      var populatii = [0, 1].map(function (j) {
        var p = pops[j] || {};
        var dec = tablou(p.decese), pop = tablou(p.populatie);
        if (pops[j] && (dec.length !== n || pop.length !== n)) msg(M.lungimi);
        var D = [], P = [];
        for (var i = 0; i < n; i++) {
          var d = numar(dec[i], 0), q = numar(pop[i], 0);
          if (d < 0 || q < 0) { msg(M.negativ); d = Math.max(0, d); q = Math.max(0, q); }
          if (d > q) { msg(M.decesePeste); d = q; }
          if (q === 0) msg(M.populatieZero);
          D.push(d); P.push(q);
        }
        var x = j ? 'B' : 'A';
        var implicit = { ro: sablon(T.popImplicita.ro, { x: x }), en: sablon(T.popImplicita.en, { x: x }) };
        return { nume: p.nume || implicit, decese: D, populatie: P };
      });
      var ponderi = null, standardSuma = false, numeStandard = null;
      if (cfg.standard && typeof cfg.standard === 'object' && Array.isArray(cfg.standard.ponderi)) {
        ponderi = [];
        for (var k = 0; k < n; k++) {
          var w = numar(cfg.standard.ponderi[k], 0);
          if (w < 0) { msg(M.ponderiNegative); w = 0; }
          ponderi.push(w);
        }
        if (cfg.standard.ponderi.length !== n) msg(M.lungimi);
        numeStandard = cfg.standard.nume || null;
        if (!(suma(ponderi) > 0)) { msg(M.ponderiZero); ponderi = null; standardSuma = true; }
      } else {
        if (cfg.standard !== 'suma') msg(M.faraStandard);
        standardSuma = true;
      }
      var la = numar(cfg.la, 100000);
      if (!(la > 0)) { msg(M.la); la = 100000; }
      var zec = Math.round(limiteaza(numar(cfg.zecimale, 1), 0, 4));
      return {
        grupe: grupe, populatii: populatii, ponderi: ponderi, standardSuma: standardSuma,
        numeStandard: numeStandard, la: la, zecimale: zec, editabil: !!cfg.editabil, mesaje: mesaje
      };
    },

    rateSpecifice: function (decese, populatie) {
      return decese.map(function (d, i) { return populatie[i] > 0 ? d / populatie[i] : null; });
    },

    rataBruta: function (decese, populatie) {
      var P = suma(populatie);
      return P > 0 ? suma(decese) / P : null;
    },

    /* Σ w·r / Σ w pe grupele cu pondere pozitivă; null dacă o astfel de grupă nu are rată. */
    rataStandardizata: function (rate, ponderi) {
      var W = 0, S = 0;
      for (var i = 0; i < rate.length; i++) {
        var w = ponderi[i];
        if (!(w > 0)) continue;
        if (rate[i] == null || !esteNumar(rate[i])) return null;
        S += w * rate[i];
        W += w;
      }
      return W > 0 ? S / W : null;
    },

    ponderiSuma: function (popA, popB) { return popA.map(function (p, i) { return p + (popB[i] || 0); }); },

    /* 1 dacă a > b, −1 dacă a < b, 0 dacă sunt egale (toleranță relativă 1e-9). */
    ordine: function (a, b) {
      if (!esteNumar(a) || !esteNumar(b)) return null;
      var tol = 1e-9 * Math.max(Math.abs(a), Math.abs(b), 1e-300);
      return Math.abs(a - b) <= tol ? 0 : (a > b ? 1 : -1);
    },

    /* d = {populatii: [{decese, populatie} ×2], ponderi | null, standardSuma, la} */
    calculeaza: function (d) {
      var A = d.populatii[0], B = d.populatii[1];
      var pond = d.standardSuma || !d.ponderi ? calc.ponderiSuma(A.populatie, B.populatie) : d.ponderi;
      var rate = [calc.rateSpecifice(A.decese, A.populatie), calc.rateSpecifice(B.decese, B.populatie)];
      var brute = [calc.rataBruta(A.decese, A.populatie), calc.rataBruta(B.decese, B.populatie)];
      var std = [calc.rataStandardizata(rate[0], pond), calc.rataStandardizata(rate[1], pond)];
      var la = d.la || 100000;
      function per(x) { return x == null ? null : x * la; }
      var ob = calc.ordine(brute[0], brute[1]), os = calc.ordine(std[0], std[1]);
      var W = suma(pond);
      return {
        ponderi: pond,
        fractiiStandard: pond.map(function (w) { return W > 0 ? w / W : null; }),
        rate: rate, brute: brute, standardizate: std,
        brutePerLa: brute.map(per), stdPerLa: std.map(per),
        raportBrut: brute[0] != null && brute[1] > 0 ? brute[0] / brute[1] : null,
        raportStd: std[0] != null && std[1] > 0 ? std[0] / std[1] : null,
        ordineBruta: ob, ordineStd: os,
        inversare: ob != null && os != null && ob * os === -1,
        la: la
      };
    },

    /* Propoziția de concluzie. nume = [A, B] (texte); tx(d) alege limba; fmt(x, zec) formatează. */
    concluzie: function (rez, nume, tx, fmt, zec) {
      var la = fmt(rez.la, 0);
      var b = rez.brutePerLa, s = rez.stdPerLa;
      if (rez.ordineBruta == null || rez.ordineStd == null) return tx(T.concImposibil);
      function f(x) { return fmt(x, zec); }
      var ob = rez.ordineBruta, os = rez.ordineStd;
      if (rez.inversare) {
        var i1 = ob > 0 ? 0 : 1, i2 = os > 0 ? 0 : 1;
        return sablon(tx(T.concInversare), {
          sus1: nume[i1], v1: f(b[i1]), v2: f(b[1 - i1]), la: la,
          sus2: nume[i2], w1: f(s[i2]), w2: f(s[1 - i2])
        });
      }
      if (ob === 0 && os === 0) return tx(T.concEgale);
      if (ob === 0) {
        var j = os > 0 ? 0 : 1;
        return sablon(tx(T.concBruteEgale), { v1: f(b[0]), la: la, sus: nume[j], w1: f(s[j]), w2: f(s[1 - j]) });
      }
      if (os === 0) return sablon(tx(T.concStdEgale), { w1: f(s[0]), la: la, v1: f(b[0]), v2: f(b[1]) });
      var k = ob > 0 ? 0 : 1;
      return sablon(tx(T.concAceeasi), {
        sus: nume[k], v1: f(b[k]), v2: f(b[1 - k]), la: la, w1: f(s[k]), w2: f(s[1 - k]),
        rb: fmt(rez.raportBrut, 2), rs: fmt(rez.raportStd, 2)
      });
    }
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = calc; return; }

  function monteaza(el, cfg, ctx) {
    var G = (window.Atelier && window.Atelier.grafic) || window.AtelierGrafic;
    if (!G) throw new Error('grafic.js nu este încărcat');
    var H = G.H, S = G.S, t = ctx.t;
    var cad = G.cadru(el, cfg, ctx);
    var d = calc.normalizeaza(cfg);
    var mesajeEd = {};
    function arataMesaje() {
      var lista = d.mesaje.slice();
      for (var k in mesajeEd) if (mesajeEd[k] && lista.indexOf(mesajeEd[k]) < 0) lista.push(mesajeEd[k]);
      cad.mesaje(lista);
    }
    arataMesaje();
    var nume = d.populatii.map(function (p) { return t(p.nume); });
    var la = d.la, zec = d.zecimale, laTxt = G.fmtN(ctx, la, 0);
    var numeStandard = d.standardSuma ? t(T.standardSuma) : (t(d.numeStandard) || t(T.standardImplicit));
    var zecDate = G.zecimaleNecesare([].concat(d.populatii[0].decese, d.populatii[0].populatie, d.populatii[1].decese, d.populatii[1].populatie), 2);
    var anunt = G.anuntator(ctx);
    var fmt = function (x, z) { return G.fmtN(ctx, x, z); };
    var uid = 'std-' + (ctx.id || 'w') + '-';
    var rez = null, stare = null;

    /* ---- tabelul ratelor specifice (editabil la cerere) ---- */
    var cutieTabel = H('div', { 'class': 'tabel-derulant w-tabel-std' }, cad.corp);
    var celRata = [[], []], celPondere = [], celTot = {};
    (function () {
      var tb = H('table', { 'class': 'w-tabel' + (d.editabil ? ' w-editabil' : '') }, cutieTabel);
      H('caption', null, tb, G.sablon(t(T.legendaTabel), { la: laTxt, de: G.de(la) }));
      var th = H('thead', null, tb);
      var r1 = H('tr', null, th), r2 = H('tr', null, th);
      H('th', { scope: 'col', rowspan: '2', id: uid + 'g' }, r1, t(T.grupa));
      d.populatii.forEach(function (p, j) {
        H('th', { scope: 'colgroup', colspan: '3', id: uid + 'p' + j }, r1, nume[j]);
        H('th', { scope: 'col', 'class': 'num', id: uid + 'd' + j }, r2, t(T.decese));
        H('th', { scope: 'col', 'class': 'num', id: uid + 'n' + j }, r2, t(T.populatie));
        H('th', { scope: 'col', 'class': 'num', id: uid + 'r' + j }, r2, G.sablon(t(T.rataLa), { la: laTxt }));
      });
      H('th', { scope: 'col', rowspan: '2', 'class': 'num', id: uid + 's' }, r1, numeStandard);
      var body = H('tbody', null, tb);
      d.grupe.forEach(function (gr, i) {
        var tr = H('tr', null, body);
        H('th', { scope: 'row', id: uid + 'g' + i }, tr, t(gr));
        d.populatii.forEach(function (p, j) {
          ['decese', 'populatie'].forEach(function (camp) {
            var td = H('td', { 'class': 'num' }, tr);
            var v = p[camp][i];
            if (d.editabil) {
              var inp = H('input', {
                type: 'number', min: '0', step: 'any', inputmode: 'decimal', value: String(v),
                'aria-labelledby': uid + 'g' + i + ' ' + uid + 'p' + j + ' ' + uid + (camp === 'decese' ? 'd' : 'n') + j
              }, td);
              inp.addEventListener('input', function () { laEditare(j, camp, i, inp); });
            } else td.textContent = fmt(v, zecDate);
          });
          celRata[j][i] = H('td', { 'class': 'num' }, tr);
        });
        celPondere[i] = H('td', { 'class': 'num' }, tr);
      });
      var tf = H('tfoot', null, tb);
      var trT = H('tr', { 'class': 'w-total' }, tf);
      H('th', { scope: 'row' }, trT, t(T.total));
      [0, 1].forEach(function (j) {
        celTot['d' + j] = H('td', { 'class': 'num' }, trT);
        celTot['n' + j] = H('td', { 'class': 'num' }, trT);
        celTot['r' + j] = H('td', { 'class': 'num' }, trT);
      });
      celTot.s = H('td', { 'class': 'num' }, trT);
    })();

    function laEditare(j, camp, i, inp) {
      var v = parseFloat(inp.value);
      var cheie = j + camp + i;
      if (!G.esteNumar(v)) { mesajeEd[cheie] = M.numarInvalid; arataMesaje(); return; }
      mesajeEd[cheie] = v < 0 ? M.negativ : null;
      d.populatii[j][camp][i] = Math.max(0, v);
      arataMesaje();
      recalculeaza(true);
    }

    var dl = G.dale(cad.corp);
    var conc = G.concluzie(cad.corp);
    G.legenda(ctx, cad.corp, nume.map(function (n, j) {
      return { cheie: 'p' + j, eticheta: n, culoare: ctx.culoareSerie(j), forma: 'dreptunghi' };
    }));
    var g = G.graficNou(ctx, cad.corp, { inaltime: 260 });
    var tv = G.vizualizareTabel(ctx, cad.corp, function () {
      var grupe = [t(T.rataBruta), t(T.rataStd)];
      var vals = [rez.brutePerLa, rez.stdPerLa], rap = [rez.raportBrut, rez.raportStd];
      return G.tabel({
        legenda: G.sablon(t(T.tabelGrafic), { la: laTxt, de: G.de(la) }),
        antete: [[{ text: t(T.masura) }, { text: nume[0], num: true }, { text: nume[1], num: true },
                  { text: G.sablon(t(T.raport), { a: 'A', b: 'B' }), num: true }]],
        randuri: grupe.map(function (gr, k) {
          return [{ text: gr, antet: true }, { text: fmt(vals[k][0], zec + 2), num: true },
                  { text: fmt(vals[k][1], zec + 2), num: true }, { text: fmt(rap[k], 4), num: true }];
        })
      });
    });

    function curate() {
      var ex = false;
      var pops = d.populatii.map(function (p) {
        return {
          decese: p.decese.map(function (x, i) { if (x > p.populatie[i]) ex = true; return Math.min(x, p.populatie[i]); }),
          populatie: p.populatie.slice()
        };
      });
      mesajeEd.peste = ex ? M.decesePeste : null;
      var zero = false;
      pops.forEach(function (p) { p.populatie.forEach(function (q) { if (!(q > 0)) zero = true; }); });
      mesajeEd.zero = zero ? M.populatieZero : null;
      return { populatii: pops, ponderi: d.ponderi, standardSuma: d.standardSuma, la: la };
    }

    function recalculeaza(anuntaAcum) {
      var date = curate();
      arataMesaje();
      rez = calc.calculeaza(date);
      d.grupe.forEach(function (gr, i) {
        [0, 1].forEach(function (j) {
          var r = rez.rate[j][i];
          celRata[j][i].textContent = fmt(r == null ? null : r * la, zec);
        });
        celPondere[i].textContent = ctx.fmtProc(rez.fractiiStandard[i], 1);
      });
      [0, 1].forEach(function (j) {
        celTot['d' + j].textContent = fmt(date.populatii[j].decese.reduce(function (a, b) { return a + b; }, 0), zecDate);
        celTot['n' + j].textContent = fmt(date.populatii[j].populatie.reduce(function (a, b) { return a + b; }, 0), zecDate);
        celTot['r' + j].textContent = fmt(rez.brutePerLa[j], zec);
      });
      celTot.s.textContent = ctx.fmtProc(1, 0);
      var laP = G.sablon(t(T.laPers), { la: laTxt, de: G.de(la) });
      dl.seteaza([
        { et: t(T.rataBruta) + ' · ' + nume[0], val: fmt(rez.brutePerLa[0], zec), sub: laP },
        { et: t(T.rataBruta) + ' · ' + nume[1], val: fmt(rez.brutePerLa[1], zec), sub: laP },
        { et: t(T.rataStd) + ' · ' + nume[0], val: fmt(rez.stdPerLa[0], zec), sub: laP },
        { et: t(T.rataStd) + ' · ' + nume[1], val: fmt(rez.stdPerLa[1], zec), sub: laP },
        { et: G.sablon(t(T.raportBrut), { a: 'A', b: 'B' }), val: fmt(rez.raportBrut, 2) },
        { et: G.sablon(t(T.raportStd), { a: 'A', b: 'B' }), val: fmt(rez.raportStd, 2) }
      ]);
      conc.seteaza(calc.concluzie(rez, nume, t, fmt, zec));
      deseneaza();
      tv.actualizeaza();
      if (anuntaAcum) {
        anunt(G.sablon(t(T.anunt), {
          a: nume[0], b: nume[1], w1: fmt(rez.stdPerLa[0], zec), w2: fmt(rez.stdPerLa[1], zec), la: laTxt,
          stare: t(rez.inversare ? T.seInverseaza : T.nuSeInverseaza)
        }));
      }
    }

    function deseneaza() {
      var f = g.masoara(), cont = g.goleste();
      var Hh = Math.round(250 + (f - 11) * 9);
      var grupe = [t(T.rataBruta), t(T.rataStd)];
      var vals = [rez.brutePerLa, rez.stdPerLa];
      var fin = [].concat(vals[0], vals[1]).filter(G.esteNumar);
      var vmax = fin.length ? G.maxim(fin) : 1;
      if (!(vmax > 0)) vmax = 1;
      var tY = G.tickuriFrumoase(0, vmax, Math.max(3, Math.round(55 / f)));
      var fmtY = function (v) { return fmt(v, tY.zecimale); };
      var latY = G.maxim(tY.valori.map(function (v) { return G.latimeText(fmtY(v), f); }));
      var sus = Math.round(f * 3.3), jos = Math.round(f * 2 + 10);
      var x0 = Math.round(latY + 10), x1 = G.LATIME - 6;
      var sy = G.scaraLiniara(tY.min, tY.max, Hh - jos, sus);
      g.inaltime(Hh);
      var fundal = S('g', null, cont);
      G.axaY(cont, { ticks: tY.valori, sy: sy, x0: x0, x1: x1, format: fmtY });
      var ax = S('g', { 'class': 'axa' }, cont);
      S('line', { x1: x0, x2: x1, y1: G.r1(sy(0)), y2: G.r1(sy(0)) }, ax);
      var grupW = (x1 - x0) / 2;
      var colW = Math.min(g.px(22), grupW / 5);
      var etVal = vals.map(function (r) { return r.map(function (v) { return fmt(v, zec); }); });
      var latVal = G.maxim([].concat(etVal[0], etVal[1]).map(function (s) { return G.latimeText(s, f); }));
      var dist = Math.max(colW + 6, latVal + 10);
      var cuValori = dist <= grupW * 0.9;
      if (!cuValori) dist = colW + 6;
      var latNume = G.maxim(nume.map(function (n) { return G.latimeText(n, f * 0.9); }));
      var cuNume = cuValori && latNume + 10 <= dist;
      var marcaje = S('g', null, cont);
      vals.forEach(function (r, k) {
        var cx = x0 + grupW * (k + 0.5);
        G.T(marcaje, cx, sy(0) + f + 8, grupe[k], 't-et', { 'text-anchor': 'middle' });
        r.forEach(function (v, j) {
          var cxj = cx + (j === 0 ? -dist / 2 : dist / 2);
          if (!G.esteNumar(v) || !(v > 0)) return;
          var y = sy(v);
          S('path', { d: G.caleBara(cxj - colW / 2, y, colW, sy(0) - y, 'sus', g.px(4)), 'class': 'w-bara', style: 'fill:' + ctx.culoareSerie(j) }, marcaje);
          if (cuValori) G.T(marcaje, cxj, y - 5, etVal[k][j], 't-val', { 'text-anchor': 'middle' });
          if (cuNume && k === 0) G.T(marcaje, cxj, y - 7 - f, nume[j], 't-mut t-mic', { 'text-anchor': 'middle' });
        });
      });
      stare = { fundal: fundal, x0: x0, grupW: grupW, sus: sus, sy: sy, vals: vals, grupe: grupe, Hh: Hh, jos: jos, dist: dist };
      g.descrie(G.sablon(t(T.graficEticheta), { la: laTxt, de: G.de(la), a: nume[0], b: nume[1] }), t(T.graficDesc));
    }

    G.interactiune(g, {
      n: function () { return 2; },
      index: function (ux, uy) {
        if (!stare || ux < stare.x0 || ux > stare.x0 + 2 * stare.grupW || uy > stare.Hh - stare.jos + 4) return -1;
        return ux < stare.x0 + stare.grupW ? 0 : 1;
      },
      arata: function (k) {
        G.golesteNod(stare.fundal);
        S('rect', { 'class': 'w-banda', x: G.r1(stare.x0 + k * stare.grupW + 4), y: 2, width: G.r1(stare.grupW - 8), height: G.r1(stare.Hh - stare.jos - 2), rx: 6 }, stare.fundal);
        var v = stare.vals[k];
        var sub = G.sablon(t(T.laPers), { la: laTxt, de: G.de(la) });
        var randuri = [0, 1].map(function (j) {
          return { culoare: ctx.culoareSerie(j), valoare: fmt(v[j], zec), eticheta: nume[j] + ' · ' + sub };
        });
        randuri.push({ valoare: fmt(k ? rez.raportStd : rez.raportBrut, 2), eticheta: G.sablon(t(T.raport), { a: 'A', b: 'B' }) });
        var top = G.maxim(v.filter(G.esteNumar).concat([0]));
        g.tooltip.arata(stare.grupe[k], randuri, stare.x0 + stare.grupW * (k + 0.5) + stare.dist / 2 + 12, stare.sy(top));
      },
      ascunde: function () { if (stare) G.golesteNod(stare.fundal); }
    });

    recalculeaza(false);
    g.laRedimensionare(deseneaza);
    cad.incheie();
  }

  window.Atelier.inregistreaza('standardizare', { calc: calc, monteaza: monteaza });
})();
