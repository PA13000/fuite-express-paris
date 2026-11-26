/* ATC V12 : comportements propres au téléphone.
   1. Bulle WhatsApp cachée tant que les boutons du premier écran sont visibles.
   2. Points sous le carrousel des services (défilement natif, aucun blocage vertical).
   3. Entrée en cascade du premier écran (transform/opacité, mouvement réduit respecté). */
(function () {
  'use strict';
  var body = document.body;
  if (!body || !body.classList.contains('accueil-v10') || body.dataset.v12) return;
  body.dataset.v12 = 'pret';
  var mobile = window.matchMedia('(max-width:759px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---- 3. Entrée du premier écran : une seule fois, au chargement, sur téléphone. ---- */
  if (mobile.matches && !reduce.matches && window.scrollY < 40) {
    body.classList.add('v12-mouvement');
    setTimeout(function () { body.classList.remove('v12-mouvement'); }, 1200);
  }

  /* ---- 1. Bulle WhatsApp ---- */
  var actions = body.querySelector('.heros__actions');
  if (actions && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { body.classList.toggle('v12-heros-visible', e.isIntersecting); });
    }, { threshold: 0 }).observe(actions);
  }

  /* ---- 2. Points du carrousel des services ---- */
  var trio = body.querySelector('.services-trio');
  if (trio) {
    var cartes = Array.from(trio.querySelectorAll(':scope > .service-carte'));
    var points = document.createElement('div');
    points.className = 'v12-points';
    points.setAttribute('role', 'group');
    points.setAttribute('aria-label', 'Choisir un service');
    var boutons = cartes.map(function (carte, i) {
      var b = document.createElement('button');
      b.type = 'button';
      var titre = carte.querySelector('h3');
      b.setAttribute('aria-label', 'Afficher ' + (titre ? titre.textContent.trim() : 'le service ' + (i + 1)));
      b.addEventListener('click', function () {
        trio.scrollTo({ left: carte.offsetLeft - trio.offsetLeft - (parseFloat(getComputedStyle(trio).paddingLeft) || 0), behavior: reduce.matches ? 'auto' : 'smooth' });
      });
      points.appendChild(b);
      return b;
    });
    trio.insertAdjacentElement('afterend', points);
    var actif = -1, attente = 0;
    function maj() {
      attente = 0;
      var gauche = trio.getBoundingClientRect().left + (parseFloat(getComputedStyle(trio).paddingLeft) || 0);
      var meilleur = 0, ecart = Infinity;
      cartes.forEach(function (c, i) {
        var d = Math.abs(c.getBoundingClientRect().left - gauche);
        if (d < ecart) { ecart = d; meilleur = i; }
      });
      if (trio.scrollLeft + trio.clientWidth >= trio.scrollWidth - 4) meilleur = cartes.length - 1;
      if (meilleur === actif) return;
      actif = meilleur;
      boutons.forEach(function (b, i) {
        if (i === actif) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
    }
    trio.addEventListener('scroll', function () { if (!attente) attente = requestAnimationFrame(maj); }, { passive: true });
    window.addEventListener('resize', function () { if (!attente) attente = requestAnimationFrame(maj); }, { passive: true });
    maj();

    /* Avance douce : une carte toutes les 4,5 s quand le carrousel est à l'écran,
       arrêt 8 s après chaque contact du visiteur, jamais en mouvement réduit. */
    var visible = false, dernierContact = 0;
    ['pointerdown', 'touchstart', 'wheel', 'focusin'].forEach(function (type) {
      trio.addEventListener(type, function () { dernierContact = Date.now(); }, { passive: true });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].intersectionRatio >= .6; }, { threshold: [0, .6, 1] }).observe(trio);
    }
    setInterval(function () {
      if (!mobile.matches || reduce.matches || !visible || document.hidden || Date.now() - dernierContact < 8000) return;
      var c = cartes[(actif + 1) % cartes.length];
      trio.scrollTo({ left: c.offsetLeft - trio.offsetLeft - (parseFloat(getComputedStyle(trio).paddingLeft) || 0), behavior: 'smooth' });
    }, 4500);
  }
})();
