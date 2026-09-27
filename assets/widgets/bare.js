/* bare.js — comparație cu bare orizontale pentru date REALE (extrase la construcție).
 *
 * O singură serie: toate barele au aceeași culoare (slotul 1, --s1); categoriile nominale
 * nu se colorează după valoare. Cu „evidentiaza”, bara aleasă rămâne în --s1, iar celelalte
 * trec în gri de estompare (clasa .w-atenuat: --muted la opacitate redusă) — forma
 * „emphasis” din dataviz. Nu se folosește o nuanță mai deschisă de albastru (--seq-250):
 * ar citi-o ca treaptă de mărime, iar --seq-* nu are treaptă separată pentru modul întunecat.
 * Valoarea stă la vârful barei; valorile negative cresc spre stânga din linia de zero.
 */
(function () {
  'use strict';

  function esteNumar(x) { return typeof x === 'number' && isFinite(x); }
  function numar(x, i) { return esteNumar(x) ? x : i; }
  function limiteaza(x, a, b) { return x < a ? a : (x > b ? b : x); }

  var T = {
    categoria: { ro: 'Categoria', en: 'Category' },
    valoare: { ro: 'Valoarea', en: 'Value' },
    loc: { ro: 'Locul', en: 'Rank' },
    locDin: { ro: 'locul {r} din {n}', en: 'rank {r} of {n}' },
    faraValoare: { ro: 'fără valoare', en: 'no value' },
    graficEticheta: { ro: '{axa}: {n}{de} categorii; cea mai mare valoare, {max}, la {cat}', en: '{axa}: {n} categories; the highest value, {max}, is {cat}' },
    graficDesc: {
      ro: 'Bare orizontale ordonate; valoarea fiecărei bare e scrisă la capătul ei, iar tabelul de sub grafic are valorile exacte.',
      en: 'Ordered horizontal bars; each bar’s value is written at its end, and the table below the chart has the exact values.'
    },
    tabel: { ro: 'Valorile barelor', en: 'Bar values' },
    faraDate: { ro: 'Fără date de afișat', en: 'No data to show' }
  };

  var M = {
    faraCategorii: { ro: 'Configurația nu conține nicio categorie.', en: 'The configuration contains no categories.' },
    valoareInvalida: { ro: 'Unele categorii nu au o valoare numerică; apar fără bară.', en: 'Some categories have no numeric value; they appear without a bar.' },
    sortare: { ro: 'Sortarea trebuie să fie „desc”, „asc” sau „original”; s-a folosit „desc”.', en: 'Sorting must be “desc”, “asc” or “original”; “desc” was used.' },
    evidentiaza: { ro: 'Categoria de evidențiat („evidentiaza”) nu există.', en: 'The category to highlight (“evidentiaza”) does not exist.' }
  };

  var calc = {
    texte: T,
    mesaje: M,

    normalizeaza: function (cfg) {
      cfg = cfg || {};
      var mesaje = [];
      function msg(m) { if (mesaje.indexOf(m) < 0) mesaje.push(m); }
      var brute = Array.isArray(cfg.categorii) ? cfg.categorii.filter(function (c) { return c && typeof c === 'object'; }) : [];
      if (!brute.length) msg(M.faraCategorii);
      var chei = {};
      var categorii = brute.map(function (c, i) {
        var v = c.valoare;
        if (!esteNumar(v)) { msg(M.valoareInvalida); v = null; }
        var cheie = c.cheie != null ? String(c.cheie) : 'c' + (i + 1);
        if (chei[cheie]) cheie = cheie + '_' + (i + 1);
        chei[cheie] = true;
        return { cheie: cheie, eticheta: c.eticheta != null ? c.eticheta : cheie, valoare: v, index: i };
      });
      var sortare = cfg.sortare == null ? 'desc' : cfg.sortare;
      if (['desc', 'asc', 'original'].indexOf(sortare) < 0) { msg(M.sortare); sortare = 'desc'; }
      var ev = cfg.evidentiaza != null ? String(cfg.evidentiaza) : null;
      if (ev != null && !categorii.some(function (c) { return c.cheie === ev; })) { msg(M.evidentiaza); ev = null; }
      return {
        categorii: categorii, sortare: sortare, evidentiaza: ev,
        zecimale: Math.round(limiteaza(numar(cfg.zecimale, 1), 0, 4)),
        unitate: cfg.unitate || '', axa: cfg.axa || '', mesaje: mesaje
      };
    },

    /* Ordonare stabilă; categoriile fără valoare ajung la sfârșit. */
    ordoneaza: function (categorii, sortare) {
      var c = categorii.slice();
      if (sortare === 'original') return c.sort(function (a, b) { return a.index - b.index; });
      var semn = sortare === 'asc' ? 1 : -1;
      return c.sort(function (a, b) {
        var na = a.valoare == null, nb = b.valoare == null;
        if (na || nb) return na === nb ? a.index - b.index : (na ? 1 : -1);
        return semn * (a.valoare - b.valoare) || a.index - b.index;
      });
    },

    /* Rolul de culoare al unei categorii: 'serie' (fără evidențiere), 'accent' sau 'atenuat'. */
    rolCuloare: function (cat, evidentiaza) {
      if (evidentiaza == null) return 'serie';
      return cat.cheie === evidentiaza ? 'accent' : 'atenuat';
    },

    /* Locul fiecărei categorii după valoare, descrescător (1 = cea mai mare); egalitățile împart locul. */
    locuri: function (categorii) {
      var vals = categorii.filter(function (c) { return c.valoare != null; }).map(function (c) { return c.valoare; });
      var r = {};
      categorii.forEach(function (c) {
        if (c.valoare == null) { r[c.cheie] = null; return; }
        r[c.cheie] = 1 + vals.filter(function (v) { return v > c.valoare; }).length;
      });
      return r;
    },

    domeniu: function (categorii) {
      var mn = 0, mx = 0;
      categorii.forEach(function (c) { if (c.valoare != null) { mn = Math.min(mn, c.valoare); mx = Math.max(mx, c.valoare); } });
      return [mn, mx];
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
    var ordonate = calc.ordoneaza(d.categorii, d.sortare);
    var locuri = calc.locuri(d.categorii);
    var nCu = d.categorii.filter(function (c) { return c.valoare != null; }).length;
    var zecTabel = Math.max(zec, G.zecimaleNecesare(d.categorii.map(function (c) { return c.valoare; }), 4));

    function culoare(c) {
      var rol = calc.rolCuloare(c, d.evidentiaza);
      return rol === 'atenuat' ? { clasa: 'w-atenuat', cheie: 'var(--muted)' } : { culoare: ctx.culoareSerie(0), cheie: ctx.culoareSerie(0) };
    }

    var g = G.graficNou(ctx, cad.corp, { inaltime: 300 });
    G.vizualizareTabel(ctx, cad.corp, function () {
      return G.tabel({
        legenda: t(d.axa) ? t(d.axa) + (unitate ? ' (' + unitate + ')' : '') : t(T.tabel),
        antete: [[{ text: t(T.categoria) }, { text: t(T.valoare), num: true }, { text: t(T.loc), num: true }]],
        randuri: ordonate.map(function (c) {
          return [{ text: t(c.eticheta), antet: true }, { text: fmt(c.valoare, zecTabel), num: true },
                  { text: locuri[c.cheie] == null ? '—' : fmt(locuri[c.cheie], 0), num: true }];
        })
      });
    });

    function deseneaza() {
      if (!ordonate.length) { g.descrie(t(T.faraDate), t(T.faraDate)); return; }
      G.bareOrizontale(ctx, g, {
        titluAxa: t(d.axa) ? t(d.axa) + (unitate ? ' (' + unitate + ')' : '') : '',
        randuri: ordonate.map(function (c) {
          var col = culoare(c);
          return { cheie: c.cheie, eticheta: t(c.eticheta), segmente: c.valoare == null ? [] : [{ valoare: c.valoare, culoare: col.culoare, clasa: col.clasa }] };
        }),
        formatValoare: function (v) { return fmt(v, zec); },
        textCapat: function (r, i) { return ordonate[i].valoare == null ? '—' : fmt(ordonate[i].valoare, zec); },
        tooltip: function (i) {
          var c = ordonate[i];
          return {
            antet: t(c.eticheta),
            randuri: [{
              culoare: culoare(c).cheie,
              valoare: c.valoare == null ? t(T.faraValoare) : G.cuUnitate(fmt(c.valoare, zec), unitate),
              eticheta: locuri[c.cheie] == null ? '' : G.sablon(t(T.locDin), { r: fmt(locuri[c.cheie], 0), n: fmt(nCu, 0) })
            }]
          };
        }
      });
      var primul = calc.ordoneaza(d.categorii, 'desc')[0];
      g.descrie(G.sablon(t(T.graficEticheta), {
        axa: t(d.axa) || t(T.valoare), n: fmt(ordonate.length, 0), de: G.de(ordonate.length),
        max: primul && primul.valoare != null ? G.cuUnitate(fmt(primul.valoare, zec), unitate) : '—',
        cat: primul ? t(primul.eticheta) : '—'
      }), t(T.graficDesc));
    }

    deseneaza();
    g.laRedimensionare(deseneaza);
    cad.incheie();
  }

  window.Atelier.inregistreaza('bare', { calc: calc, monteaza: monteaza });
})();
