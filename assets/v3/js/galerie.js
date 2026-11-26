/* A.T.C. BAT, accueil V3 : visionneuse des galeries d'origine (fond blanc, clavier, Échap). */
(function () {
  'use strict';
  var dlg = document.querySelector('.visionneuse');
  if (!dlg) return;
  var groupe = [], i = 0, declencheur = null, img = dlg.querySelector('img'), texte = dlg.querySelector('.visionneuse__texte');
  function montrer(n) {
    i = (n + groupe.length) % groupe.length;
    var b = groupe[i];
    img.src = b.getAttribute('data-grande');
    img.alt = b.querySelector('img').getAttribute('alt') || '';
    texte.textContent = (b.getAttribute('data-legende') || '') + ' (' + (i + 1) + ' / ' + groupe.length + ')';
    dlg.querySelector('.visionneuse__prec').hidden = dlg.querySelector('.visionneuse__suiv').hidden = groupe.length < 2;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.vignette');
    if (!b) return;
    groupe = Array.prototype.slice.call(b.closest('.vignettes').querySelectorAll('.vignette'));
    declencheur = b; montrer(groupe.indexOf(b));
    dlg.showModal(); dlg.querySelector('.visionneuse__fermer').focus();
  });
  dlg.querySelector('.visionneuse__fermer').addEventListener('click', function () { dlg.close(); });
  dlg.querySelector('.visionneuse__prec').addEventListener('click', function () { montrer(i - 1); });
  dlg.querySelector('.visionneuse__suiv').addEventListener('click', function () { montrer(i + 1); });
  dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') montrer(i - 1); if (e.key === 'ArrowRight') montrer(i + 1); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('visionneuse__interieur')) dlg.close(); });
  dlg.addEventListener('close', function () { img.removeAttribute('src'); if (declencheur) declencheur.focus(); });
})();
