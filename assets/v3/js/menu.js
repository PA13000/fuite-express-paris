/* A.T.C. BAT, accueil V3 : en-tête et menus.
   Souris (survol), clic, clavier (Tab, Entrée, Échap) et toucher. Sous-menus gardés dans l'écran. */
(function () {
  'use strict';
  var bureau = window.matchMedia('(min-width: 1180px)');
  var survol = window.matchMedia('(hover: hover) and (pointer: fine)');
  var entete = document.querySelector('.entete');
  var nav = document.getElementById('menu-principal');
  var boutonMenu = document.querySelector('.bouton-menu');
  var parents = Array.prototype.slice.call(document.querySelectorAll('.a-sous-menu'));

  function majHauteur() {
    if (!entete) return;
    var r = entete.getBoundingClientRect();
    document.documentElement.style.setProperty('--entete-h', Math.round(r.height) + 'px');
    document.documentElement.style.setProperty('--haut-tiroir', Math.max(0, Math.round(r.bottom)) + 'px');
  }
  window.addEventListener('resize', majHauteur);
  window.addEventListener('scroll', function () {
    if (entete) entete.classList.toggle('defile', window.scrollY > 8);
    if (nav && nav.classList.contains('ouvert')) majHauteur();
  }, { passive: true });

  function bascule(li) { return li.querySelector(':scope > .menu__ligne > .bascule'); }
  function fermer(li, focus) {
    li.classList.remove('ouvert');
    var b = bascule(li); b.setAttribute('aria-expanded', 'false'); if (focus) b.focus();
  }
  function ouvrir(li) {
    parents.forEach(function (x) { if (x !== li) fermer(x); });
    li.classList.add('ouvert'); bascule(li).setAttribute('aria-expanded', 'true');
    var sm = li.querySelector(':scope > .sous-menu');
    if (bureau.matches && !li.classList.contains('a-mega')) {
      sm.classList.remove('a-droite');
      if (sm.getBoundingClientRect().right > window.innerWidth - 16) sm.classList.add('a-droite');
    }
  }
  function toutFermer() { parents.forEach(function (li) { fermer(li); }); }

  parents.forEach(function (li) {
    var b = bascule(li), minuterie;
    b.addEventListener('click', function (e) { e.stopPropagation(); li.classList.contains('ouvert') ? fermer(li) : ouvrir(li); });
    li.addEventListener('mouseenter', function () { if (bureau.matches && survol.matches) { clearTimeout(minuterie); ouvrir(li); } });
    li.addEventListener('mouseleave', function () {
      if (bureau.matches && survol.matches) minuterie = setTimeout(function () { if (!li.contains(document.activeElement)) fermer(li); }, 220);
    });
    li.addEventListener('focusin', function (e) {
      if (!bureau.matches || li.dataset.retenu === '1') return;
      if (li.querySelector(':scope > .sous-menu').contains(e.target)) ouvrir(li);
    });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) { delete li.dataset.retenu; if (bureau.matches) fermer(li); } });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && li.classList.contains('ouvert')) { e.stopPropagation(); li.dataset.retenu = '1'; fermer(li, true); }
    });
  });
  document.addEventListener('click', function (e) { if (bureau.matches && nav && !nav.contains(e.target)) toutFermer(); });

  function tiroir(ouvrir_) {
    if (!nav || !boutonMenu) return;
    majHauteur();
    nav.classList.toggle('ouvert', ouvrir_);
    boutonMenu.setAttribute('aria-expanded', ouvrir_ ? 'true' : 'false');
    boutonMenu.querySelector('.libelle').textContent = ouvrir_ ? 'Fermer' : 'Menu';
    document.body.classList.toggle('menu-ouvert', ouvrir_);
  }
  if (boutonMenu) boutonMenu.addEventListener('click', function () { tiroir(!nav.classList.contains('ouvert')); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (nav && nav.classList.contains('ouvert') && !bureau.matches) { tiroir(false); boutonMenu.focus(); }
    else if (bureau.matches) toutFermer();
  });
  if (nav) nav.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (a && !bureau.matches && nav.classList.contains('ouvert') && (a.getAttribute('href') || '').indexOf('#') !== -1) tiroir(false);
  });
  bureau.addEventListener('change', function () { tiroir(false); toutFermer(); majHauteur(); });
  majHauteur();
})();
