/* ATC V13 : entrée du premier écran sur tablette (760–979 px), une seule
   fois au chargement. Mouvement réduit respecté. La bulle WhatsApp et le
   carrousel restent gérés par V12 (mobile.js). */
(function () {
  'use strict';
  var body = document.body;
  if (!body || !body.classList.contains('accueil-v10') || body.dataset.v13) return;
  body.dataset.v13 = 'pret';
  var tablette = window.matchMedia('(min-width:760px) and (max-width:979px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (tablette.matches && !reduce.matches && window.scrollY < 40) {
    body.classList.add('v13-mouvement');
    setTimeout(function () { body.classList.remove('v13-mouvement'); }, 1400);
  }
})();
