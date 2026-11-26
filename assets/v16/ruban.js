/* ATC V16 (15/10/2026) : ruban animé des pages intérieures (Petits travaux : les 18 rubriques en photos).
   Repris du ruban de l'accueil (assets/v10/animations.js, setupStrip et la boucle du ruban), sans la garde
   « accueil-v10 » et sans les comparateurs, qui restent au socle (assets/v14/pages.js).

   HTML : <div class="v16-ruban" data-v16-ruban>
            <div class="v10-ruban__fenetre"><div class="v10-ruban__piste" aria-hidden="true"><ul> cartes </ul></div></div>
          </div>
   Le ruban double une navigation texte (le sommaire de la page) : il est caché aux lecteurs d'écran et ses
   liens sont hors tabulation ; le bouton pause, lui, est accessible (ajouté ici, hors de la piste).

   Mouvement (règles en tête de assets/v14/pages.js) : 0,048 px/ms, linéaire, transform seulement ;
   lancé quand le ruban est visible à 25 % ; arrêt au survol de la souris, sous le doigt (glisser fait
   défiler à la main) et au bouton rond (44 px) ; après un geste, reprise quand le ruban est sorti de l'écran
   puis revient ; onglet caché ou impression : arrêt. Mouvement réduit : pas de copie, aucun mouvement,
   défilement natif. Sans JavaScript : défilement natif (page-petits-travaux.css). */
