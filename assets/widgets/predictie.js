/* predictie.js — „Prezice, apoi verifică”: studentul trasează evoluția pe care o anticipează
 * pentru o serie de timp REALĂ (extrasă la construcție de date_sursa.py) și abia apoi vede
 * valorile observate.
 *
 * Rostul didactic: o predicție explicită activează cunoștințele anterioare și face vizibilă
 * surpriza; abaterea dintre estimare și date devine punctul de plecare al discuției.
 * Instrumentul nu afirmă nimic în afara datelor: rezultatul este abaterea măsurată, fără
 * nicio interpretare cauzală.
 *
 * Interacțiune: desen cu mouse-ul, cu degetul sau cu creionul în zona anilor de estimat;
 * de la tastatură (săgețile stânga/dreapta aleg anul, sus/jos modifică estimarea) sau prin
 * câmpurile numerice din „Estimări ca valori numerice”. Anii dintre punctele trasate se
 * completează prin interpolare liniară, pornind de la ultima valoare observată. Seria reală
 * se afișează numai după ce estimarea acoperă toți anii; tabelul de date nu arată valorile
 * observate ale anilor de estimat înainte de acest moment.
 *
 * cfg = { valori: "reale", serii: [{cheie, eticheta, puncte: [[an, valoare]]}],
 *         cunoscut_pana_la: 2015, y_domeniu: [min, max], axa_y, unitate, zecimale,
 *         afirmatii, sursa_text }
 */
