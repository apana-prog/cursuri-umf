/* scenariu.js — scenariul ramificat: un caz cu decizii succesive.
 *
 * Configurația are noduri (text + 2–4 opțiuni) și noduri finale (verdict + explicație). La alegere,
 * studentul vede urmarea opțiunii (feedback) și o legătură spre paragraful din note, apoi continuă.
 * Nodul final arată verdictul, explicația și traseul parcurs. Textul din configurație intră în
 * pagină numai prin textContent (ctx.el cu text), niciodată ca marcaj.
 *
 * Accesibilitate: butoane reale (Tab, Enter, Spațiu), focus mutat pe textul nodului nou, feedback
 * într-o zonă aria-live; verdictul se numește în cuvinte, nu doar prin culoare.
 * O configurație defectă nu oprește pagina: se afișează un mesaj scurt, iar scenariul se oprește curat.
 */
(function () {
  'use strict';

  var MAX_OPTIUNI = 4;
  var VERDICTE = ['buna', 'acceptabila', 'cu_urmari'];

  function esteObiect(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function are(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  /* ID de paragraf sigur pentru href (p017, s003): altfel se ignoră */
  function idParagraf(x) { return typeof x === 'string' && /^[A-Za-z][A-Za-z0-9-]*$/.test(x) ? x : ''; }

  var T = {
    pas: { ro: 'Pasul {n}', en: 'Step {n}', fr: 'Étape {n}' },
    alege: { ro: 'Alegeți o decizie', en: 'Choose a decision', fr: 'Choisissez une décision' },
    continua: { ro: 'Continuați', en: 'Continue', fr: 'Continuer' },
    reia: { ro: 'Reluați scenariul', en: 'Restart the scenario', fr: 'Recommencer le scénario' },
    vezi: { ro: 'Vezi în note: § {p}', en: 'See the notes: § {p}', fr: 'Voir dans les notes : § {p}' },
    traseu: { ro: 'Traseul parcurs', en: 'Your path', fr: 'Parcours suivi' },
    explicatie: { ro: 'Explicație', en: 'Explanation', fr: 'Explication' },
    final: { ro: 'Final', en: 'End', fr: 'Fin' },
    vBuna: { ro: 'Decizie bună', en: 'Good decision', fr: 'Bonne décision' },
    vAcceptabila: { ro: 'Decizie acceptabilă', en: 'Acceptable decision', fr: 'Décision acceptable' },
    vCuUrmari: { ro: 'Decizie cu urmări', en: 'Decision with consequences', fr: 'Décision aux conséquences' }
  };
  var ETICHETA_VERDICT = { buna: T.vBuna, acceptabila: T.vAcceptabila, cu_urmari: T.vCuUrmari };

  var M = {
    faraNoduri: {
      ro: 'Configurația nu conține niciun nod („noduri”).',
      en: 'The configuration contains no node (“noduri”).',
      fr: 'La configuration ne contient aucun nœud (« noduri »).'
    },
    startInexistent: {
      ro: 'Nodul de start („start”) lipsește sau nu există printre noduri.',
      en: 'The start node (“start”) is missing or is not among the nodes.',
      fr: 'Le nœud de départ (« start ») est absent ou ne figure pas parmi les nœuds.'
    },
    nodInexistent: {
      ro: 'Nodul „{nod}” nu există; scenariul se oprește aici.',
      en: 'The node “{nod}” does not exist; the scenario stops here.',
      fr: 'Le nœud « {nod} » n’existe pas ; le scénario s’arrête ici.'
    },
    ciclu: {
      ro: 'Nodul „{nod}” a mai fost parcurs; scenariul se oprește aici, ca să nu se repete la nesfârșit.',
      en: 'The node “{nod}” was already visited; the scenario stops here to avoid an endless loop.',
      fr: 'Le nœud « {nod} » a déjà été parcouru ; le scénario s’arrête ici pour éviter une boucle sans fin.'
    },
    faraOptiuni: {
      ro: 'Nodul „{nod}” nu este final și nu are opțiuni; scenariul se oprește aici.',
      en: 'The node “{nod}” is not final and has no options; the scenario stops here.',
      fr: 'Le nœud « {nod} » n’est pas final et n’a aucune option ; le scénario s’arrête ici.'
    },
    multeOptiuni: {
      ro: 'Nodul „{nod}” are mai mult de patru opțiuni; se afișează primele patru.',
      en: 'The node “{nod}” has more than four options; the first four are shown.',
      fr: 'Le nœud « {nod} » a plus de quatre options ; les quatre premières sont affichées.'
    },
    verdictNecunoscut: {
      ro: 'Nodul „{nod}” are un verdict necunoscut; valorile admise sunt „buna”, „acceptabila” și „cu_urmari”.',
      en: 'The node “{nod}” has an unknown verdict; the allowed values are “buna”, “acceptabila” and “cu_urmari”.',
      fr: 'Le nœud « {nod} » a un verdict inconnu ; les valeurs admises sont « buna », « acceptabila » et « cu_urmari ».'
    }
  };

  /* Mesajul cu {nod} înlocuit, în fiecare limbă. */
  function cu(m, v) {
    var o = {};
    ['ro', 'en', 'fr'].forEach(function (l) {
      o[l] = String(m[l]).replace(/\{(\w+)\}/g, function (x, k) { return are(v, k) ? v[k] : x; });
    });
    return o;
  }

  var calc = {
    texte: T,
    mesaje: M,
    maxOptiuni: MAX_OPTIUNI,
    verdicte: VERDICTE,

    /* Configurația curățată: noduri sigure, opțiuni limitate la patru, start verificat.
       `ok` = scenariul poate porni (există noduri și nodul de start). */
    normalizeaza: function (cfg) {
      cfg = esteObiect(cfg) ? cfg : {};
      var mesaje = [];
      function msg(m) { if (!mesaje.some(function (x) { return x.ro === m.ro; })) mesaje.push(m); }
      var brute = esteObiect(cfg.noduri) ? cfg.noduri : {};
      var noduri = {}, ids = [];
      Object.keys(brute).forEach(function (id) {
        var n = brute[id];
        if (!esteObiect(n)) return;
        var fin = n.final === true;
        var optiuni = (Array.isArray(n.optiuni) ? n.optiuni : []).filter(esteObiect);
        if (!fin && optiuni.length > MAX_OPTIUNI) { msg(cu(M.multeOptiuni, { nod: id })); optiuni = optiuni.slice(0, MAX_OPTIUNI); }
        var verdict = null;
        if (fin && n.verdict != null) {
          if (VERDICTE.indexOf(n.verdict) >= 0) verdict = n.verdict;
          else msg(cu(M.verdictNecunoscut, { nod: id }));
        }
        noduri[id] = {
          id: id, text: n.text, final: fin, verdict: verdict, explicatie: n.explicatie, paragraf: idParagraf(n.paragraf),
          optiuni: fin ? [] : optiuni.map(function (o) {
            return { text: o.text, spre: o.spre != null ? String(o.spre) : '', feedback: o.feedback, paragraf: idParagraf(o.paragraf) };
          })
        };
        ids.push(id);
      });
      if (!ids.length) msg(M.faraNoduri);
      var start = cfg.start != null ? String(cfg.start) : '';
      var okStart = ids.length > 0 && are(noduri, start);
      if (ids.length && !okStart) msg(M.startInexistent);
      return { start: start, noduri: noduri, ids: ids, mesaje: mesaje, ok: okStart };
    },

    /* Pasul următor după alegerea opțiunii `i` din nodul `id`; `parcurse` = nodurile deja vizitate.
       Întoarce {nod} sau {eroare} (mesaj {ro, en, fr}); niciodată o excepție. */
    urmatorul: function (d, id, i, parcurse) {
      var n = d && d.noduri && are(d.noduri, id) ? d.noduri[id] : null;
      var o = n && n.optiuni ? n.optiuni[i] : null;
      if (!o) return { eroare: cu(M.nodInexistent, { nod: String(id) }) };
      if (!o.spre || !are(d.noduri, o.spre)) return { eroare: cu(M.nodInexistent, { nod: o.spre || '?' }) };
      if ((parcurse || []).indexOf(o.spre) >= 0) return { eroare: cu(M.ciclu, { nod: o.spre }) };
      return { nod: o.spre };
    }
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = calc; return; }

  function monteaza(el, cfg, ctx) {
    var G = (window.Atelier && window.Atelier.grafic) || window.AtelierGrafic;
    if (!G) throw new Error('grafic.js nu este încărcat');
    var t = ctx.t;
    var d = calc.normalizeaza(cfg);
    var cad = G.cadru(el, cfg, ctx);
    cad.mesaje(d.mesaje);
    var zona = ctx.el('div', { 'class': 'sc' });
    cad.corp.appendChild(zona);
    var stare = { traseu: [], parcurse: [], ales: null };

    /* Ancora paragrafului: în notele complete (p017) sau, dacă pagina are numai Pregătirea, în copia ei (pg-p017). */
    function ancora(p) {
      var doc = typeof document !== 'undefined' ? document : null;
      if (doc && typeof doc.getElementById === 'function') {
        if (doc.getElementById(p)) return p;
        if (doc.getElementById('pg-' + p)) return 'pg-' + p;
      }
      return p;
    }
    function legatura(parinte, p) {
      if (!p) return;
      var a = ctx.el('a', { 'class': 'sc-note', href: '#' + ancora(p) }, G.sablon(t(T.vezi), { p: p }));
      parinte.appendChild(ctx.el('p', { 'class': 'sc-link' }, a));
    }
    function focus(e) { if (e && typeof e.focus === 'function') e.focus(); }

    function butonReia(actiuni) {
      var b = ctx.el('button', { type: 'button', 'class': 'buton-contur sc-reia' }, t(T.reia));
      b.addEventListener('click', reia);
      actiuni.appendChild(b);
    }
    /* Oprire curată: mesajul apare în capul instrumentului, rămâne numai „Reluați”. */
    function opreste(mesaj, actiuni) {
      cad.mesaje(d.mesaje.concat([mesaj]));
      G.golesteNod(actiuni);
      butonReia(actiuni);
    }

    function reia() {
      stare.traseu = []; stare.parcurse = [d.start]; stare.ales = null;
      cad.mesaje(d.mesaje);
      arata(d.start, true);
    }

    function arata(id, cuFocus) {
      var n = d.noduri[id];
      G.golesteNod(zona);
      stare.ales = null;
      var actiuni = ctx.el('div', { 'class': 'w-actiuni sc-actiuni' });
      if (n.final) { arataFinal(n, actiuni, cuFocus); return; }

      zona.appendChild(ctx.el('p', { 'class': 'sc-pas' }, G.sablon(t(T.pas), { n: ctx.fmt(stare.traseu.length + 1, 0) })));
      var text = ctx.el('p', { 'class': 'sc-text', tabindex: '-1' }, t(n.text));
      zona.appendChild(text);
      if (!n.optiuni.length) {
        zona.appendChild(actiuni);
        opreste(cu(M.faraOptiuni, { nod: id }), actiuni);
        if (cuFocus) focus(text);
        return;
      }
      var grup = ctx.el('div', { 'class': 'sc-optiuni', role: 'group', 'aria-label': t(T.alege) });
      var feedback = ctx.el('div', { 'class': 'sc-feedback', 'aria-live': 'polite' });
      var butoane = n.optiuni.map(function (o, i) {
        var b = ctx.el('button', { type: 'button', 'class': 'buton-contur sc-opt' }, t(o.text));
        b.addEventListener('click', function () { alege(i, n, butoane, feedback, actiuni); });
        grup.appendChild(b);
        return b;
      });
      zona.appendChild(grup);
      zona.appendChild(feedback);
      zona.appendChild(actiuni);
      if (cuFocus) focus(text);
    }

    function alege(i, n, butoane, feedback, actiuni) {
      if (stare.ales != null) return;
      stare.ales = i;
      var o = n.optiuni[i];
      butoane.forEach(function (b, k) {
        b.setAttribute('aria-disabled', 'true');
        if (k === i) { b.setAttribute('aria-pressed', 'true'); b.classList.add('sc-aleasa'); }
      });
      stare.traseu.push({ nod: n.id, optiune: i });
      if (t(o.feedback)) feedback.appendChild(ctx.el('p', { 'class': 'sc-fb' }, t(o.feedback)));
      legatura(feedback, o.paragraf);
      var cont = ctx.el('button', { type: 'button', 'class': 'buton sc-continua' }, t(T.continua));
      cont.addEventListener('click', function () {
        var r = calc.urmatorul(d, n.id, i, stare.parcurse);
        if (r.eroare) { opreste(r.eroare, actiuni); return; }
        stare.parcurse.push(r.nod);
        arata(r.nod, true);
      });
      actiuni.appendChild(cont);
    }

    function arataFinal(n, actiuni, cuFocus) {
      var verdict = ctx.el('p', { 'class': 'sc-verdict' + (n.verdict ? ' sc-v-' + n.verdict : ''), tabindex: '-1' },
        t(n.verdict ? ETICHETA_VERDICT[n.verdict] : T.final));
      zona.appendChild(verdict);
      if (t(n.text)) zona.appendChild(ctx.el('p', { 'class': 'sc-text' }, t(n.text)));
      if (t(n.explicatie)) {
        zona.appendChild(ctx.el('p', { 'class': 'sc-expl' }, ctx.el('strong', null, t(T.explicatie) + '. '), t(n.explicatie)));
      }
      legatura(zona, n.paragraf);
      if (stare.traseu.length) {
        zona.appendChild(ctx.el('p', { 'class': 'sc-traseu-titlu' }, t(T.traseu)));
        var ol = ctx.el('ol', { 'class': 'sc-traseu' });
        stare.traseu.forEach(function (pas) {
          ol.appendChild(ctx.el('li', null, t(d.noduri[pas.nod].optiuni[pas.optiune].text)));
        });
        zona.appendChild(ol);
      }
      butonReia(actiuni);
      zona.appendChild(actiuni);
      if (cuFocus) focus(verdict);
    }

    if (d.ok) { stare.parcurse = [d.start]; arata(d.start, false); }
    cad.incheie();
  }

  window.Atelier.inregistreaza('scenariu', { calc: calc, monteaza: monteaza });
})();