(function () {
  'use strict';
  var hotes = document.querySelectorAll('[data-v16-ruban]');
  if (!hotes.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var VITESSE = .048;   // px par ms, comme l'accueil
  var rubans = [], image = 0, dernier = 0;
  var ICONE_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  var ICONE_LECTURE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  function placer(r) { r.piste.style.transform = 'translate3d(' + (-r.decalage).toFixed(2) + 'px,0,0)'; }
  function geometrie(r) {
    var gap = parseFloat(getComputedStyle(r.piste).columnGap) || 0;
    r.cycle = r.liste.getBoundingClientRect().width + gap;
    if (r.cycle) r.decalage = ((r.decalage % r.cycle) + r.cycle) % r.cycle;
  }
  function deplacer(r, dx) {
    if (!r.cycle) return;
    r.decalage = ((r.decalage + dx) % r.cycle + r.cycle) % r.cycle;
    placer(r);
  }
  // Mouvement réduit : la copie disparaît, la piste revient à sa place, la fenêtre défile à la main.
  function regler(r) {
    var anime = !reduce.matches;
    r.copie.hidden = !anime;
    r.hote.classList.toggle('is-anime', anime);
    if (!anime) { r.decalage = 0; r.piste.style.transform = ''; }
    else { geometrie(r); placer(r); }
  }

  function installer(hote) {
    var fenetre = hote.querySelector('.v10-ruban__fenetre'), piste = hote.querySelector('.v10-ruban__piste');
    var liste = piste && piste.querySelector(':scope > ul');
    if (!fenetre || !liste) return;
    liste.querySelectorAll('a, img').forEach(function (el) { el.draggable = false; });
    var copie = liste.cloneNode(true);
    copie.setAttribute('aria-hidden', 'true');
    copie.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
    piste.appendChild(copie);
    var r = { hote: hote, fenetre: fenetre, piste: piste, liste: liste, copie: copie, decalage: 0, cycle: 0, ratio: 0,
              pause: false, survol: false, doigt: null, glisse: false };

    // Bouton rond pause / reprise (dessin du socle, .v14-pause), hors de la piste cachée aux lecteurs d'écran.
    var bouton = document.createElement('button');
    bouton.type = 'button'; bouton.className = 'v14-pause v16-ruban__pause';
    hote.appendChild(bouton);
    r.maj = function () {
      var enPause = !!r.pause;
      bouton.setAttribute('aria-pressed', String(enPause));
      bouton.setAttribute('aria-label', (enPause ? 'Faire défiler ' : 'Mettre en pause ') + 'les photos des rubriques');
      bouton.innerHTML = enPause ? ICONE_LECTURE : ICONE_PAUSE;
    };
    r.mettre = function (cause) { if (r.pause !== cause) { r.pause = cause; r.maj(); } programmer(); };
    bouton.addEventListener('click', function (e) { e.stopPropagation(); r.mettre(r.pause ? false : 'bouton'); });
    r.maj();

    // Souris : arrêt au survol. Doigt ou souris qui glisse : défilement à la main, puis arrêt (« geste »).
    piste.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { r.survol = true; } });
    piste.addEventListener('pointerleave', function () { r.survol = false; programmer(); });
    piste.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      r.glisse = false;
      r.doigt = { id: e.pointerId, x: e.clientX, y: e.clientY, decalage: r.decalage };
    });
    piste.addEventListener('pointermove', function (e) {
      if (!r.doigt || r.doigt.id !== e.pointerId || reduce.matches) return;
      var dx = e.clientX - r.doigt.x, dy = e.clientY - r.doigt.y;
      if (r.glisse || (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.4)) {
        r.glisse = true;
        if (r.pause !== 'bouton') r.mettre('geste');
        r.decalage = r.doigt.decalage;
        deplacer(r, -dx);
      }
    });
    piste.addEventListener('dragstart', function (e) { e.preventDefault(); });
    // Après un glissement, le relâchement n'ouvre pas la rubrique sous le doigt.
    piste.addEventListener('click', function (e) { if (r.glisse) { e.preventDefault(); r.glisse = false; } }, true);
    fenetre.addEventListener('wheel', function (e) {
      if (reduce.matches) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
        e.preventDefault();
        if (r.pause !== 'bouton') r.mettre('geste');
        deplacer(r, e.shiftKey ? e.deltaY : e.deltaX);
      }
    }, { passive: false });

    // Photos chargées un peu avant l'arrivée du ruban (elles servent aussi aux rubriques plus bas) :
    // aucune carte vide pendant le défilement.
    if ('IntersectionObserver' in window) {
      var proche = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        proche.disconnect();
        piste.querySelectorAll('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; });
      }, { rootMargin: '600px 0px' });
      proche.observe(hote);
    }

    regler(r);
    rubans.push(r);
  }

  function programmer() { if (!image && !document.hidden && !reduce.matches) image = requestAnimationFrame(tic); }
  function arreter() { if (image) cancelAnimationFrame(image); image = 0; dernier = 0; }
  function tic(t) {
    image = 0;
    var delta = dernier ? Math.min(48, t - dernier) : 0, actif = false;
    dernier = t;
    rubans.forEach(function (r) {
      if (r.ratio < .25 || r.pause || r.survol || r.doigt || !r.cycle || reduce.matches) return;
      actif = true;
      r.decalage = (r.decalage + delta * VITESSE) % r.cycle;
      placer(r);
    });
    if (actif) programmer(); else dernier = 0;
  }

  hotes.forEach(installer);
  if (!rubans.length) return;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var r = rubans.find(function (x) { return x.fenetre === e.target; });
        if (!r) return;
        r.ratio = e.isIntersecting ? e.intersectionRatio : 0;
        // Sorti de l'écran après un geste : il repartira tout seul à son retour.
        if (!r.ratio && r.pause === 'geste') { r.pause = false; r.maj(); }
      });
      programmer();
    }, { threshold: [0, .25, .5, .75, 1] });
    rubans.forEach(function (r) { io.observe(r.fenetre); });
  }
  ['pointerup', 'pointercancel'].forEach(function (type) {
    window.addEventListener(type, function () { rubans.forEach(function (r) { r.doigt = null; }); programmer(); }, { passive: true });
  });
  window.addEventListener('resize', function () { rubans.forEach(function (r) { if (!reduce.matches) { geometrie(r); placer(r); } }); }, { passive: true });
  document.addEventListener('visibilitychange', function () { arreter(); if (!document.hidden) programmer(); });
  var changer = function () { arreter(); rubans.forEach(regler); programmer(); };
  if (reduce.addEventListener) reduce.addEventListener('change', changer); else if (reduce.addListener) reduce.addListener(changer);
  window.addEventListener('beforeprint', arreter);
  window.addEventListener('afterprint', programmer);
  programmer();
})();