(function () {
  'use strict';

  function esteNumar(x) { return typeof x === 'number' && isFinite(x); }
  function limiteaza(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function numar(x, i) { return esteNumar(x) ? x : i; }
  function rotunjeste(x, zec) { var p = Math.pow(10, zec || 0); var r = Math.round(x * p) / p; return r === 0 ? 0 : r; }

  var T = {
    graficEticheta: {
      ro: '{axa}: valori publicate {x0}–{xc}; anii {x1}–{x2} sunt de estimat',
      en: '{axa}: published values {x0}–{xc}; the years {x1}–{x2} are to be estimated'
    },
    graficEtichetaDezv: {
      ro: '{axa}: estimarea dumneavoastră și valorile publicate, {x0}–{x2}',
      en: '{axa}: your estimate and the published values, {x0}–{x2}'
    },
    graficDesc: {
      ro: 'Grafic de linii. Linia continuă arată valorile publicate, linia întreruptă, estimarea dumneavoastră. Săgețile stânga și dreapta aleg anul, săgețile sus și jos modifică estimarea.',
      en: 'Line chart. The solid line shows the published values, the dashed line your estimate. The left and right arrows choose the year, the up and down arrows change the estimate.'
    },
    zona: { ro: 'Trasați aici', en: 'Draw here' },
    observat: { ro: 'Valori publicate', en: 'Published values' },
    estimare: { ro: 'Estimarea dumneavoastră', en: 'Your estimate' },
    arata: { ro: 'Arată valorile publicate', en: 'Show the published values' },
    reia: { ro: 'Reia estimarea', en: 'Start again' },
    incomplet: { ro: 'Estimarea trebuie să acopere toți anii, până în {x2} inclusiv.', en: 'The estimate must cover every year, up to and including {x2}.' },
    abatereMedie: { ro: 'Abaterea medie', en: 'Mean deviation' },
    abatereMax: { ro: 'Cea mai mare abatere', en: 'Largest deviation' },
    peAni: { ro: 'pe {n}{de} ani estimați', en: 'over {n} estimated years' },
    inAnul: { ro: 'în {an}', en: 'in {an}' },
    concluzie: {
      ro: 'Estimarea dumneavoastră s-a abătut în medie cu {m} de la valorile publicate; cea mai mare diferență a fost în {an}: {est} estimat, față de {obs} publicat.',
      en: 'Your estimate deviated from the published values by {m} on average; the largest difference was in {an}: {est} estimated, against {obs} published.'
    },
    deEstimat: { ro: 'de estimat', en: 'to be estimated' },
    campuri: { ro: 'Estimări ca valori numerice', en: 'Estimates as numbers' },
    an: { ro: 'Anul', en: 'Year' },
    diferenta: { ro: 'Diferența', en: 'Difference' },
    tabel: { ro: 'Estimări și valori observate', en: 'Estimates and observed values' },
    anuntEstimare: { ro: 'Estimarea pentru {an}: {v}.', en: 'Estimate for {an}: {v}.' },
    anuntDezvaluit: { ro: 'Valorile publicate sunt afișate. Abaterea medie: {m}.', en: 'The published values are shown. Mean deviation: {m}.' },
    anuntReia: { ro: 'Estimarea a fost ștearsă.', en: 'The estimate has been cleared.' },
    faraDate: { ro: 'Fără date de afișat', en: 'No data to show' }
  };

  var M = {
    faraSerie: { ro: 'Configurația nu conține nicio serie.', en: 'The configuration contains no series.' },
    preaPutine: { ro: 'Seria are prea puține puncte pentru un exercițiu de estimare.', en: 'The series has too few points for an estimation exercise.' },
    taiere: {
      ro: 'Anul-limită („cunoscut_pana_la”) nu lasă ani de estimat; s-a folosit mijlocul seriei.',
      en: 'The cut-off year (“cunoscut_pana_la”) leaves no years to estimate; the middle of the series was used.'
    },
    campGol: { ro: 'Câmpul pentru anul {an} este gol; introduceți o valoare.', en: 'The field for {an} is empty; enter a value.' },
    inAfara: { ro: 'Valoarea pentru anul {an} a fost limitată la domeniul graficului ({min}–{max}).', en: 'The value for {an} was limited to the chart range ({min}–{max}).' }
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
      var serie = (Array.isArray(cfg.serii) ? cfg.serii : []).filter(function (s) { return s && Array.isArray(s.puncte); })[0] || null;
      var pts = [], vazut = {};
      if (!serie) mesaje.push(M.faraSerie);
      else {
        serie.puncte.forEach(function (p) {
          if (!Array.isArray(p) || !esteNumar(p[0]) || !esteNumar(p[1]) || vazut[p[0]]) return;
          vazut[p[0]] = 1;
          pts.push([p[0], p[1]]);
        });
        pts.sort(function (a, b) { return a[0] - b[0]; });
        if (pts.length < 3) mesaje.push(M.preaPutine);
      }
      var c = Number(cfg.cunoscut_pana_la);
      var cunoscute = pts.filter(function (p) { return p[0] <= c; });
      var deEstimat = pts.filter(function (p) { return p[0] > c; });
      if (pts.length >= 2 && (!cunoscute.length || !deEstimat.length)) {
        if (cfg.cunoscut_pana_la != null) mesaje.push(M.taiere);
        var k = Math.max(1, Math.floor(pts.length / 2));
        c = pts[k - 1][0];
        cunoscute = pts.slice(0, k);
        deEstimat = pts.slice(k);
      }
      var ys = pts.map(function (p) { return p[1]; });
      var mn = ys.length ? Math.min.apply(null, ys) : 0, mx = ys.length ? Math.max.apply(null, ys) : 1;
      var dom = Array.isArray(cfg.y_domeniu) && esteNumar(cfg.y_domeniu[0]) && esteNumar(cfg.y_domeniu[1]) && cfg.y_domeniu[0] < cfg.y_domeniu[1]
        ? [cfg.y_domeniu[0], cfg.y_domeniu[1]]
        : [Math.min(0, mn), mx === mn ? mx + 1 : mx + (mx - Math.min(0, mn)) * 0.6];
      return {
        eticheta: serie ? (serie.eticheta != null ? serie.eticheta : serie.cheie) : '',
        puncte: pts, cunoscute: cunoscute, deEstimat: deEstimat,
        ani: deEstimat.map(function (p) { return p[0]; }),
        taiere: cunoscute.length ? cunoscute[cunoscute.length - 1][0] : null,
        yDomeniu: dom,
        zecimale: Math.round(limiteaza(numar(cfg.zecimale, 1), 0, 3)),
        unitate: cfg.unitate || '', axaY: cfg.axa_y || '', mesaje: mesaje
      };
    },

    /* Estimările pentru fiecare an de estimat: valorile trasate, completate prin interpolare
     * liniară între punctele trasate și de la ultima valoare observată; după ultimul an
     * trasat, null (estimarea nu se prelungește de la sine). */
    completeaza: function (d, desen) {
      desen = desen || {};
      var repere = [];
      if (d.cunoscute.length) repere.push(d.cunoscute[d.cunoscute.length - 1]);
      d.ani.forEach(function (a) { if (esteNumar(desen[a])) repere.push([a, desen[a]]); });
      return d.ani.map(function (a) {
        if (esteNumar(desen[a])) return desen[a];
        var st = null, dr = null;
        repere.forEach(function (r) {
          if (r[0] < a) st = r;
          else if (r[0] > a && !dr) dr = r;
        });
        if (st && dr) return st[1] + (dr[1] - st[1]) * (a - st[0]) / (dr[0] - st[0]);
        return null;
      });
    },

    complet: function (d, desen) {
      var e = calc.completeaza(d, desen);
      return e.length > 0 && e.every(esteNumar);
    },

    /* Abaterea absolută medie și cea mai mare abatere (anul, estimarea, valoarea observată). */
    abateri: function (d, estimari) {
      var n = 0, s = 0, max = null;
      d.deEstimat.forEach(function (p, i) {
        var e = estimari[i];
        if (!esteNumar(e)) return;
        var dif = e - p[1];
        n++;
        s += Math.abs(dif);
        if (!max || Math.abs(dif) > Math.abs(max.dif) + 1e-12) max = { an: p[0], dif: dif, est: e, obs: p[1] };
      });
      return { n: n, medie: n ? s / n : null, max: max };
    },

    /* Un punct trasat: anul de estimat cel mai apropiat de x (null în afara zonei) și
     * valoarea limitată la domeniu, rotunjită la zecimalele afișate. */
    punctDesen: function (d, x, y) {
      if (!d.ani.length || !esteNumar(x) || !esteNumar(y) || x < d.taiere + 0.5) return null;
      var an = d.ani[0];
      d.ani.forEach(function (a) { if (Math.abs(a - x) < Math.abs(an - x)) an = a; });
      return { an: an, v: rotunjeste(limiteaza(y, d.yDomeniu[0], d.yDomeniu[1]), d.zecimale) };
    },

    /* Anii dintre două puncte trasate succesiv (mișcare rapidă a indicatorului). */
    umple: function (d, desen, a, b) {
      if (!a || !b || a.an === b.an) return desen;
      var st = a.an < b.an ? a : b, dr = a.an < b.an ? b : a;
      d.ani.forEach(function (an) {
        if (an > st.an && an < dr.an) desen[an] = rotunjeste(st.v + (dr.v - st.v) * (an - st.an) / (dr.an - st.an), d.zecimale);
      });
      return desen;
    }
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = calc; return; }

  function monteaza(el, cfg, ctx) {
    var G = (window.Atelier && window.Atelier.grafic) || window.AtelierGrafic;
    if (!G) throw new Error('grafic.js nu este încărcat');
    var t = ctx.t;
    var cad = G.cadru(el, cfg, ctx);
    var d = calc.normalizeaza(cfg);
    var fixe = d.mesaje.slice();
    cad.mesaje(fixe);
    var zec = d.zecimale, unitate = t(d.unitate);
    function fmt(x, z) { return G.fmtN(ctx, x, z == null ? zec : z); }
    function fmtU(x) { return G.cuUnitate(fmt(x), unitate); }
    var yMin = d.yDomeniu[0], yMax = d.yDomeniu[1];
    var pas = G.pasFrumos((yMax - yMin) / 40);
    var toateX = d.puncte.map(function (p) { return p[0]; });
    var obsLa = {};
    d.puncte.forEach(function (p) { obsLa[p[0]] = p[1]; });
    var cheie = 'predictie:' + ctx.id;
    var desen = {}, dezvaluit = false;
    var salvat = ctx.stocare.get(cheie, null);
    if (salvat && salvat.desen) {
      d.ani.forEach(function (a) { if (esteNumar(salvat.desen[a])) desen[a] = limiteaza(salvat.desen[a], yMin, yMax); });
      dezvaluit = !!salvat.dezvaluit && calc.complet(d, desen);
    }
    function salveaza() { ctx.stocare.set(cheie, { desen: desen, dezvaluit: dezvaluit }); }
    var culObs = ctx.culoareSerie(0), culEst = ctx.culoareSerie(1);

    G.legenda(ctx, cad.corp, [
      { cheie: 'obs', eticheta: t(T.observat), culoare: culObs, forma: 'linie' },
      { cheie: 'est', eticheta: t(T.estimare), culoare: culEst, forma: 'linie' }
    ]);
    var g = G.graficNou(ctx, cad.corp, { inaltime: 300 });
    g.svg.setAttribute('class', (g.svg.getAttribute('class') || '') + ' w-desen');
    var act = G.H('div', { 'class': 'w-actiuni' }, cad.corp);
    var bArata = G.H('button', { type: 'button', 'class': 'buton' }, act, t(T.arata));
    var bReia = G.H('button', { type: 'button', 'class': 'buton secundar' }, act, t(T.reia));
    var stare = G.H('p', { 'class': 'w-nota', 'aria-live': 'polite' }, act);
    var dale = G.dale(cad.corp);
    var conc = G.concluzie(cad.corp);
    conc.seteaza('');

    var det = G.H('details', { 'class': 'w-campuri' }, cad.corp);
    G.H('summary', null, det, t(T.campuri));
    var grila = G.H('div', { 'class': 'controale' }, det);
    var campuri = {};
    d.ani.forEach(function (a) {
      var lab = G.H('label', null, grila);
      G.H('span', null, lab, String(a));
      var inp = G.H('input', { type: 'number', step: String(pas), min: String(yMin), max: String(yMax), inputmode: 'decimal' }, lab);
      campuri[a] = inp;
      inp.addEventListener('input', function () {
        if (dezvaluit) return;
        var s = String(inp.value == null ? '' : inp.value).replace(',', '.').trim();
        var v = parseFloat(s);
        var mesaje = fixe.slice();
        if (s === '' || !esteNumar(v)) {
          delete desen[a];
          mesaje.push({ ro: sablon(M.campGol.ro, { an: a }), en: sablon(M.campGol.en, { an: a }) });
        } else {
          var lim = limiteaza(v, yMin, yMax);
          if (lim !== v) {
            mesaje.push({ ro: sablon(M.inAfara.ro, { an: a, min: fmt(yMin, 0), max: fmt(yMax, 0) }),
                          en: sablon(M.inAfara.en, { an: a, min: fmt(yMin, 0), max: fmt(yMax, 0) }) });
          }
          desen[a] = rotunjeste(lim, zec);
          ctx.anunta(sablon(t(T.anuntEstimare), { an: a, v: fmtU(desen[a]) }));
        }
        cad.mesaje(mesaje);
        salveaza();
        deseneaza();
        actualizeaza();
      });
    });

    var tab = G.vizualizareTabel(ctx, cad.corp, function () {
      var est = calc.completeaza(d, desen);
      var estLa = {};
      d.ani.forEach(function (a, i) { estLa[a] = est[i]; });
      return G.tabel({
        legenda: t(T.tabel) + (t(d.axaY) ? ' — ' + t(d.axaY) : ''),
        antete: [[{ text: t(T.an) }, { text: t(T.estimare), num: true }, { text: t(T.observat), num: true }, { text: t(T.diferenta), num: true }]],
        randuri: toateX.map(function (x) {
          var deEst = d.ani.indexOf(x) >= 0;
          var e = deEst ? estLa[x] : null;
          var o = !deEst || dezvaluit ? obsLa[x] : null;
          return [{ text: String(x), antet: true }, { text: deEst ? fmtU(e) : '', num: true },
                  { text: esteNumar(o) ? fmtU(o) : t(T.deEstimat), num: true },
                  { text: deEst && dezvaluit && esteNumar(e) ? fmt(e - o) : '', num: true }];
        })
      });
    });

    var L = null, sx = null, sy = null, hover = null, curent = -1, activTT = false;

    function deseneaza() {
      var f = g.masoara();
      var cont = g.goleste();
      if (!toateX.length) { g.descrie(t(T.faraDate), t(T.faraDate)); return; }
      var Hh = Math.round(300 + (f - 11) * 9);
      var tY = G.tickuriFrumoase(yMin, yMax, Math.max(4, Math.round(66 / f)));
      var fmtY = function (v) { return G.fmtN(ctx, v, tY.zecimale); };
      var latY = 0;
      tY.valori.forEach(function (v) { latY = Math.max(latY, G.latimeText(fmtY(v), f)); });
      L = { x0: Math.round(latY + 10), x1: G.LATIME - Math.round(f * 1.2), y0: Math.round(f * 2.6), y1: Hh - Math.round(f * 2 + 8) };
      var xmin = toateX[0], xmax = toateX[toateX.length - 1];
      if (xmin === xmax) { xmin -= 1; xmax += 1; }
      sx = G.scaraLiniara(xmin, xmax, L.x0, L.x1);
      sy = G.scaraLiniara(tY.min, tY.max, L.y1, L.y0);
      g.inaltime(Hh);
      if (t(d.axaY)) G.T(cont, 0, Math.round(f * 1.1), t(d.axaY), 't-titlu-axa', { 'text-anchor': 'start' });
      var xz = d.taiere != null ? sx(d.taiere) : L.x0;
      if (!dezvaluit && d.ani.length) {
        G.S('rect', { 'class': 'w-zona-desen', x: G.r1(xz), y: L.y0, width: G.r1(L.x1 - xz), height: G.r1(L.y1 - L.y0) }, cont);
      }
      G.axaY(cont, { ticks: tY.valori, sy: sy, x0: L.x0, x1: L.x1, format: fmtY });
      var tX = G.tickuriIntregi(xmin, xmax, Math.max(3, Math.round(80 / f)));
      G.axaX(cont, { ticks: tX.valori, sx: sx, y: L.y1, x0: L.x0, x1: L.x1, format: function (v) { return String(Math.round(v)); }, font: f });
      if (d.ani.length) G.S('line', { 'class': 'w-referinta', x1: G.r1(xz), x2: G.r1(xz), y1: L.y0, y2: L.y1 }, cont);
      if (!dezvaluit && d.ani.length && !Object.keys(desen).length) {
        var ht = t(T.zona), hw = G.latimeText(ht, f);
        if (hw + 16 < L.x1 - xz) G.T(cont, (xz + L.x1) / 2, (L.y0 + L.y1) / 2, ht, 't-et w-indiciu', { 'text-anchor': 'middle', dy: '0.32em' });
      }
      var obs = d.cunoscute.map(function (p) { return [sx(p[0]), sy(p[1])]; });
      G.S('path', { d: G.caleLinie(obs), 'class': 'w-linie', style: 'stroke:' + culObs }, cont);
      var est = calc.completeaza(d, desen);
      var anc = d.cunoscute[d.cunoscute.length - 1];
      if (est.some(esteNumar) && anc) {
        var pe = [[sx(anc[0]), sy(anc[1])]].concat(d.ani.map(function (a, i) { return esteNumar(est[i]) ? [sx(a), sy(est[i])] : null; }));
        G.S('path', { d: G.caleLinie(pe), 'class': 'w-linie w-linie-estimare', style: 'stroke:' + culEst }, cont);
        d.ani.forEach(function (a) {
          if (esteNumar(desen[a])) G.S('circle', { cx: G.r1(sx(a)), cy: G.r1(sy(desen[a])), r: G.r1(g.px(3)), style: 'fill:' + culEst }, cont);
        });
      }
      if (dezvaluit && anc) {
        var rest = [[sx(anc[0]), sy(anc[1])]].concat(d.deEstimat.map(function (p) { return [sx(p[0]), sy(p[1])]; }));
        var linieNoua = G.S('path', { d: G.caleLinie(rest), 'class': 'w-linie', style: 'stroke:' + culObs }, cont);
        if (deseneaza.animeaza && linieNoua.getTotalLength && linieNoua.animate) {
          deseneaza.animeaza = false;
          try {
            var lung = linieNoua.getTotalLength();
            linieNoua.animate([{ strokeDasharray: lung + ' ' + lung, strokeDashoffset: lung },
                               { strokeDasharray: lung + ' ' + lung, strokeDashoffset: 0 }],
                              { duration: 1100, easing: 'cubic-bezier(.3,.6,.2,1)' });
          } catch (err) { /* animația e opțională */ }
        }
      }
      hover = G.S('g', { 'class': 'w-hover' }, cont);
      var x0 = String(toateX[0]), x2 = String(toateX[toateX.length - 1]);
      g.descrie(dezvaluit
        ? sablon(t(T.graficEtichetaDezv), { axa: t(d.axaY) || t(T.observat), x0: x0, x2: x2 })
        : sablon(t(T.graficEticheta), { axa: t(d.axaY) || t(T.observat), x0: x0, xc: String(d.taiere), x1: String(d.ani[0] || ''), x2: x2 }),
        t(T.graficDesc));
      if (activTT && curent >= 0) arata(curent);
    }

    function arata(i) {
      if (!L || !hover || i < 0 || i >= toateX.length) return;
      curent = i;
      activTT = true;
      var x = toateX[i], X = sx(x);
      G.golesteNod(hover);
      G.S('line', { 'class': 'w-crosshair', x1: G.r1(X), x2: G.r1(X), y1: L.y0, y2: L.y1 }, hover);
      var randuri = [], yA = (L.y0 + L.y1) / 2;
      var deEst = d.ani.indexOf(x) >= 0;
      var o = !deEst || dezvaluit ? obsLa[x] : null;
      if (esteNumar(o)) {
        G.punct(hover, X, sy(o), culObs, g.px(4), g.px(2));
        yA = sy(o);
        randuri.push({ culoare: culObs, valoare: fmtU(o), eticheta: t(T.observat) });
      } else randuri.push({ culoare: culObs, valoare: '—', eticheta: t(T.deEstimat) });
      if (deEst) {
        var e = calc.completeaza(d, desen)[d.ani.indexOf(x)];
        if (esteNumar(e)) { G.punct(hover, X, sy(e), culEst, g.px(4), g.px(2)); yA = Math.min(yA, sy(e)); }
        randuri.push({ culoare: culEst, valoare: esteNumar(e) ? fmtU(e) : '—', eticheta: t(T.estimare) });
      }
      g.tooltip.arata(String(x), randuri, X, yA);
    }
    function ascunde() {
      activTT = false;
      g.tooltip.ascunde();
      if (hover) G.golesteNod(hover);
    }
    function coord(e) {
      var r = g.svg.getBoundingClientRect();
      if (!r.width) return null;
      var s = G.LATIME / r.width;
      return { ux: (e.clientX - r.left) * s, uy: (e.clientY - r.top) * s };
    }
    function indexLa(ux) {
      if (!sx) return -1;
      return G.celMaiApropiat(toateX, sx.invers(ux));
    }

    var desenez = false, ultim = null;
    function puncteaza(c) {
      if (dezvaluit || !L) return false;
      var p = calc.punctDesen(d, sx.invers(c.ux), sy.invers(c.uy));
      if (!p) return false;
      desen[p.an] = p.v;
      if (ultim) calc.umple(d, desen, ultim, p);
      ultim = p;
      deseneaza();
      arata(toateX.indexOf(p.an));
      return true;
    }
    function opreste() {
      if (!desenez) return;
      desenez = false;
      ultim = null;
      salveaza();
      sincronizeaza();
      actualizeaza();
    }
    g.svg.addEventListener('pointerdown', function (e) {
      var c = coord(e);
      if (!c) return;
      if (!dezvaluit && L && c.ux >= L.x0 - 8 && c.ux <= L.x1 + 8 && c.uy >= L.y0 - 8 && c.uy <= L.y1 + 8) {
        desenez = true;
        ultim = null;
        if (g.svg.setPointerCapture && e.pointerId != null) { try { g.svg.setPointerCapture(e.pointerId); } catch (err) { /* opțional */ } }
        if (puncteaza(c) && e.preventDefault) e.preventDefault();
      } else {
        var i = indexLa(c.ux);
        if (i >= 0) arata(i);
      }
    });
    g.svg.addEventListener('pointermove', function (e) {
      var c = coord(e);
      if (!c) return;
      if (desenez) { puncteaza(c); return; }
      if (L && (c.ux < L.x0 - 12 || c.ux > L.x1 + 12 || c.uy < L.y0 - 12 || c.uy > L.y1 + 12)) { ascunde(); return; }
      var i = indexLa(c.ux);
      if (i >= 0) arata(i);
    });
    g.svg.addEventListener('pointerup', opreste);
    g.svg.addEventListener('pointercancel', opreste);
    g.svg.addEventListener('pointerleave', function (e) { opreste(); if (e.pointerType !== 'touch') ascunde(); });
    document.addEventListener('pointerdown', function (e) { if (activTT && !g.svg.contains(e.target)) ascunde(); });
    g.svg.addEventListener('focus', function () {
      if (!toateX.length) return;
      if (curent < 0) curent = d.ani.length ? toateX.indexOf(d.ani[0]) : toateX.length - 1;
      arata(curent);
    });
    g.svg.addEventListener('blur', function () { opreste(); ascunde(); });
    g.svg.addEventListener('keydown', function (e) {
      var n = toateX.length;
      if (!n) return;
      if (curent < 0) curent = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        arata(limiteaza(curent + (e.key === 'ArrowRight' ? 1 : -1), 0, n - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        var an = toateX[curent];
        var k = d.ani.indexOf(an);
        if (!dezvaluit && k >= 0) {
          var baza = calc.completeaza(d, desen)[k];
          if (!esteNumar(baza)) baza = d.cunoscute.length ? d.cunoscute[d.cunoscute.length - 1][1] : (yMin + yMax) / 2;
          desen[an] = rotunjeste(limiteaza(baza + (e.key === 'ArrowUp' ? pas : -pas), yMin, yMax), zec);
          salveaza();
          deseneaza();
          sincronizeaza();
          actualizeaza();
          ctx.anunta(sablon(t(T.anuntEstimare), { an: an, v: fmtU(desen[an]) }));
        }
        arata(curent);
      } else if (e.key === 'Home') { e.preventDefault(); arata(0); }
      else if (e.key === 'End') { e.preventDefault(); arata(n - 1); }
      else if (e.key === 'Escape') ascunde();
    });

    function sincronizeaza() {
      d.ani.forEach(function (a) { campuri[a].value = esteNumar(desen[a]) ? String(desen[a]) : ''; });
    }

    function actualizeaza() {
      var complet = calc.complet(d, desen);
      if (complet && !dezvaluit) bArata.removeAttribute('disabled');
      else bArata.setAttribute('disabled', '');
      bArata.hidden = dezvaluit;
      stare.textContent = !dezvaluit && !complet && d.ani.length ? sablon(t(T.incomplet), { x2: d.ani[d.ani.length - 1] }) : '';
      if (dezvaluit) {
        var ab = calc.abateri(d, calc.completeaza(d, desen));
        dale.seteaza([
          { et: t(T.abatereMedie), val: fmtU(ab.medie), sub: sablon(t(T.peAni), { n: ab.n, de: G.de(ab.n) }) },
          { et: t(T.abatereMax), val: ab.max ? fmtU(Math.abs(ab.max.dif)) : '—', sub: ab.max ? sablon(t(T.inAnul), { an: ab.max.an }) : '' }
        ]);
        conc.seteaza(ab.max ? sablon(t(T.concluzie), { m: fmtU(ab.medie), an: ab.max.an, est: fmtU(ab.max.est), obs: fmtU(ab.max.obs) }) : '');
      } else {
        dale.seteaza([]);
        conc.seteaza('');
      }
      tab.actualizeaza();
    }

    bArata.addEventListener('click', function () {
      if (!calc.complet(d, desen)) return;
      dezvaluit = true;
      deseneaza.animeaza = true;
      salveaza();
      deseneaza();
      actualizeaza();
      var ab = calc.abateri(d, calc.completeaza(d, desen));
      ctx.anunta(sablon(t(T.anuntDezvaluit), { m: fmtU(ab.medie) }));
    });
    bReia.addEventListener('click', function () {
      desen = {};
      dezvaluit = false;
      salveaza();
      cad.mesaje(fixe);
      sincronizeaza();
      deseneaza();
      actualizeaza();
      ctx.anunta(t(T.anuntReia));
    });

    sincronizeaza();
    deseneaza();
    actualizeaza();
    g.laRedimensionare(deseneaza);
    cad.incheie();
  }

  window.Atelier.inregistreaza('predictie', { calc: calc, monteaza: monteaza });
})();
