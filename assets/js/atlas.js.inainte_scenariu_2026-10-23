(function () {
  "use strict";

  var limba = (document.documentElement.lang || "ro").slice(0, 2);
  if (["ro", "en", "fr"].indexOf(limba) < 0) limba = "ro";

  var C = {
    ro: {
      viz: "Vizualizare", editorial: "Editorial", atelier: "Atelier",
      atlas: "Atlas vizual", portofoliu: "Portofoliul didactic", portofoliuN: "O privire comparabilă asupra disciplinelor și a stadiului publicării.",
      disciplina: "Semestrul dintr-o privire", disciplinaN: "Săptămâni, module și disponibilitate — derivate direct din planul disciplinei.",
      semestru: "Matricea semestrului", module: "Încărcarea pe module", acoperire: "Acoperirea publicării",
      cursuri: "cursuri", lucrari: "lucrări practice", saptamani: "săptămâni", publicate: "unități publicate", din: "din",
      unitate: "Harta unității", unitateN: "Traseul de studiu și semnătura conținutului, calculate din pagina curentă.",
      traseu: "Traseul de studiu", semnatura: "Semnătura conținutului", lectura: "Harta de lectură",
      paragrafe: "paragrafe", vizuale: "tabele și figuri", activitati: "activități și instrumente", surse: "surse citate", sectiuni: "secțiuni",
      registru: "Registrul în date", registruN: "Legătura dintre surse, afirmații și conținutul publicat.",
      glosar: "Distribuția termenilor", glosarN: "Termenii disponibili, grupați după inițială.",
      progres: "Structura parcursului", progresN: "Unitățile disponibile în raport cu planul complet al fiecărui modul.",
      laborator: "Biblioteca vizuală", laboratorN: "Tipurile de instrumente pe care platforma le poate monta din configurațiile disciplinei.",
      configurate: "configurate aici", disponibile: "tipuri disponibile",
      despre: "Lanțul de calitate", despreN: "Principiile editoriale care leagă sursa de materialul publicat.",
      jurnal: "Starea versiunii", jurnalN: "Istoricul public și traseul unei modificări până la publicare.",
      intrari: "intrări în jurnal", versiune: "versiunea curentă", nimic: "Nicio intrare publică încă",
      sursa: "surse", localizare: "cu localizare", afirmatii: "afirmații", utilizare: "trimiteri în text",
      zoomIn: "Mărește diapozitivul", zoomOut: "Micșorează diapozitivul", focus: "Indicator luminos",
      diapozitiv: "Diapozitiv"
    },
    en: {
      viz: "View", editorial: "Editorial", atelier: "Workshop",
      atlas: "Visual atlas", portofoliu: "Teaching portfolio", portofoliuN: "A comparable view of courses and publication progress.",
      disciplina: "The semester at a glance", disciplinaN: "Weeks, modules and availability — derived directly from the course plan.",
      semestru: "Semester matrix", module: "Module workload", acoperire: "Publication coverage",
      cursuri: "lectures", lucrari: "practical sessions", saptamani: "weeks", publicate: "published units", din: "of",
      unitate: "Unit map", unitateN: "The learning pathway and content signature, computed from the current page.",
      traseu: "Learning pathway", semnatura: "Content signature", lectura: "Reading map",
      paragrafe: "paragraphs", vizuale: "tables and figures", activitati: "activities and tools", surse: "cited sources", sectiuni: "sections",
      registru: "The register in data", registruN: "The link between sources, claims and published content.",
      glosar: "Term distribution", glosarN: "Available terms, grouped by initial.",
      progres: "Pathway structure", progresN: "Available units against each module's complete plan.",
      laborator: "Visual library", laboratorN: "Tool types the platform can mount from course configurations.",
      configurate: "configured here", disponibile: "available types",
      despre: "Quality chain", despreN: "Editorial principles linking evidence to the published material.",
      jurnal: "Version status", jurnalN: "The public history and a change's path to publication.",
      intrari: "journal entries", versiune: "current version", nimic: "No public entry yet",
      sursa: "sources", localizare: "with locator", afirmatii: "claims", utilizare: "in-text links",
      zoomIn: "Zoom in", zoomOut: "Zoom out", focus: "Spotlight",
      diapozitiv: "Slide"
    },
    fr: {
      viz: "Affichage", editorial: "Éditorial", atelier: "Atelier",
      atlas: "Atlas visuel", portofoliu: "Portefeuille pédagogique", portofoliuN: "Une vue comparable des enseignements et de leur publication.",
      disciplina: "Le semestre en un coup d’œil", disciplinaN: "Semaines, modules et disponibilité — dérivés directement du plan du cours.",
      semestru: "Matrice du semestre", module: "Charge par module", acoperire: "Couverture de publication",
      cursuri: "cours", lucrari: "travaux pratiques", saptamani: "semaines", publicate: "unités publiées", din: "sur",
      unitate: "Carte de l’unité", unitateN: "Le parcours d’apprentissage et la signature du contenu, calculés depuis la page.",
      traseu: "Parcours d’apprentissage", semnatura: "Signature du contenu", lectura: "Carte de lecture",
      paragrafe: "paragraphes", vizuale: "tableaux et figures", activitati: "activités et outils", surse: "sources citées", sectiuni: "sections",
      registru: "Le registre en données", registruN: "Le lien entre sources, affirmations et contenu publié.",
      glosar: "Répartition des termes", glosarN: "Termes disponibles, regroupés par initiale.",
      progres: "Structure du parcours", progresN: "Unités disponibles par rapport au plan complet de chaque module.",
      laborator: "Bibliothèque visuelle", laboratorN: "Types d’outils que la plateforme peut monter depuis les configurations du cours.",
      configurate: "configurés ici", disponibile: "types disponibles",
      despre: "Chaîne de qualité", despreN: "Principes éditoriaux reliant la source au contenu publié.",
      jurnal: "État de la version", jurnalN: "L’historique public et le parcours d’une modification jusqu’à sa publication.",
      intrari: "entrées du journal", versiune: "version actuelle", nimic: "Aucune entrée publique",
      sursa: "sources", localizare: "avec localisation", afirmatii: "affirmations", utilizare: "renvois dans le texte",
      zoomIn: "Agrandir", zoomOut: "Réduire", focus: "Projecteur",
      diapozitiv: "Diapositive"
    }
  }[limba];

  function q(s, r) { return (r || document).querySelector(s); }
  function qa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>\"]/g, function (x) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[x]; }); }
  function text(n) { return n ? n.textContent.replace(/\s+/g, " ").trim() : ""; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function cul(i) { return ["var(--m1)", "var(--m2)", "var(--m3)", "var(--m4)"][i % 4]; }

  function sectiune(clasa, titlu, nota) {
    var s = document.createElement("section");
    s.className = "atlas-sistem " + clasa;
    s.innerHTML = '<header><div><p class="atlas-kicker">' + esc(C.atlas) + '</p><h2>' + esc(titlu) + '</h2></div><p>' + esc(nota) + '</p></header><div class="atlas-grila"></div>';
    return s;
  }

  function card(tip, titlu, clasa) {
    return '<article class="atlas-card ' + (clasa || "") + '"><span class="atlas-tip">' + esc(tip) + '</span><h3>' + esc(titlu) + '</h3>';
  }

  function adaugaSelector() {
    if (q(".vizualizare-alegere")) return;
    var tinta = q(".antet-unelte");
    var prez = q(".bara-prezentare");
    if (!tinta && !prez) return;
    var d = document.createElement("div");
    d.className = "vizualizare-alegere";
    d.setAttribute("role", "group");
    d.setAttribute("aria-label", C.viz);
    var mod = document.documentElement.dataset.view || "editorial";
    d.innerHTML = '<button type="button" data-vizualizare="editorial" aria-pressed="' + String(mod !== "atelier") + '">' + esc(C.editorial) + '</button>' +
      '<button type="button" data-vizualizare="atelier" aria-pressed="' + String(mod === "atelier") + '">' + esc(C.atelier) + '</button>';
    if (tinta) {
      var tema = q("[data-tema]", tinta);
      tinta.insertBefore(d, tema || tinta.firstChild);
    } else {
      var spatiu = q(".spatiu", prez);
      prez.insertBefore(d, spatiu || null);
    }
  }

  function randeazaStart() {
    if (!document.body.classList.contains("pagina-start")) return;
    var cursuri = qa(".card-curs");
    if (!cursuri.length) return;
    var s = sectiune("atlas-portofoliu", C.portofoliu, C.portofoliuN);
    var totalPublicat = 0, total = 0;
    var randuri = cursuri.map(function (x, i) {
      var badge = qa(".insigna", x).map(text).join(" ");
      var m = /(\d+)\s*\/\s*(\d+)/.exec(badge);
      var gata = m ? Number(m[1]) : 0;
      var toate = m ? Number(m[2]) : 0;
      totalPublicat += gata; total += toate;
      var p = toate ? Math.round(100 * gata / toate) : 0;
      var titlu = text(q("h3", x));
      var program = text(q(".program", x));
      return '<div class="atlas-portofoliu-rand"><a href="' + esc(x.getAttribute("href")) + '">' + esc(titlu) + '<small>' + esc(program) + '</small></a>' +
        '<span class="atlas-pista"><i style="--p:' + p + '%;--c:' + cul(i) + '"></i></span><strong>' + gata + ' / ' + toate + '</strong></div>';
    }).join("");
    q(".atlas-grila", s).innerHTML = card(C.acoperire, C.publicate, "intreaga") + '<div class="atlas-metrici"><div class="atlas-metrica" style="--c:var(--atlas-teal)"><strong>' + cursuri.length + '</strong><span>' + esc(C.disciplina.toLowerCase()) + '</span></div><div class="atlas-metrica" style="--c:var(--atlas-blue)"><strong>' + totalPublicat + '</strong><span>' + esc(C.publicate) + '</span></div><div class="atlas-metrica" style="--c:var(--atlas-plum)"><strong>' + total + '</strong><span>' + esc(C.unitate.toLowerCase()) + '</span></div></div><div class="atlas-bare" style="margin-top:1rem">' + randuri + '</div></article>';
    var erou = q("main > .erou");
    if (erou) erou.after(s);
  }

  function randeazaDisciplina() {
    if (!document.body.classList.contains("pagina-disciplina")) return;
    var module = qa("#harta .modul");
    if (!module.length) return;
    var s = sectiune("atlas-disciplina", C.disciplina, C.disciplinaN);
    var slot = {}, maxSapt = 0, cursuri = 0, lp = 0, publicate = 0, total = 0;
    module.forEach(function (m, mi) {
      qa(".saptamana", m).forEach(function (sap) {
        var nr = Number(text(q(".sapt-nr strong", sap))) || 0;
        maxSapt = Math.max(maxSapt, nr);
        if (!slot[nr]) slot[nr] = {c: [], lp: []};
        qa(".unitate", sap).forEach(function (u) {
          var tipText = text(q(".tip-u", u));
          var a = q("a.titlu-u", u);
          var cod = a ? (a.getAttribute("href") || "").replace(/\.html.*$/, "") : tipText.replace(/\D+/g, "");
          var esteLp = /^(LP)|practic|seminar|travaux/i.test(cod + " " + tipText);
          var item = {cod: cod || (esteLp ? "LP" : "C"), href: a && a.getAttribute("href"), clasa: "m" + ((mi % 4) + 1), titlu: text(q(".titlu-u", u))};
          slot[nr][esteLp ? "lp" : "c"].push(item);
          if (esteLp) lp += 1; else cursuri += 1;
          total += 1; if (a) publicate += 1;
        });
      });
    });
    maxSapt = maxSapt || 14;
    function celula(items) {
      if (!items || !items.length) return '<td class="gol"><span>—</span></td>';
      var x = items[0], label = items.map(function (y) { return y.cod; }).join("+");
      return '<td class="' + x.clasa + '">' + (x.href ? '<a href="' + esc(x.href) + '" title="' + esc(x.titlu) + '">' + esc(label) + '</a>' : '<span title="' + esc(x.titlu) + '">' + esc(label) + '</span>') + '</td>';
    }
    var cap = "", rC = "", rL = "";
    for (var i = 1; i <= maxSapt; i += 1) { cap += "<th>" + i + "</th>"; rC += celula((slot[i] || {}).c); rL += celula((slot[i] || {}).lp); }
    var matrice = '<div class="atlas-matrice-wrap"><table class="atlas-matrice"><thead><tr><th class="atlas-rand-label"></th>' + cap + '</tr></thead><tbody><tr><th class="atlas-rand-label">' + esc(C.cursuri) + '</th>' + rC + '</tr><tr><th class="atlas-rand-label">' + esc(C.lucrari) + '</th>' + rL + '</tr></tbody></table></div>';
    var bare = module.map(function (m, i) {
      var toate = qa(".unitate", m).length, gata = qa(".unitate.disponibila", m).length;
      var p = toate ? Math.round(100 * gata / toate) : 0;
      return '<div class="atlas-bara-rand"><span title="' + esc(text(q(".modul-antet h3", m))) + '">' + esc(text(q(".modul-antet h3", m))) + '</span><span class="atlas-pista"><i style="--p:' + p + '%;--c:' + cul(i) + '"></i></span><strong>' + gata + ' / ' + toate + '</strong></div>';
    }).join("");
    var proc = total ? Math.round(100 * publicate / total) : 0;
    q(".atlas-grila", s).innerHTML = card("01", C.semestru, "lata") + matrice + '</article>' +
      card("02", C.acoperire, "") + '<div class="atlas-inel" style="--p:' + proc + '%"><span><strong>' + proc + '%</strong><small>' + publicate + ' ' + esc(C.din) + ' ' + total + '</small></span></div></article>' +
      card("03", C.module, "lata") + '<div class="atlas-bare">' + bare + '</div></article>' +
      card("04", C.atlas, "") + '<div class="atlas-metrici"><div class="atlas-metrica" style="--c:var(--m1)"><strong>' + cursuri + '</strong><span>' + esc(C.cursuri) + '</span></div><div class="atlas-metrica" style="--c:var(--m2)"><strong>' + lp + '</strong><span>' + esc(C.lucrari) + '</span></div><div class="atlas-metrica" style="--c:var(--m4)"><strong>' + maxSapt + '</strong><span>' + esc(C.saptamani) + '</span></div></div></article>';
    var erou = q("main > .erou");
    if (erou) erou.after(s);
  }

  function randeazaUnitate() {
    if (!document.body.classList.contains("pagina-unitate")) return;
    var s = sectiune("atlas-unitate", C.unitate, C.unitateN);
    var tabs = qa(".file [role=tab]");
    var traseu = tabs.map(function (tab, i) {
      var nume = text(q("span", tab)) || text(tab);
      var timp = text(q(".timp", tab)) || "—";
      var id = (tab.getAttribute("aria-controls") || "").replace(/^fila-/, "");
      var gata = q('[data-progres$=":' + id + '"][aria-pressed="true"]');
      return '<div class="atlas-pas" style="--c:' + cul(i) + '"><strong>' + esc(nume) + '</strong><span>' + esc(timp) + '</span><i title="' + (gata ? "✓" : "") + '"></i></div>';
    }).join("");
    var panouri = qa('section[role="tabpanel"]');
    var paragrafe = 0;
    panouri.forEach(function (p) { paragrafe += qa(".text-note > p, .text-note > .bloc > p, .lectura-simpla > p", p).length; });
    var vizuale = qa(".text-note table, .text-note figure, .lectura-simpla table, .lectura-simpla figure").length;
    var activitati = qa(".caseta-activitate, .widget, [data-quiz], .quiz").length;
    var surse = {};
    qa("a[data-af]").forEach(function (a) { surse[a.getAttribute("data-af")] = true; });
    var nrSurse = Object.keys(surse).length;
    var headings = qa('section[role="tabpanel"] .text-note h2[id], section[role="tabpanel"] .text-note h3[id], section[role="tabpanel"] .lectura-simpla h2[id]').slice(0, 16);
    var harta = headings.map(function (h, i) { return '<a href="#' + esc(h.id) + '" style="--c:' + cul(i) + '"><span>' + esc(C.sectiuni + " " + (i + 1)) + '</span>' + esc(text(h)) + '</a>'; }).join("");
    if (!harta) harta = '<p>—</p>';
    var maxV = Math.max(paragrafe, vizuale, activitati, nrSurse, 1);
    var sig = [[paragrafe, C.paragrafe, "var(--m1)"], [vizuale, C.vizuale, "var(--m2)"], [activitati, C.activitati, "var(--m3)"], [nrSurse, C.surse, "var(--m4)"]].map(function (x) {
      return '<div style="--v:' + Math.max(1, x[0] / maxV * 10) + ';--c:' + x[2] + '"><strong>' + x[0] + '</strong><span>' + esc(x[1]) + '</span></div>';
    }).join("");
    q(".atlas-grila", s).innerHTML = card("01", C.traseu, "intreaga") + '<div class="atlas-traseu" style="--n:' + Math.max(1, tabs.length) + '">' + traseu + '</div></article>' +
      card("02", C.semnatura, "lata") + '<div class="atlas-semnatura">' + sig + '</div></article>' +
      card("03", C.atlas, "") + '<div class="atlas-metrici"><div class="atlas-metrica" style="--c:var(--m1)"><strong>' + headings.length + '</strong><span>' + esc(C.sectiuni) + '</span></div><div class="atlas-metrica" style="--c:var(--m2)"><strong>' + tabs.length + '</strong><span>' + esc(C.traseu.toLowerCase()) + '</span></div><div class="atlas-metrica" style="--c:var(--m4)"><strong>' + nrSurse + '</strong><span>' + esc(C.surse) + '</span></div></div></article>' +
      card("04", C.lectura, "intreaga") + '<div class="atlas-harta-lectura">' + harta + '</div></article>';
    var erou = q("main > .erou-unitate");
    if (erou) erou.after(s);
  }

  function insereazaDupaAntet(s) {
    var h = q("main > .antet-pagina");
    if (h) h.after(s);
  }

  function randeazaSurse() {
    var carduri = qa(".sursa-card");
    if (!carduri.length) return;
    var afirmatii = qa('.sursa-card li[id^="A"]').length;
    var loc = qa(".sursa-card details").length;
    var trimiteri = qa("a[data-af]").length;
    var s = sectiune("atlas-registru", C.registru, C.registruN);
    q(".atlas-grila", s).innerHTML = card("01", C.registru, "intreaga") + '<div class="atlas-flux"><div style="--c:var(--m1)"><strong>' + carduri.length + '</strong><span>' + esc(C.sursa) + '</span></div><div style="--c:var(--m2)"><strong>' + loc + '</strong><span>' + esc(C.localizare) + '</span></div><div style="--c:var(--m3)"><strong>' + afirmatii + '</strong><span>' + esc(C.afirmatii) + '</span></div><div style="--c:var(--m4)"><strong>' + trimiteri + '</strong><span>' + esc(C.utilizare) + '</span></div></div></article>';
    insereazaDupaAntet(s);
  }

  function randeazaGlosar() {
    var termeni = qa(".termen-card");
    if (!termeni.length) return;
    var grupe = {};
    termeni.forEach(function (x) { var k = text(q("h3", x)).charAt(0).toLocaleUpperCase(limba) || "?"; grupe[k] = (grupe[k] || 0) + 1; });
    var max = Math.max.apply(null, Object.keys(grupe).map(function (k) { return grupe[k]; }));
    var bare = Object.keys(grupe).sort().map(function (k, i) { return '<div class="atlas-litera" title="' + esc(k + ": " + grupe[k]) + '"><i style="--p:' + Math.max(3, 100 * grupe[k] / max) + '%;--c:' + cul(i) + '"></i><span>' + esc(k) + '</span></div>'; }).join("");
    var s = sectiune("atlas-glosar", C.glosar, C.glosarN);
    q(".atlas-grila", s).innerHTML = card("01", C.glosar, "intreaga") + '<div class="atlas-litere">' + bare + '</div><p style="margin-top:.8rem">' + termeni.length + ' ' + esc(C.glosar.toLowerCase()) + '</p></article>';
    insereazaDupaAntet(s);
  }

  function randeazaProgres() {
    var bloc = q("[data-progres-pagina] script[type='application/json']");
    if (!bloc) return;
    var date;
    try { date = JSON.parse(bloc.textContent); } catch (e) { return; }
    var mods = date.module || [];
    var total = 0, gata = 0;
    var bare = mods.map(function (m, i) {
      var t = Number(m.total) || 0, g = (m.unitati || []).length; total += t; gata += g;
      var p = t ? Math.round(100 * g / t) : 0;
      return '<div class="atlas-bara-rand"><span title="' + esc(m.titlu) + '">' + esc(m.titlu) + '</span><span class="atlas-pista"><i style="--p:' + p + '%;--c:' + cul(i) + '"></i></span><strong>' + g + ' / ' + t + '</strong></div>';
    }).join("");
    var s = sectiune("atlas-progres", C.progres, C.progresN);
    q(".atlas-grila", s).innerHTML = card("01", C.acoperire, "lata") + '<div class="atlas-bare">' + bare + '</div></article>' + card("02", C.publicate, "") + '<div class="atlas-inel" style="--p:' + (total ? Math.round(100 * gata / total) : 0) + '%"><span><strong>' + gata + '</strong><small>' + esc(C.din) + ' ' + total + '</small></span></div></article>';
    insereazaDupaAntet(s);
  }

  function randeazaInstrumente() {
    var galerie = q(".galerie-instr");
    if (!galerie) return;
    var tipuri = {};
    qa(".widget[data-tip]", galerie).forEach(function (w) { tipuri[w.getAttribute("data-tip")] = true; });
    var catalog = [
      ["serie", "Serii în timp", "tendințe și comparații"], ["bare", "Bare", "comparații între categorii"],
      ["piramida", "Piramida vârstelor", "structură demografică"], ["standardizare", "Standardizare", "rate comparabile"],
      ["screening", "Screening", "probabilități post-test"], ["icer", "Plan cost–eficacitate", "decizii la prag"],
      ["sir", "Model SIR", "dinamica unei epidemii"], ["rose", "Paradoxul prevenției", "populație vs. risc înalt"],
      ["daly", "DALY", "YLL și YLD"], ["predictie", "Prezice și verifică", "estimare înaintea datelor"],
      ["clasament", "Clasament dublu", "ordini după doi indicatori"]
    ];
    var html = catalog.map(function (x, i) {
      var activ = !!tipuri[x[0]];
      return '<div style="--c:' + cul(i) + ';opacity:' + (activ || !Object.keys(tipuri).length ? 1 : .62) + '"><strong>' + esc(x[1]) + (activ ? ' · ✓' : '') + '</strong><span>' + esc(x[2]) + '</span></div>';
    }).join("");
    var s = sectiune("atlas-laborator", C.laborator, C.laboratorN);
    q(".atlas-grila", s).innerHTML = card("01", C.disponibile, "lata") + '<div class="atlas-catalog">' + html + '</div></article>' + card("02", C.configurate, "") + '<div class="atlas-inel" style="--p:' + Math.round(100 * Object.keys(tipuri).length / catalog.length) + '%"><span><strong>' + Object.keys(tipuri).length + '</strong><small>' + esc(C.din) + ' ' + catalog.length + '</small></span></div></article>';
    insereazaDupaAntet(s);
  }

  function randeazaDespre() {
    var principii = qa(".principii > li");
    if (!principii.length) return;
    var p = principii.map(function (x, i) { return '<div style="--c:' + cul(i) + '"><strong>' + esc(text(q("h2", x))) + '</strong><p>' + esc(text(q("p", x))) + '</p></div>'; }).join("");
    var s = sectiune("atlas-despre", C.despre, C.despreN);
    q(".atlas-grila", s).innerHTML = card("01", C.despre, "intreaga") + '<div class="atlas-principii">' + p + '</div></article>';
    insereazaDupaAntet(s);
  }

  function randeazaJurnal() {
    var continut = q("main > .continut-pagina");
    if (!continut) return;
    var intrari = qa(":scope > article, :scope > ol > li, :scope > ul > li", continut).length;
    var m = /Versiunea\s+([^·<]+)/i.exec(text(q(".subsol"))) || /Version\s+([^·<]+)/i.exec(text(q(".subsol")));
    var versiune = m ? m[1].trim() : "—";
    var s = sectiune("atlas-jurnal", C.jurnal, C.jurnalN);
    q(".atlas-grila", s).innerHTML = card("01", C.jurnal, "intreaga") + '<div class="atlas-flux"><div style="--c:var(--m1)"><strong>' + intrari + '</strong><span>' + esc(intrari ? C.intrari : C.nimic) + '</span></div><div style="--c:var(--m2)"><strong>&rarr;</strong><span>revizie</span></div><div style="--c:var(--m3)"><strong>&rarr;</strong><span>verificare</span></div><div style="--c:var(--m4)"><strong>' + esc(versiune) + '</strong><span>' + esc(C.versiune) + '</span></div></div></article>';
    insereazaDupaAntet(s);
  }

  function randeazaPrezentare() {
    if (!document.body.classList.contains("prezentare")) return;
    var diap = qa(".diapozitiv");
    if (!diap.length) return;
    var hud = document.createElement("div");
    hud.className = "atlas-prez-hud";
    hud.setAttribute("aria-label", C.viz);
    var pista = diap.map(function (d, i) { return '<button type="button" data-atlas-slide="' + (i + 1) + '" title="' + esc((i + 1) + ". " + text(q("h2", d))) + '"></button>'; }).join("");
    hud.innerHTML = '<strong data-atlas-poz>1 / ' + diap.length + '</strong><div class="atlas-prez-pista">' + pista + '</div><span data-atlas-titlu aria-live="polite"></span><div class="atlas-prez-unelte"><button type="button" data-atlas-zoom-out aria-label="' + esc(C.zoomOut) + '">−</button><button type="button" data-atlas-zoom-in aria-label="' + esc(C.zoomIn) + '">+</button><button type="button" data-atlas-focus aria-pressed="false" aria-label="' + esc(C.focus) + '">◎</button></div>';
    document.body.appendChild(hud);
    var zoom = 1;
    function activ() { return q(".diapozitiv.activ") || diap[0]; }
    function sincronizeaza() {
      var a = activ(), i = diap.indexOf(a); if (i < 0) i = 0;
      textSet(q("[data-atlas-poz]", hud), (i + 1) + " / " + diap.length);
      textSet(q("[data-atlas-titlu]", hud), text(q("h2", a)) || (C.diapozitiv + " " + (i + 1)));
      qa("[data-atlas-slide]", hud).forEach(function (b, j) { b.classList.toggle("trecut", j < i); b.classList.toggle("curent", j === i); });
    }
    function textSet(n, v) { if (n) n.textContent = v; }
    qa("[data-atlas-slide]", hud).forEach(function (b) { b.addEventListener("click", function () { location.hash = b.getAttribute("data-atlas-slide"); }); });
    function aplicaZoom(n) { zoom = clamp(n, 1, 3); document.body.style.setProperty("--atlas-zoom", zoom); document.body.classList.toggle("atlas-zoom", zoom > 1); }
    q("[data-atlas-zoom-in]", hud).addEventListener("click", function () { aplicaZoom(zoom + .2); });
    q("[data-atlas-zoom-out]", hud).addEventListener("click", function () { aplicaZoom(zoom - .2); });
    q("[data-atlas-focus]", hud).addEventListener("click", function (e) { var v = !document.body.classList.contains("atlas-focus"); document.body.classList.toggle("atlas-focus", v); e.currentTarget.setAttribute("aria-pressed", String(v)); });
    document.addEventListener("pointermove", function (e) { if (!document.body.classList.contains("atlas-focus")) return; document.body.style.setProperty("--atlas-x", e.clientX + "px"); document.body.style.setProperty("--atlas-y", e.clientY + "px"); });
    document.addEventListener("keydown", function (e) { if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.key === "+" || e.key === "=") aplicaZoom(zoom + .2); else if (e.key === "-") aplicaZoom(zoom - .2); else if (e.key === "p" || e.key === "P") q("[data-atlas-focus]", hud).click(); });
    new MutationObserver(sincronizeaza).observe(q("[data-pachet]"), {subtree: true, attributes: true, attributeFilter: ["class"]});
    sincronizeaza();
  }

  function porneste() {
    adaugaSelector();
    if (document.body.classList.contains("prezentare")) { randeazaPrezentare(); return; }
    randeazaStart();
    randeazaDisciplina();
    randeazaUnitate();
    var pagina = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (pagina === "surse.html") randeazaSurse();
    else if (pagina === "glosar.html") randeazaGlosar();
    else if (pagina === "progres.html") randeazaProgres();
    else if (pagina === "instrumente.html") randeazaInstrumente();
    else if (pagina === "despre.html") randeazaDespre();
    else if (pagina === "jurnal.html") randeazaJurnal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", porneste);
  else porneste();
}());
