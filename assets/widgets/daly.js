/* daly.js — calculatorul DALY, cu valori construite.
 *
 *   YLL = decese × ani pierduți per deces
 *   YLD = cazuri prevalente × ponderea dizabilității (abordarea bazată pe prevalență)
 *   DALY = YLL + YLD
 * Fără actualizare (discounting) și fără ponderare după vârstă — instrumentul o spune vizibil.
 * Bare orizontale suprapuse YLL | YLD, separate de un gol de 2px în culoarea suprafeței.
 * Ideea didactică: clasamentul după DALY poate diferi de cel după numărul de decese.
 */
(function () {
  'use strict';

  function esteNumar(x) { return typeof x === 'number' && isFinite(x); }
  function numar(x, i) { return esteNumar(x) ? x : i; }
  function limiteaza(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function sablon(t, v) {
    return String(t).replace(/\{([A-Za-z0-9_]+)\}/g, function (m, k) { return v[k] != null ? String(v[k]) : m; });
  }

  /* „de” între numeral și substantiv (română): 20 de, 100 de, 1794 de; dar 9, 108, 1815 fără. */
  function de(x) {
    if (typeof x !== 'number' || !isFinite(x) || Math.abs(x - Math.round(x)) > 1e-9) return '';
    var r = Math.round(Math.abs(x)) % 100;
    return (r === 0 && Math.round(x) !== 0) || r >= 20 ? ' de' : '';
  }

  var T = {
    conditia: { ro: 'Afecțiunea', en: 'Condition' },
    decese: { ro: 'Decese', en: 'Deaths' },
    ani: { ro: 'Ani pierduți per deces', en: 'Years lost per death' },
    cazuri: { ro: 'Cazuri prevalente', en: 'Prevalent cases' },
    pondere: { ro: 'Ponderea dizabilității', en: 'Disability weight' },
    yll: { ro: 'YLL', en: 'YLL' },
    yld: { ro: 'YLD', en: 'YLD' },
    daly: { ro: 'DALY', en: 'DALY' },
    yllLung: { ro: 'YLL: ani de viață pierduți prin deces prematur', en: 'YLL: years of life lost to premature death' },
    yldLung: { ro: 'YLD: ani trăiți cu dizabilitate', en: 'YLD: years lived with disability' },
    dalyTotal: { ro: 'DALY, total', en: 'DALY, total' },
    yllTotal: { ro: 'din care YLL', en: 'of which YLL' },
    yldTotal: { ro: 'din care YLD', en: 'of which YLD' },
    subTotal: { ro: 'suma afecțiunilor', en: 'sum over conditions' },
    dinDaly: { ro: '{p} din DALY', en: '{p} of DALY' },
    nota: {
      ro: 'Calcul simplificat: YLD pe baza prevalenței, fără actualizare (discounting) și fără ponderare după vârstă.',
      en: 'Simplified calculation: prevalence-based YLD, with no discounting and no age weighting.'
    },
    legendaTabel: { ro: 'Calculul pe afecțiuni: YLL = decese × ani pierduți; YLD = cazuri × pondere; DALY = YLL + YLD', en: 'Calculation by condition: YLL = deaths × years lost; YLD = cases × weight; DALY = YLL + YLD' },
    tabelGrafic: { ro: 'Valorile din grafic (ani de viață ajustați pentru dizabilitate)', en: 'Values in the chart (disability-adjusted life years)' },
    fractieYld: { ro: 'Ponderea YLD', en: 'YLD share' },
    graficEticheta: { ro: 'DALY pe afecțiuni, împărțiți în YLL și YLD', en: 'DALY by condition, split into YLL and YLD' },
    graficDesc: {
      ro: 'Bare orizontale suprapuse: segmentul din stânga e YLL, cel din dreapta YLD; totalul DALY e scris la capătul barei.',
      en: 'Stacked horizontal bars: the left segment is YLL, the right one YLD; the DALY total is written at the end of each bar.'
    },
    conc1: {
      ro: 'Cea mai mare povară o are {a}: {x} DALY, din care {p} din dizabilitate (YLD).',
      en: 'The largest burden is {a}: {x} DALY, of which {p} from disability (YLD).'
    },
    concAcelasi: { ro: 'Și după numărul de decese {a} ar fi pe primul loc.', en: 'By the number of deaths alone, {a} would also rank first.' },
    concAltul: {
      ro: 'După numărul de decese, pe primul loc ar fi {b} ({db}{de} decese, față de {da} pentru {a}): un clasament după decese ar ascunde povara afecțiunilor care nu ucid.',
      en: 'By deaths alone, {b} would rank first ({db} deaths, vs {da} for {a}): a ranking by deaths would hide the burden of conditions that do not kill.'
    },
    concZero: { ro: 'Cu aceste valori nu există nicio povară de comparat.', en: 'With these values there is no burden to compare.' },
    anunt: { ro: 'Cea mai mare povară: {a}, {x} DALY.', en: 'Largest burden: {a}, {x} DALY.' }
  };

  var M = {
    faraConditii: { ro: 'Configurația nu conține nicio afecțiune.', en: 'The configuration contains no conditions.' },
    negativ: { ro: 'Deceselor, anilor și cazurilor nu li se pot da valori negative; s-a folosit 0.', en: 'Deaths, years and cases cannot be negative; 0 was used.' },
    pondere: { ro: 'Ponderea dizabilității trebuie să fie între 0 și 1; valoarea a fost limitată.', en: 'The disability weight must be between 0 and 1; the value was clamped.' },
    numarInvalid: { ro: 'Introduceți un număr (câmpul gol sau invalid a fost ignorat).', en: 'Enter a number (the empty or invalid field was ignored).' }
  };

  var CAMPURI = ['decese', 'ani', 'cazuri', 'pondere'];

  var calc = {
    texte: T,
    mesaje: M,

    normalizeaza: function (cfg) {
      cfg = cfg || {};
      var mesaje = [];
      function msg(m) { if (mesaje.indexOf(m) < 0) mesaje.push(m); }
      var brute = Array.isArray(cfg.conditii) ? cfg.conditii.filter(function (c) { return c && typeof c === 'object'; }) : [];
      if (!brute.length) msg(M.faraConditii);
      var conditii = brute.map(function (c, i) {
        var o = {
          nume: c.nume != null ? c.nume : String(i + 1),
          decese: numar(c.decese, 0), ani: numar(c.ani_pierduti_per_deces, 0),
          cazuri: numar(c.cazuri_prevalente, 0), pondere: numar(c.pondere_dizabilitate, 0)
        };
        ['decese', 'ani', 'cazuri'].forEach(function (k) { if (o[k] < 0) { msg(M.negativ); o[k] = 0; } });
        if (o.pondere < 0 || o.pondere > 1) { msg(M.pondere); o.pondere = limiteaza(o.pondere, 0, 1); }
        return o;
      });
      return {
        conditii: conditii,
        zecimale: Math.round(limiteaza(numar(cfg.zecimale, 0), 0, 3)),
        editabil: !!cfg.editabil,
        sortare: cfg.sortare === 'original' ? 'original' : 'desc',
        mesaje: mesaje
      };
    },

    yll: function (decese, ani) { return decese * ani; },
    yld: function (cazuri, pondere) { return cazuri * pondere; },

    calculeaza: function (conditii) {
      return conditii.map(function (c) {
        var yll = calc.yll(c.decese, c.ani), yld = calc.yld(c.cazuri, c.pondere), daly = yll + yld;
        return { nume: c.nume, decese: c.decese, ani: c.ani, cazuri: c.cazuri, pondere: c.pondere,
                 yll: yll, yld: yld, daly: daly, fractieYld: daly > 0 ? yld / daly : null };
      });
    },

    totaluri: function (rez) {
      var s = { yll: 0, yld: 0, daly: 0, decese: 0 };
      rez.forEach(function (r) { s.yll += r.yll; s.yld += r.yld; s.daly += r.daly; s.decese += r.decese; });
      return s;
    },

    /* Indicii în ordinea afișării: descrescător după DALY (egalitățile păstrează ordinea din configurație). */
    ordine: function (rez, sortare) {
      var idx = rez.map(function (r, i) { return i; });
      if (sortare === 'original') return idx;
      return idx.sort(function (a, b) { return rez[b].daly - rez[a].daly || a - b; });
    },

    /* Indicele valorii maxime după un câmp (prima în caz de egalitate); -1 dacă totul e 0. */
    primul: function (rez, camp) {
      var b = -1;
      rez.forEach(function (r, i) { if (r[camp] > 0 && (b < 0 || r[camp] > rez[b][camp])) b = i; });
      return b;
    },

    concluzie: function (rez, nume, tx, fmt, fmtProc) {
      var iD = calc.primul(rez, 'daly');
      if (iD < 0) return tx(T.concZero);
      var s = sablon(tx(T.conc1), { a: nume[iD], x: fmt(rez[iD].daly, 0), p: fmtProc(rez[iD].fractieYld, 0) });
      var iM = calc.primul(rez, 'decese');
      var maxDec = iM < 0 ? 0 : rez[iM].decese;
      if (iM < 0 || rez[iD].decese === maxDec) return s + ' ' + sablon(tx(T.concAcelasi), { a: nume[iD] });
      return s + ' ' + sablon(tx(T.concAltul), { b: nume[iM], db: fmt(maxDec, 0), de: de(Math.round(maxDec)), da: fmt(rez[iD].decese, 0), a: nume[iD] });
    }
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = calc; return; }

  function monteaza(el, cfg, ctx) {
    var G = (window.Atelier && window.Atelier.grafic) || window.AtelierGrafic;
    if (!G) throw new Error('grafic.js nu este încărcat');
    var H = G.H, t = ctx.t;
    var cad = G.cadru(el, cfg, ctx);
    var d = calc.normalizeaza(cfg);
    var mesajeEd = {};
    function arataMesaje() {
      var lista = d.mesaje.slice();
      for (var k in mesajeEd) if (mesajeEd[k] && lista.indexOf(mesajeEd[k]) < 0) lista.push(mesajeEd[k]);
      cad.mesaje(lista);
    }
    arataMesaje();
    var zec = d.zecimale;
    var fmt = function (x, z) { return G.fmtN(ctx, x, z); };
    var nume = d.conditii.map(function (c) { return t(c.nume); });
    var anunt = G.anuntator(ctx);
    var uid = 'daly-' + (ctx.id || 'w') + '-';
    var rez = [], celule = [];

    H('p', { 'class': 'w-nota' }, cad.corp, t(T.nota));
    var cutie = H('div', { 'class': 'tabel-derulant' }, cad.corp);
    (function () {
      var tb = H('table', { 'class': 'w-tabel' + (d.editabil ? ' w-editabil' : '') }, cutie);
      H('caption', null, tb, t(T.legendaTabel));
      var tr = H('tr', null, H('thead', null, tb));
      var capete = [['c', T.conditia], ['decese', T.decese], ['ani', T.ani], ['cazuri', T.cazuri], ['pondere', T.pondere], ['yll', T.yll], ['yld', T.yld], ['daly', T.daly]];
      capete.forEach(function (c, j) { H('th', { scope: 'col', id: uid + c[0], 'class': j ? 'num' : null }, tr, t(c[1])); });
      var body = H('tbody', null, tb);
      d.conditii.forEach(function (c, i) {
        var rand = H('tr', null, body);
        H('th', { scope: 'row', id: uid + 'r' + i }, rand, nume[i]);
        var cel = {};
        CAMPURI.forEach(function (k) {
          var td = H('td', { 'class': 'num' }, rand);
          if (d.editabil) {
            var inp = H('input', {
              type: 'number', min: '0', max: k === 'pondere' ? '1' : null, step: 'any', inputmode: 'decimal', value: String(c[k]),
              'aria-labelledby': uid + 'r' + i + ' ' + uid + k
            }, td);
            inp.addEventListener('input', function () { laEditare(i, k, inp); });
          } else td.textContent = fmt(c[k], k === 'pondere' ? Math.max(2, G.zecimaleNecesare([c[k]], 4)) : G.zecimaleNecesare([c[k]], 2));
        });
        cel.yll = H('td', { 'class': 'num' }, rand);
        cel.yld = H('td', { 'class': 'num' }, rand);
        cel.daly = H('td', { 'class': 'num w-tare' }, rand);
        celule.push(cel);
      });
    })();

    function laEditare(i, k, inp) {
      var v = parseFloat(inp.value), cheie = i + k;
      if (!G.esteNumar(v)) { mesajeEd[cheie] = M.numarInvalid; arataMesaje(); return; }
      mesajeEd[cheie] = null;
      if (v < 0) { v = 0; mesajeEd[cheie] = M.negativ; }
      if (k === 'pondere' && v > 1) { v = 1; mesajeEd[cheie] = M.pondere; }
      d.conditii[i][k] = v;
      arataMesaje();
      recalculeaza(true);
    }

    var dl = G.dale(cad.corp);
    var conc = G.concluzie(cad.corp);
    G.legenda(ctx, cad.corp, [
      { cheie: 'yll', eticheta: t(T.yllLung), culoare: ctx.culoareSerie(0) },
      { cheie: 'yld', eticheta: t(T.yldLung), culoare: ctx.culoareSerie(1) }
    ]);
    var g = G.graficNou(ctx, cad.corp, { inaltime: 260 });
    var tv = G.vizualizareTabel(ctx, cad.corp, function () {
      return G.tabel({
        legenda: t(T.tabelGrafic),
        antete: [[{ text: t(T.conditia) }, { text: t(T.yll), num: true }, { text: t(T.yld), num: true }, { text: t(T.daly), num: true }, { text: t(T.fractieYld), num: true }]],
        randuri: calc.ordine(rez, d.sortare).map(function (i) {
          var r = rez[i];
          return [{ text: nume[i], antet: true }, { text: fmt(r.yll, 2), num: true }, { text: fmt(r.yld, 2), num: true },
                  { text: fmt(r.daly, 2), num: true }, { text: ctx.fmtProc(r.fractieYld, 1), num: true }];
        })
      });
    });

    function deseneaza() {
      var ord = calc.ordine(rez, d.sortare);
      G.bareOrizontale(ctx, g, {
        randuri: ord.map(function (i) {
          return {
            cheie: 'c' + i, eticheta: nume[i],
            segmente: [{ valoare: rez[i].yll, culoare: ctx.culoareSerie(0), nume: t(T.yll) },
                       { valoare: rez[i].yld, culoare: ctx.culoareSerie(1), nume: t(T.yld) }]
          };
        }),
        eticheteSegmente: true,
        formatValoare: function (v) { return fmt(v, zec); },
        textCapat: function (r, k) { return fmt(rez[ord[k]].daly, zec); },
        tooltip: function (k) {
          var r = rez[ord[k]];
          var pr = function (x) { return r.daly > 0 ? G.sablon(t(T.dinDaly), { p: ctx.fmtProc(x / r.daly, 0) }) : ''; };
          return {
            antet: nume[ord[k]],
            randuri: [
              { valoare: fmt(r.daly, zec), eticheta: t(T.daly) },
              { culoare: ctx.culoareSerie(0), valoare: fmt(r.yll, zec), eticheta: t(T.yll) + ' · ' + pr(r.yll) },
              { culoare: ctx.culoareSerie(1), valoare: fmt(r.yld, zec), eticheta: t(T.yld) + ' · ' + pr(r.yld) }
            ]
          };
        }
      });
      g.descrie(t(T.graficEticheta), t(T.graficDesc));
    }

    function recalculeaza(anuntaAcum) {
      rez = calc.calculeaza(d.conditii);
      rez.forEach(function (r, i) {
        celule[i].yll.textContent = fmt(r.yll, zec);
        celule[i].yld.textContent = fmt(r.yld, zec);
        celule[i].daly.textContent = fmt(r.daly, zec);
      });
      var s = calc.totaluri(rez);
      var pr = function (x) { return s.daly > 0 ? G.sablon(t(T.dinDaly), { p: ctx.fmtProc(x / s.daly, 0) }) : ''; };
      dl.seteaza([
        { et: t(T.dalyTotal), val: fmt(s.daly, zec), sub: t(T.subTotal) },
        { et: t(T.yllTotal), val: fmt(s.yll, zec), sub: pr(s.yll) },
        { et: t(T.yldTotal), val: fmt(s.yld, zec), sub: pr(s.yld) }
      ]);
      conc.seteaza(calc.concluzie(rez, nume, t, fmt, ctx.fmtProc));
      deseneaza();
      tv.actualizeaza();
      if (anuntaAcum) {
        var i = calc.primul(rez, 'daly');
        anunt(i < 0 ? t(T.concZero) : G.sablon(t(T.anunt), { a: nume[i], x: fmt(rez[i].daly, zec) }));
      }
    }

    recalculeaza(false);
    g.laRedimensionare(deseneaza);
    cad.incheie();
  }

  window.Atelier.inregistreaza('daly', { calc: calc, monteaza: monteaza });
})();
