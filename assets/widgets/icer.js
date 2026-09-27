/* icer.js — planul cost-eficacitate.
 *
 * Pentru fiecare intervenție, față de comparator: Δcost (dc) și Δefect (de).
 *   ICER = dc / de (nedefinit pentru de = 0);
 *   cadranul: NE (mai eficace, mai scumpă — compromis), NV/NW (mai puțin eficace, mai scumpă —
 *   dominată), SE (mai eficace, mai ieftină — dominantă), SV/SW (mai puțin eficace, mai ieftină —
 *   compromis); pe axe: efect egal și cost mai mare = dominată, efect egal și cost mai mic =
 *   dominantă, cost egal și efect mai mare = dominantă, cost egal și efect mai mic = dominată;
 *   beneficiul monetar net BMN = prag × de − dc; decizia: cost-eficientă dacă BMN > 0.
 * În NE asta înseamnă ICER < prag; în SV, ICER > prag (economia pe unitatea de efect pierdută
 * depășește pragul). Linia pragului trece prin origine, cu panta egală cu pragul.
 */
(function () {
  'use strict';

  function esteNumar(x) { return typeof x === 'number' && isFinite(x); }
  function numar(x, i) { return esteNumar(x) ? x : i; }
  function limiteaza(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function sablon(t, v) {
    return String(t).replace(/\{([A-Za-z0-9_]+)\}/g, function (m, k) { return v[k] != null ? String(v[k]) : m; });
  }

  var T = {
    prag: { ro: 'Pragul de cost-eficacitate (disponibilitatea de plată)', en: 'Cost-effectiveness threshold (willingness to pay)' },
    pe: { ro: '{m}/{u}', en: '{m}/{u}' },
    dcost: { ro: 'Δ cost ({m})', en: 'Δ cost ({m})' },
    defect: { ro: 'Δ efect ({u})', en: 'Δ effect ({u})' },
    interventia: { ro: 'Intervenția', en: 'Intervention' },
    icer: { ro: 'ICER', en: 'ICER' },
    cadran: { ro: 'Cadranul', en: 'Quadrant' },
    bmn: { ro: 'Beneficiu monetar net', en: 'Net monetary benefit' },
    decizie: { ro: 'Decizia la acest prag', en: 'Decision at this threshold' },
    NE: { ro: 'NE', en: 'NE' }, NW: { ro: 'NV', en: 'NW' }, SE: { ro: 'SE', en: 'SE' }, SW: { ro: 'SV', en: 'SW' },
    O: { ro: 'origine', en: 'origin' },
    dominanta: { ro: 'dominantă', en: 'dominant' },
    dominata: { ro: 'dominată', en: 'dominated' },
    compromis: { ro: 'compromis', en: 'trade-off' },
    echivalenta: { ro: 'echivalentă', en: 'equivalent' },
    accepta: { ro: 'cost-eficientă', en: 'cost-effective' },
    respinge: { ro: 'nu e cost-eficientă', en: 'not cost-effective' },
    indiferent: { ro: 'la limită (BMN = 0)', en: 'borderline (NMB = 0)' },
    etNE: { ro: 'NE · compromis', en: 'NE · trade-off' },
    etNW: { ro: 'NV · dominată', en: 'NW · dominated' },
    etSE: { ro: 'SE · dominantă', en: 'SE · dominant' },
    etSW: { ro: 'SV · compromis', en: 'SW · trade-off' },
    etPrag: { ro: 'prag', en: 'threshold' },
    dCost: { ro: 'Δ cost', en: 'Δ cost' },
    dEfect: { ro: 'Δ efect', en: 'Δ effect' },
    legZona: { ro: 'Zona cost-eficientă la pragul ales (BMN > 0)', en: 'Cost-effective region at the chosen threshold (NMB > 0)' },
    legPrag: { ro: 'Linia pragului', en: 'Threshold line' },
    tabelRez: { ro: 'Rezultate la pragul de {prag}', en: 'Results at a threshold of {prag}' },
    tabelDate: { ro: 'Coordonatele punctelor din plan', en: 'Coordinates of the points in the plane' },
    graficEticheta: { ro: 'Planul cost-eficacitate: {n}{de} intervenții față de comparator, pragul {prag}', en: 'Cost-effectiveness plane: {n} interventions vs the comparator, threshold {prag}' },
    graficDesc: {
      ro: 'Axa orizontală: diferența de efect; axa verticală: diferența de cost; axele se intersectează în comparator. Zona colorată e cost-eficientă la pragul ales.',
      en: 'Horizontal axis: difference in effect; vertical axis: difference in cost; the axes cross at the comparator. The shaded region is cost-effective at the chosen threshold.'
    },
    concPrag: { ro: 'La pragul de {prag}', en: 'At a threshold of {prag}' },
    concAcc: { ro: 'sunt cost-eficiente: {lista}', en: 'cost-effective: {lista}' },
    concAcc1: { ro: 'este cost-eficientă: {lista}', en: 'cost-effective: {lista}' },
    concNiciuna: { ro: 'nicio intervenție nu este cost-eficientă', en: 'no intervention is cost-effective' },
    concResp: { ro: 'nu sunt cost-eficiente: {lista}', en: 'not cost-effective: {lista}' },
    concResp1: { ro: 'nu este cost-eficientă: {lista}', en: 'not cost-effective: {lista}' },
    concInd: { ro: 'la limită: {lista}', en: 'borderline: {lista}' },
    concSV: {
      ro: '{lista} (cadranul SV) trece pentru că economia pe fiecare {u} pierdut depășește pragul.',
      en: '{lista} (SW quadrant) passes because the saving per {u} lost exceeds the threshold.'
    }
  };

  var M = {
    faraInterventii: { ro: 'Configurația nu conține nicio intervenție.', en: 'The configuration contains no interventions.' },
    valori: { ro: 'O intervenție fără Δcost și Δefect numerice a fost omisă.', en: 'An intervention without numeric Δcost and Δeffect was omitted.' },
    prag: { ro: 'Pragul trebuie să fie un număr nenegativ; valoarea a fost limitată.', en: 'The threshold must be a non-negative number; the value was clamped.' }
  };

  var calc = {
    texte: T,
    mesaje: M,

    normalizeaza: function (cfg) {
      cfg = cfg || {};
      var mesaje = [];
      function msg(m) { if (mesaje.indexOf(m) < 0) mesaje.push(m); }
      var brute = Array.isArray(cfg.interventii) ? cfg.interventii : [];
      if (!brute.length) msg(M.faraInterventii);
      var interventii = [];
      brute.forEach(function (x, i) {
        if (!x || !esteNumar(x.dc) || !esteNumar(x.de)) { msg(M.valori); return; }
        interventii.push({ nume: x.nume != null ? x.nume : String(i + 1), dc: x.dc, de: x.de });
      });
      var prag = numar(cfg.prag, 50000);
      if (prag < 0) { msg(M.prag); prag = 0; }
      var pmin = Math.max(0, numar(cfg.prag_min, 0));
      var pmax = numar(cfg.prag_max, Math.max(prag * 3, 1));
      if (!(pmax > pmin)) pmax = pmin + Math.max(prag, 1) * 2;
      if (prag < pmin || prag > pmax) { msg(M.prag); prag = limiteaza(prag, pmin, pmax); }
      var pas = numar(cfg.pas, 0);
      if (!(pas > 0)) pas = Math.max((pmax - pmin) / 200, 1e-9);
      return {
        interventii: interventii, prag: prag, pragMin: pmin, pragMax: pmax, pas: pas,
        moneda: cfg.moneda || '', unitate: cfg.unitate_efect || '',
        zecCost: Math.round(limiteaza(numar(cfg.zecimale_cost, 0), 0, 3)),
        zecEfect: Math.round(limiteaza(numar(cfg.zecimale_efect, 2), 0, 4)),
        mesaje: mesaje
      };
    },

    cadran: function (dc, de) {
      if (de > 0 && dc > 0) return 'NE';
      if (de < 0 && dc > 0) return 'NW';
      if (de > 0 && dc < 0) return 'SE';
      if (de < 0 && dc < 0) return 'SW';
      if (de === 0 && dc === 0) return 'O';
      if (de === 0) return dc > 0 ? 'NW' : 'SE';
      return de > 0 ? 'SE' : 'NW';
    },

    statut: function (cadran) {
      return { NE: 'compromis', SW: 'compromis', NW: 'dominata', SE: 'dominanta', O: 'echivalenta' }[cadran];
    },

    analizeaza: function (dc, de, prag) {
      var cadran = calc.cadran(dc, de);
      var bmn = prag * de - dc;
      var tol = 1e-9 * Math.max(1, Math.abs(prag * de), Math.abs(dc));
      return {
        dc: dc, de: de, icer: de !== 0 ? dc / de : null, cadran: cadran, statut: calc.statut(cadran),
        bmn: bmn, decizie: bmn > tol ? 'accepta' : (bmn < -tol ? 'respinge' : 'indiferent')
      };
    },

    /* A doua formulare a deciziei (după ICER și cadran), pentru teste; de și dc nenule, prag > 0. */
    decizieDupaIcer: function (dc, de, prag) {
      var c = calc.cadran(dc, de), icer = dc / de;
      if (c === 'SE') return 'accepta';
      if (c === 'NW') return 'respinge';
      if (c === 'NE') return icer < prag ? 'accepta' : (icer > prag ? 'respinge' : 'indiferent');
      return icer > prag ? 'accepta' : (icer < prag ? 'respinge' : 'indiferent');
    },

    /* Segmentul dreptei y = panta·x din dreptunghiul [x0,x1]×[y0,y1]; null dacă nu-l traversează. */
    segmentPrag: function (panta, x0, x1, y0, y1) {
      var eps = 1e-9 * Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
      var pts = [];
      function adauga(x, y) {
        if (x >= x0 - eps && x <= x1 + eps && y >= y0 - eps && y <= y1 + eps) pts.push([x, y]);
      }
      adauga(x0, panta * x0);
      adauga(x1, panta * x1);
      if (panta !== 0) { adauga(y0 / panta, y0); adauga(y1 / panta, y1); }
      if (pts.length < 2) return null;
      pts.sort(function (a, b) { return a[0] - b[0]; });
      return [pts[0], pts[pts.length - 1]];
    },

    /* Poligonul {(x, y) din dreptunghi : y ≤ panta·x} — zona cu BMN ≥ 0 (tăiere Sutherland–Hodgman). */
    poligonAcceptabil: function (panta, x0, x1, y0, y1) {
      var poli = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], out = [];
      for (var i = 0; i < poli.length; i++) {
        var a = poli[i], b = poli[(i + 1) % poli.length];
        var fa = panta * a[0] - a[1], fb = panta * b[0] - b[1];
        if (fa >= 0) out.push(a);
        if ((fa >= 0) !== (fb >= 0)) {
          var t = fa / (fa - fb);
          out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
        }
      }
      return out;
    },

    ariePoligon: function (p) {
      var s = 0;
      for (var i = 0; i < p.length; i++) {
        var a = p[i], b = p[(i + 1) % p.length];
        s += a[0] * b[1] - b[0] * a[1];
      }
      return Math.abs(s) / 2;
    },

    /* Semi-lățimile simetrice ale planului (înainte de rotunjirea gradațiilor). */
    domeniu: function (interventii) {
      var X = 0, Y = 0;
      interventii.forEach(function (x) { X = Math.max(X, Math.abs(x.de)); Y = Math.max(Y, Math.abs(x.dc)); });
      return { X: X > 0 ? X * 1.2 : 1, Y: Y > 0 ? Y * 1.2 : 1 };
    },

    /* doarPrincipala: fără propoziția despre cadranul SV (pentru anunțul aria-live). */
    concluzie: function (rezultate, nume, pragTxt, tx, unitate, doarPrincipala) {
      var acc = [], resp = [], ind = [], sv = [];
      rezultate.forEach(function (r, i) {
        if (r.decizie === 'accepta') { acc.push(nume[i]); if (r.cadran === 'SW') sv.push(nume[i]); }
        else if (r.decizie === 'respinge') resp.push(nume[i]);
        else ind.push(nume[i]);
      });
      var parti = [];
      parti.push(acc.length ? sablon(tx(acc.length === 1 ? T.concAcc1 : T.concAcc), { lista: acc.join(', ') }) : tx(T.concNiciuna));
      if (resp.length) parti.push(sablon(tx(resp.length === 1 ? T.concResp1 : T.concResp), { lista: resp.join(', ') }));
      if (ind.length) parti.push(sablon(tx(T.concInd), { lista: ind.join(', ') }));
      var s = sablon(tx(T.concPrag), { prag: pragTxt }) + ', ' + parti.join('; ') + '.';
      if (sv.length && !doarPrincipala) s += ' ' + sablon(tx(T.concSV), { lista: sv.join(', '), u: unitate });
      return s;
    }
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = calc; return; }

  function monteaza(el, cfg, ctx) {
    var G = (window.Atelier && window.Atelier.grafic) || window.AtelierGrafic;
    if (!G) throw new Error('grafic.js nu este încărcat');
    var H = G.H, S = G.S, t = ctx.t, r1 = G.r1;
    var cad = G.cadru(el, cfg, ctx);
    var d = calc.normalizeaza(cfg);
    cad.mesaje(d.mesaje);
    var prag = d.prag;
    var moneda = t(d.moneda), unitate = t(d.unitate);
    var fmt = function (x, z) { return G.fmtN(ctx, x, z); };
    var nume = d.interventii.map(function (x) { return t(x.nume); });
    var nr = d.interventii.length;
    var anunt = G.anuntator(ctx);
    var rez = [], stare = null;
    function culoare(i) { return nr <= 3 ? ctx.culoareSerie(i) : ctx.culoareSerie(0); }
    function pragTxt(v) { return fmt(v, 0) + ' ' + sablon(t(T.pe), { m: moneda, u: unitate }); }
    function cost(v) { return G.cuUnitate(fmt(v, d.zecCost), moneda); }
    function efect(v) { return G.cuUnitate(fmt(v, d.zecEfect), unitate); }
    function icerTxt(r) {
      if (r.statut === 'dominanta' || r.statut === 'dominata' || r.statut === 'echivalenta' || r.icer == null) return t(T[r.statut]);
      return fmt(r.icer, 0) + ' ' + sablon(t(T.pe), { m: moneda, u: unitate });
    }

    var ctrl = H('div', { 'class': 'controale' }, cad.corp);
    G.cursor(ctx, ctrl, {
      eticheta: t(T.prag), min: d.pragMin, max: d.pragMax, pas: d.pas, valoare: prag, format: pragTxt,
      laSchimbare: function (v) { prag = v; recalculeaza(true); }
    });
    var cutieRez = H('div', { 'class': 'tabel-derulant' }, cad.corp);
    var conc = G.concluzie(cad.corp);
    var zonaLeg = H('div', null, cad.corp);
    var g = G.graficNou(ctx, cad.corp, { inaltime: 420 });
    var tv = G.vizualizareTabel(ctx, cad.corp, function () {
      var zE = Math.max(d.zecEfect, G.zecimaleNecesare(d.interventii.map(function (x) { return x.de; }), 4));
      var zC = Math.max(d.zecCost, G.zecimaleNecesare(d.interventii.map(function (x) { return x.dc; }), 4));
      return G.tabel({
        legenda: t(T.tabelDate),
        antete: [[{ text: t(T.interventia) }, { text: sablon(t(T.dcost), { m: moneda }), num: true }, { text: sablon(t(T.defect), { u: unitate }), num: true }]],
        randuri: d.interventii.map(function (x, i) {
          return [{ text: nume[i], antet: true }, { text: fmt(x.dc, zC), num: true }, { text: fmt(x.de, zE), num: true }];
        })
      });
    });

    function tabelRezultate() {
      G.golesteNod(cutieRez);
      cutieRez.appendChild(G.tabel({
        legenda: sablon(t(T.tabelRez), { prag: pragTxt(prag) }),
        antete: [[{ text: t(T.interventia) }, { text: sablon(t(T.dcost), { m: moneda }), num: true }, { text: sablon(t(T.defect), { u: unitate }), num: true },
                  { text: t(T.icer), num: true }, { text: t(T.cadran) }, { text: t(T.bmn), num: true }, { text: t(T.decizie) }]],
        randuri: rez.map(function (r, i) {
          return [{ text: nume[i], antet: true }, { text: fmt(r.dc, d.zecCost), num: true }, { text: fmt(r.de, d.zecEfect), num: true },
                  { text: icerTxt(r), num: true }, { text: t(T[r.cadran]) + ' · ' + t(T[r.statut]) },
                  { text: cost(r.bmn), num: true }, { text: t(T[r.decizie]) }];
        })
      }));
    }

    function deseneaza() {
      var f = g.masoara(), cont = g.goleste();
      var Hh = Math.round(400 + (f - 11) * 10);
      var dom = calc.domeniu(d.interventii);
      /* 6 intervale pe ambele axe la orice lățime: planul e simetric, iar un pas mai grosier
         ar dubla domeniul și ar strânge punctele la mijloc; etichetele X se răresc singure */
      var tX = G.tickuriFrumoase(-dom.X, dom.X, 6), tY = G.tickuriFrumoase(-dom.Y, dom.Y, 6);
      var fX = function (v) { return fmt(v, tX.zecimale); }, fY = function (v) { return fmt(v, tY.zecimale); };
      var latY = G.maxim(tY.valori.map(function (v) { return G.latimeText(fY(v), f); }));
      var sus = Math.round(f * 2.6), jos = Math.round(f * 3.6 + 8);
      var x0 = Math.round(latY + 10), x1 = G.LATIME - 8, y0 = sus, y1 = Hh - jos;
      var sx = G.scaraLiniara(tX.min, tX.max, x0, x1), sy = G.scaraLiniara(tY.min, tY.max, y1, y0);
      g.inaltime(Hh);
      var poli = calc.poligonAcceptabil(prag, tX.min, tX.max, tY.min, tY.max);
      if (poli.length > 2) {
        S('path', { d: 'M' + poli.map(function (p) { return r1(sx(p[0])) + ' ' + r1(sy(p[1])); }).join('L') + 'Z', 'class': 'w-zona-ce' }, cont);
      }
      G.axaY(cont, { ticks: tY.valori, sy: sy, x0: x0, x1: x1, format: fY });
      var gr = S('g', { 'class': 'grila' }, cont);
      tX.valori.forEach(function (v) { S('line', { x1: r1(sx(v)), x2: r1(sx(v)), y1: y0, y2: y1 }, gr); });
      G.axaX(cont, { ticks: tX.valori, sx: sx, y: y1, x0: x0, x1: x1, format: fX, font: f });
      S('line', { 'class': 'w-axa0', x1: r1(sx(0)), x2: r1(sx(0)), y1: y0, y2: y1 }, cont);
      S('line', { 'class': 'w-axa0', x1: x0, x2: x1, y1: r1(sy(0)), y2: r1(sy(0)) }, cont);
      G.T(cont, 0, Math.round(f * 1.1), sablon(t(T.dcost), { m: moneda }), 't-titlu-axa', { 'text-anchor': 'start' });
      G.T(cont, x1, Hh - 4, sablon(t(T.defect), { u: unitate }), 't-titlu-axa', { 'text-anchor': 'end' });
      var fm = f * 0.9;
      G.T(cont, x0 + 6, y0 + fm + 2, t(T.etNW), 't-mut t-mic', { 'text-anchor': 'start' });
      G.T(cont, x1 - 6, y0 + fm + 2, t(T.etNE), 't-mut t-mic', { 'text-anchor': 'end' });
      G.T(cont, x0 + 6, y1 - 6, t(T.etSW), 't-mut t-mic', { 'text-anchor': 'start' });
      G.T(cont, x1 - 6, y1 - 6, t(T.etSE), 't-mut t-mic', { 'text-anchor': 'end' });
      var seg = calc.segmentPrag(prag, tX.min, tX.max, tY.min, tY.max);
      var capPrag = null;
      if (seg) {
        var a = [sx(seg[0][0]), sy(seg[0][1])], b = [sx(seg[1][0]), sy(seg[1][1])];
        S('line', { 'class': 'w-referinta', x1: r1(a[0]), y1: r1(a[1]), x2: r1(b[0]), y2: r1(b[1]) }, cont);
        capPrag = b;
      }
      var cutiiFixe = [
        { x: x0 + 4, y: y0 + 2, w: G.latimeText(t(T.etNW), fm) + 4, h: fm + 4 },
        { x: x1 - 8 - G.latimeText(t(T.etNE), fm), y: y0 + 2, w: G.latimeText(t(T.etNE), fm) + 4, h: fm + 4 },
        { x: x0 + 4, y: y1 - 6 - fm, w: G.latimeText(t(T.etSW), fm) + 4, h: fm + 4 },
        { x: x1 - 8 - G.latimeText(t(T.etSE), fm), y: y1 - 6 - fm, w: G.latimeText(t(T.etSE), fm) + 4, h: fm + 4 }
      ];
      var puncte = d.interventii.map(function (x) { return [sx(x.de), sy(x.dc)]; });
      function cutii(texte) {
        return puncte.map(function (p, i) {
          var w = G.latimeText(texte[i], f) + 2;
          var dx = g.px(9), dreapta = p[0] + dx + w <= x1;
          return { x: dreapta ? p[0] + dx - 1 : p[0] - dx - w, y: p[1] - f / 2 - 1, w: w, h: f + 2, ancora: dreapta ? 'start' : 'end', tx: dreapta ? p[0] + dx : p[0] - dx };
        });
      }
      function seCiocnesc(c) {
        for (var i = 0; i < c.length; i++) {
          for (var j = i + 1; j < c.length; j++) if (G.seSuprapun(c[i], c[j])) return true;
          for (var k = 0; k < puncte.length; k++) {
            if (k !== i && G.seSuprapun(c[i], { x: puncte[k][0] - g.px(7), y: puncte[k][1] - g.px(7), w: g.px(14), h: g.px(14) })) return true;
          }
        }
        return false;
      }
      var texte = nume.slice(), numerotat = false;
      var c = cutii(texte);
      if (seCiocnesc(c)) { numerotat = true; texte = nume.map(function (n, i) { return String(i + 1); }); c = cutii(texte); }
      var marcaje = S('g', null, cont);
      puncte.forEach(function (p, i) {
        G.punct(marcaje, p[0], p[1], culoare(i), g.px(5), g.px(2));
        G.T(marcaje, c[i].tx, p[1], texte[i], 't-et', { 'text-anchor': c[i].ancora, dy: '0.32em' });
      });
      /* eticheta liniei pragului: prima poziție de-a lungul liniei care nu atinge etichetele
         cadranelor, punctele sau etichetele lor; dacă nu există, rămâne doar legenda */
      if (capPrag) {
        var ox = sx(0), oy = sy(0), et = t(T.etPrag), wp = G.latimeText(et, fm) + 2, ocupat = cutiiFixe.concat(c).concat(puncte.map(function (p) {
          return { x: p[0] - g.px(8), y: p[1] - g.px(8), w: g.px(16), h: g.px(16) };
        }));
        [0.85, 0.65, 0.45, 0.3].some(function (fr) {
          var px = ox + (capPrag[0] - ox) * fr, py = oy + (capPrag[1] - oy) * fr;
          return [[px + 6, py + fm + 4, 'start'], [px - 6, py - 6, 'end']].some(function (v) {
            var bx = v[2] === 'start' ? v[0] : v[0] - wp;
            var cut = { x: bx, y: v[1] - fm, w: wp, h: fm + 2 };
            if (cut.x < x0 || cut.x + cut.w > x1 || cut.y < y0 || cut.y + cut.h > y1) return false;
            if (ocupat.some(function (o) { return G.seSuprapun(cut, o); })) return false;
            G.T(cont, v[0], v[1], et, 't-et t-mic', { 'text-anchor': v[2] });
            return true;
          });
        });
      }
      var hover = S('g', null, cont);
      stare = { puncte: puncte, hover: hover };
      G.golesteNod(zonaLeg);
      var art = d.interventii.map(function (x, i) {
        return { cheie: 'i' + i, eticheta: (numerotat ? (i + 1) + ' · ' : '') + nume[i], culoare: culoare(i), forma: 'cerc' };
      });
      art.push({ cheie: 'zona', eticheta: t(T.legZona), culoare: 'var(--tint-green)', forma: 'zona' });
      art.push({ cheie: 'prag', eticheta: t(T.legPrag), culoare: 'var(--ink-2)', forma: 'prag' });
      G.legenda(ctx, zonaLeg, art);
      g.descrie(sablon(t(T.graficEticheta), { n: fmt(nr, 0), de: G.de(nr), prag: pragTxt(prag) }), t(T.graficDesc));
    }

    G.interactiune(g, {
      n: function () { return nr; },
      index: function (ux, uy) {
        if (!stare) return -1;
        var raza = g.px(24), best = -1, bd = raza * raza;
        stare.puncte.forEach(function (p, i) {
          var dd = (p[0] - ux) * (p[0] - ux) + (p[1] - uy) * (p[1] - uy);
          if (dd <= bd) { bd = dd; best = i; }
        });
        return best;
      },
      arata: function (i) {
        G.golesteNod(stare.hover);
        var p = stare.puncte[i], r = rez[i];
        G.punct(stare.hover, p[0], p[1], culoare(i), g.px(7), g.px(2));
        g.tooltip.arata(nume[i], [
          { culoare: culoare(i), valoare: cost(r.dc), eticheta: t(T.dCost) },
          { valoare: efect(r.de), eticheta: t(T.dEfect) },
          { valoare: icerTxt(r), eticheta: 'ICER · ' + t(T[r.cadran]) },
          { valoare: cost(r.bmn), eticheta: t(T.bmn) },
          { valoare: t(T[r.decizie]), eticheta: '' }
        ], p[0], p[1]);
      },
      ascunde: function () { if (stare) G.golesteNod(stare.hover); }
    });

    function recalculeaza(anuntaAcum) {
      rez = d.interventii.map(function (x) { return calc.analizeaza(x.dc, x.de, prag); });
      tabelRezultate();
      var text = calc.concluzie(rez, nume, pragTxt(prag), t, unitate);
      conc.seteaza(text);
      deseneaza();
      tv.actualizeaza();
      if (anuntaAcum) anunt(calc.concluzie(rez, nume, pragTxt(prag), t, unitate, true));
    }

    recalculeaza(false);
    g.laRedimensionare(deseneaza);
    cad.incheie();
  }

  window.Atelier.inregistreaza('icer', { calc: calc, monteaza: monteaza });
})();
