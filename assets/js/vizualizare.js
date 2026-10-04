(function () {
  "use strict";
  var CHEIE = "atelier:vizualizare";
  var MODURI = ["atelier", "editorial"];
  var radacina = document.documentElement;

  function modValid(mod) {
    return MODURI.indexOf(mod) !== -1 ? mod : "editorial";
  }

  function sincronizeazaButoanele(mod) {
    document.querySelectorAll("[data-vizualizare]").forEach(function (buton) {
      buton.setAttribute("aria-pressed", String(buton.dataset.vizualizare === mod));
    });
  }

  function aplica(mod, salveaza) {
    mod = modValid(mod);
    radacina.dataset.view = mod;
    if (salveaza) {
      try { localStorage.setItem(CHEIE, mod); } catch (eroare) {}
    }
    sincronizeazaButoanele(mod);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mod === "editorial" ? "#ffffff" : "#11121a");
  }

  document.addEventListener("click", function (eveniment) {
    var buton = eveniment.target.closest("[data-vizualizare]");
    if (buton) {
      aplica(buton.dataset.vizualizare, true);
      return;
    }

    var meniu = eveniment.target.closest("[data-panou-meniu]");
    if (meniu) {
      var navigatie = document.getElementById(meniu.getAttribute("aria-controls"));
      if (!navigatie) return;
      var deschis = navigatie.classList.toggle("deschis");
      meniu.setAttribute("aria-expanded", String(deschis));
      meniu.setAttribute("aria-label", deschis ? "Închide meniul" : "Deschide meniul");
      return;
    }

    var legaturaPanou = eveniment.target.closest("#panou-nav a");
    if (legaturaPanou) {
      var panouNav = document.getElementById("panou-nav");
      var butonMeniu = document.querySelector("[data-panou-meniu]");
      if (panouNav) panouNav.classList.remove("deschis");
      if (butonMeniu) {
        butonMeniu.setAttribute("aria-expanded", "false");
        butonMeniu.setAttribute("aria-label", "Deschide meniul");
      }
    }
  });

  function porneste() {
    var mod = radacina.dataset.view;
    if (!mod) {
      try { mod = localStorage.getItem(CHEIE); } catch (eroare) {}
    }
    document.querySelectorAll("[data-vizualizare]").forEach(function (buton) {
      buton.onclick = function () { aplica(buton.dataset.vizualizare, true); };
    });
    aplica(mod || "editorial", false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", porneste);
  } else {
    porneste();
  }
})();
