/* sir.js — modelul SIR determinist, cu vaccinare înainte de start.
 *
 *   γ = 1 / durata infecției (zile);  β = R₀ · γ
 *   dS/dt = −β·S·I/N;  dI/dt = β·S·I/N − γ·I;  dR/dt = γ·I
 * Protejații prin vaccin pornesc în R: R(0) = (N − I₀) · acoperire · eficacitate;
 * S(0) = N − I₀ − R(0). Integrare Runge–Kutta de ordinul 4 cu pas fix de cel mult 0,1 zile
 * (10 subpași pe zi; mai mulți dacă β + γ > 10 pe zi, ca h·(β + γ) ≤ 1), valori raportate zilnic.
 * Afișează: R efectiv la start = R₀·S(0)/N, pragul imunității colective 1 − 1/R₀, ziua și
 * mărimea vârfului, rata de atac finală = (S(0) − S(T)) / N.
 * Ideea didactică: o acoperire peste prag (ajustată cu eficacitatea) împiedică o epidemie mare.
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
    r0: { ro: 'Numărul reproductiv de bază (R₀)', en: 'Basic reproduction number (R₀)' },
    acoperire_vaccinala: { ro: 'Acoperirea vaccinală', en: 'Vaccination coverage' },
    eficacitate_vaccin: { ro: 'Eficacitatea vaccinului', en: 'Vaccine efficacy' },
    durata_infectie_zile: { ro: 'Durata infecțiozității (zile)', en: 'Infectious period (days)' },
    S: { ro: 'Susceptibili (S)', en: 'Susceptible (S)' },
    I: { ro: 'Infectați (I)', en: 'Infected (I)' },
    R: { ro: 'Imuni (R)', en: 'Immune (R)' },
    ziua: { ro: 'Ziua {z}', en: 'Day {z}' },
    zi: { ro: 'Ziua', en: 'Day' },
    persoane: { ro: 'Persoane', en: 'People' },
    reff: { ro: 'R efectiv la start', en: 'Effective R at the start' },
    subReff: { ro: 'R₀ × S(0) / N', en: 'R₀ × S(0) / N' },
    prag: { ro: 'Pragul imunității colective', en: 'Herd-immunity threshold' },
    subPrag: { ro: '1 − 1/R₀', en: '1 − 1/R₀' },
    necesar: { ro: 'Acoperirea vaccinală necesară', en: 'Coverage needed' },
    subNecesar: { ro: 'pragul ÷ eficacitatea', en: 'threshold ÷ efficacy' },
    imposibil: { ro: 'de neatins', en: 'unreachable' },
    varf: { ro: 'Vârful epidemiei', en: 'Epidemic peak' },
    subVarf: { ro: '{v}{de} infectați simultan ({p} din populație)', en: '{v} infected at once ({p} of the population)' },
    atac: { ro: 'Rata de atac finală', en: 'Final attack rate' },
    subAtac: { ro: 'din populație, în {z}{de} zile', en: 'of the population, over {z} days' },
    refS: { ro: 'S = N/R₀: aici I atinge vârful', en: 'S = N/R₀: I peaks here' },
    graficEticheta: { ro: 'Modelul SIR pe {z}{de} zile: susceptibili, infectați și imuni', en: 'SIR model over {z} days: susceptible, infected and immune' },
    graficDesc: {
      ro: 'Trei linii: susceptibili, infectați și imuni (recuperați sau protejați prin vaccin), în persoane, zi de zi.',
      en: 'Three lines: susceptible, infected and immune (recovered or protected by the vaccine), in people, day by day.'
    },
    tabel: { ro: 'Valorile zilnice ale modelului (persoane)', en: 'Daily model values (people)' },
    conc1: {
      ro: '{p} din populație pornește protejată (acoperire {c} × eficacitate {e}), {poz} pragul imunității colective de {prag}.',
      en: '{p} of the population starts protected (coverage {c} × efficacy {e}), {poz} the herd-immunity threshold of {prag}.'
    },
    peste: { ro: 'peste', en: 'above' },
    sub: { ro: 'sub', en: 'below' },
    concFara: {
      ro: 'R efectiv la start este {reff}: numărul de infectați scade de la început și nu apare o epidemie mare.',
      en: 'The effective R at the start is {reff}: the number of infected falls from the outset and no large outbreak occurs.'
    },
    concEpidemie: {
      ro: 'R efectiv la start este {reff}: epidemia atinge vârful în ziua {zi}, cu {v}{de1} persoane infectate simultan, iar în {z}{de2} zile se infectează {atac} din populație.',
      en: 'The effective R at the start is {reff}: the epidemic peaks on day {zi} with {v} people infected at once, and {atac} of the population is infected within {z} days.'
    },
    concR0: {
      ro: 'Cu R₀ = {r0}, fiecare caz produce în medie cel mult un caz nou: nu apare o epidemie, indiferent de vaccinare.',
      en: 'With R₀ = {r0}, each case causes at most one new case on average: no epidemic occurs, whatever the vaccination.'
    },
    anuntFara: { ro: 'R efectiv {reff}: nu apare o epidemie mare.', en: 'Effective R {reff}: no large outbreak.' },
    anuntEpidemie: { ro: 'R efectiv {reff}: vârf în ziua {zi} cu {v}{de} infectați; rata de atac {atac}.', en: 'Effective R {reff}: peak on day {zi} with {v} infected; attack rate {atac}.' }
  };

  var M = {
    r0: { ro: 'R₀ trebuie să fie pozitiv (0,1–50); valoarea a fost limitată.', en: 'R₀ must be positive (0.1–50); the value was clamped.' },
    durata: { ro: 'Durata infecțiozității trebuie să fie între 0,5 și 365 de zile; valoarea a fost limitată.', en: 'The infectious period must be between 0.5 and 365 days; the value was clamped.' },
    populatie: { ro: 'Populația trebuie să fie de cel puțin o persoană; s-a folosit 100 000.', en: 'The population must be at least one person; 100,000 was used.' },
    infectati: { ro: 'Infectații inițiali trebuie să fie între 0 și populație; valoarea a fost limitată.', en: 'Initial infections must be between 0 and the population; the value was clamped.' },
    proportie: { ro: 'Acoperirea și eficacitatea trebuie să fie între 0 și 1; valoarea a fost limitată.', en: 'Coverage and efficacy must be between 0 and 1; the value was clamped.' },
    zile: { ro: 'Numărul de zile trebuie să fie între 1 și 1000; valoarea a fost limitată.', en: 'The number of days must be between 1 and 1000; the value was clamped.' }
  };

  var CURSOARE = ['r0', 'acoperire_vaccinala', 'eficacitate_vaccin', 'durata_infectie_zile'];
  var INTERVALE = { r0: [0.5, 10, 0.1], acoperire_vaccinala: [0, 1, 0.01], eficacitate_vaccin: [0, 1, 0.01], durata_infectie_zile: [1, 30, 0.5] };

  var calc = {
    texte: T,
    mesaje: M,

    normalizeaza: function (cfg) {
      cfg = cfg || {};
      var mesaje = [];
      function msg(m) { if (mesaje.indexOf(m) < 0) mesaje.push(m); }
      function cuLimite(v, implicit, a, b, m) {
        var x = numar(v, implicit);
        if (x < a || x > b) { msg(m); x = limiteaza(x, a, b); }
        return x;
      }
      var p = {};
      p.r0 = cuLimite(cfg.r0, 3, 0.1, 50, M.r0);
      p.durata = cuLimite(cfg.durata_infectie_zile, 7, 0.5, 365, M.durata);
      p.populatie = numar(cfg.populatie, 100000);
      if (!(p.populatie >= 1)) { msg(M.populatie); p.populatie = 100000; }
      p.infectati = cuLimite(cfg.infectati_initial, 10, 0, p.populatie, M.infectati);
      p.acoperire = cuLimite(cfg.acoperire_vaccinala, 0, 0, 1, M.proportie);
      p.eficacitate = cuLimite(cfg.eficacitate_vaccin, 1, 0, 1, M.proportie);
      p.zile = Math.round(cuLimite(cfg.zile, 180, 1, 1000, M.zile));
      var iv = cfg.intervale || {};
      var intervale = {};
      CURSOARE.forEach(function (k) {
        var impl = INTERVALE[k], a = Array.isArray(iv[k]) ? iv[k] : impl;
        var lo = numar(a[0], impl[0]), hi = numar(a[1], impl[1]), pas = numar(a[2], impl[2]);
        if (!(hi > lo)) { lo = impl[0]; hi = impl[1]; }
        intervale[k] = [lo, hi, pas > 0 ? pas : impl[2]];
      });
      var v = { r0: p.r0, acoperire_vaccinala: p.acoperire, eficacitate_vaccin: p.eficacitate, durata_infectie_zile: p.durata };
      CURSOARE.forEach(function (k) {
        intervale[k][0] = Math.min(intervale[k][0], v[k]);
        intervale[k][1] = Math.max(intervale[k][1], v[k]);
      });
      var cursoare = Array.isArray(cfg.cursoare) ? cfg.cursoare.filter(function (k) { return CURSOARE.indexOf(k) >= 0; }) : ['r0', 'acoperire_vaccinala', 'eficacitate_vaccin'];
      p.intervale = intervale;
      p.cursoare = cursoare;
      p.mesaje = mesaje;
      return p;
    },

    derivate: function (S, I, beta, gamma, N) {
      var inf = beta * S * I / N, rec = gamma * I;
      return [-inf, inf - rec, rec];
    },

    pasRK4: function (S, I, R, h, beta, gamma, N) {
      var d = calc.derivate;
      var k1 = d(S, I, beta, gamma, N);
      var k2 = d(S + h / 2 * k1[0], I + h / 2 * k1[1], beta, gamma, N);
      var k3 = d(S + h / 2 * k2[0], I + h / 2 * k2[1], beta, gamma, N);
      var k4 = d(S + h * k3[0], I + h * k3[1], beta, gamma, N);
      return [
        S + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
        I + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
        R + h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])
      ];
    },

    pragImunitate: function (r0) { return r0 > 1 ? 1 - 1 / r0 : 0; },

    acoperireNecesara: function (r0, eficacitate) {
      var p = calc.pragImunitate(r0);
      if (p === 0) return 0;
      return eficacitate > 0 ? p / eficacitate : Infinity;
    },

    /* p = {r0, durata, populatie, infectati, acoperire, eficacitate, zile} */
    simuleaza: function (p) {
      var N = p.populatie, gamma = 1 / p.durata, beta = p.r0 * gamma;
      var I0 = Math.min(Math.max(p.infectati, 0), N);
      var prot = (N - I0) * p.acoperire * p.eficacitate;
      var S = N - I0 - prot, I = I0, R = prot, S0 = S;
      var pasi = Math.max(10, Math.ceil(beta + gamma));
      var h = 1 / pasi;
      var zile = [0], Sa = [S], Ia = [I], Ra = [R];
      var varf = { zi: 0, I: I }, vExact = { t: 0, I: I, S: S };
      for (var z = 1; z <= p.zile; z++) {
        for (var k = 0; k < pasi; k++) {
          var n = calc.pasRK4(S, I, R, h, beta, gamma, N);
          S = n[0]; I = n[1]; R = n[2];
          if (I > vExact.I) vExact = { t: z - 1 + (k + 1) * h, I: I, S: S };
        }
        zile.push(z); Sa.push(S); Ia.push(I); Ra.push(R);
        if (I > varf.I) varf = { zi: z, I: I };
      }
      return {
        zile: zile, S: Sa, I: Ia, R: Ra, N: N, S0: S0, I0: I0, Rinit: prot, beta: beta, gamma: gamma, pasiPeZi: pasi,
        varf: varf, varfExact: vExact,
        rEfectiv: p.r0 * S0 / N,
        prag: calc.pragImunitate(p.r0),
        acoperireNecesara: calc.acoperireNecesara(p.r0, p.eficacitate),
        protejati: prot / N,
        atac: (S0 - S) / N
      };
    },

    concluzie: function (rez, p, tx, fmt, fmtProc) {
      if (p.r0 <= 1) return sablon(tx(T.concR0), { r0: fmt(p.r0, 1) });
      var s = sablon(tx(T.conc1), {
        p: fmtProc(p.acoperire * p.eficacitate, 1), c: fmtProc(p.acoperire, 0), e: fmtProc(p.eficacitate, 0),
        poz: tx(p.acoperire * p.eficacitate >= rez.prag ? T.peste : T.sub), prag: fmtProc(rez.prag, 1)
      });
      if (rez.rEfectiv <= 1 || rez.varf.zi === 0) return s + ' ' + sablon(tx(T.concFara), { reff: fmt(rez.rEfectiv, 2) });
      return s + ' ' + sablon(tx(T.concEpidemie), {
        reff: fmt(rez.rEfectiv, 2), zi: rez.varf.zi, v: fmt(rez.varf.I, 0), de1: de(Math.round(rez.varf.I)),
        z: p.zile, de2: de(p.zile), atac: fmtProc(rez.atac, 1)
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
    var fmt = function (x, z) { return G.fmtN(ctx, x, z); };
    var anunt = G.anuntator(ctx);
    var rez = null;
    var serii = [
      { cheie: 'S', eticheta: t(T.S), culoare: ctx.culoareSerie(0), vizibil: true },
      { cheie: 'I', eticheta: t(T.I), culoare: ctx.culoareSerie(1), vizibil: true },
      { cheie: 'R', eticheta: t(T.R), culoare: ctx.culoareSerie(2), vizibil: true }
    ];
    var camp = { r0: 'r0', acoperire_vaccinala: 'acoperire', eficacitate_vaccin: 'eficacitate', durata_infectie_zile: 'durata' };

    if (p.cursoare.length) {
      var ctrl = H('div', { 'class': 'controale' }, cad.corp);
      p.cursoare.forEach(function (k) {
        var iv = p.intervale[k], proc = k === 'acoperire_vaccinala' || k === 'eficacitate_vaccin';
        G.cursor(ctx, ctrl, {
          eticheta: t(T[k]), min: iv[0], max: iv[1], pas: iv[2], valoare: p[camp[k]],
          rotunjire: function (v) { return G.rotunjeste(v, 4); },
          format: function (v) { return proc ? ctx.fmtProc(v, 0) : fmt(v, 1); },
          laSchimbare: function (v) { p[camp[k]] = v; recalculeaza(true); }
        });
      });
    }
    var dl = G.dale(cad.corp);
    var conc = G.concluzie(cad.corp);
    G.legenda(ctx, cad.corp, serii.map(function (s) {
      return { cheie: s.cheie, eticheta: s.eticheta, culoare: s.culoare, forma: 'linie' };
    }), {
      comutabil: true,
      laComutare: function (cheie, activ) {
        serii.forEach(function (s) { if (s.cheie === cheie) s.vizibil = activ; });
        deseneaza();
      }
    });
    var g = G.graficNou(ctx, cad.corp, { inaltime: 300 });
    var tv = G.vizualizareTabel(ctx, cad.corp, function () {
      return G.tabel({
        legenda: t(T.tabel),
        antete: [[{ text: t(T.zi) }, { text: t(T.S), num: true }, { text: t(T.I), num: true }, { text: t(T.R), num: true }]],
        randuri: rez.zile.map(function (z, i) {
          return [{ text: String(z), antet: true }, { text: fmt(rez.S[i], 1), num: true }, { text: fmt(rez.I[i], 1), num: true }, { text: fmt(rez.R[i], 1), num: true }];
        })
      });
    });

    function deseneaza() {
      serii[0].puncte = rez.zile.map(function (z, i) { return [z, rez.S[i]]; });
      serii[1].puncte = rez.zile.map(function (z, i) { return [z, rez.I[i]]; });
      serii[2].puncte = rez.zile.map(function (z, i) { return [z, rez.R[i]]; });
      G.linii(ctx, g, {
        serii: serii,
        titluY: t(T.persoane),
        xIntregi: true,
        xDomeniu: [0, p.zile],
        yDomeniu: [0, rez.N],
        inaltime: 300,
        referinte: p.r0 > 1 ? [{ axa: 'y', valoare: rez.N / p.r0, eticheta: t(T.refS) }] : [],
        formatTickX: function (x) { return String(Math.round(x)); },
        formatAntetX: function (x) { return G.sablon(t(T.ziua), { z: Math.round(x) }); },
        formatValoare: function (y) { return fmt(y, 0) + ' (' + ctx.fmtProc(y / rez.N, 1) + ')'; }
      });
      g.descrie(G.sablon(t(T.graficEticheta), { z: p.zile, de: G.de(p.zile) }), t(T.graficDesc));
    }

    function recalculeaza(anuntaAcum) {
      rez = calc.simuleaza(p);
      var cn = rez.acoperireNecesara;
      dl.seteaza([
        { et: t(T.reff), val: fmt(rez.rEfectiv, 2), sub: t(T.subReff) },
        { et: t(T.prag), val: ctx.fmtProc(rez.prag, 1), sub: t(T.subPrag) },
        { et: t(T.necesar), val: cn > 1 ? t(T.imposibil) : ctx.fmtProc(cn, 1), sub: t(T.subNecesar) },
        { et: t(T.varf), val: G.sablon(t(T.ziua), { z: rez.varf.zi }), sub: G.sablon(t(T.subVarf), { v: fmt(rez.varf.I, 0), de: G.de(Math.round(rez.varf.I)), p: ctx.fmtProc(rez.varf.I / rez.N, 1) }) },
        { et: t(T.atac), val: ctx.fmtProc(rez.atac, 1), sub: G.sablon(t(T.subAtac), { z: p.zile, de: G.de(p.zile) }) }
      ]);
      conc.seteaza(calc.concluzie(rez, p, t, fmt, ctx.fmtProc));
      deseneaza();
      tv.actualizeaza();
      if (anuntaAcum) {
        if (rez.rEfectiv <= 1 || rez.varf.zi === 0) anunt(G.sablon(t(T.anuntFara), { reff: fmt(rez.rEfectiv, 2) }));
        else anunt(G.sablon(t(T.anuntEpidemie), { reff: fmt(rez.rEfectiv, 2), zi: rez.varf.zi, v: fmt(rez.varf.I, 0), de: G.de(Math.round(rez.varf.I)), atac: ctx.fmtProc(rez.atac, 1) }));
      }
    }

    recalculeaza(false);
    g.laRedimensionare(deseneaza);
    cad.incheie();
  }

  window.Atelier.inregistreaza('sir', { calc: calc, monteaza: monteaza });
})();
