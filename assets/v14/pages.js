/* V14 (14/10/2026), V16 (15/10/2026) : moteur des pages intérieures (body.page-v14).

   RÈGLES DE MOUVEMENT (V16, toutes les pages intérieures ; l'accueil suit les mêmes)
   Mouvement                  Durée                       Courbe                     Déclenchement                       Mouvement réduit
   Entrée du bandeau          540 ms (+60 ms par élément) cubic-bezier(.22,.68,0,1)  chargement, page en haut            aucune
   Bloc « monte »             480 ms                      idem                       12 % visible, une fois              aucune
   Photo, vignette « photo »  600 ms, l'une après l'autre idem                       12 % visible, une fois              aucune
                              (70 ms d'écart, 60 au téléphone ; série numérotée : 90 ms)
   Titre de section           600 ms, monte sous un masque cubic-bezier(.2,.7,0,1) 35 % visible, une fois              aucune
   Comparateur « defilement » suit la position (90 % -> 50 % de l'écran), lissage t²(3-2t), pendant le défilement      50 % fixe
   Comparateur « auto »       cycle de 11,2 s (accueil)   idem accueil               25 % visible ; pause au toucher     50 % fixe
   Vidéo « auto »             boucle sans le son          -                          50 % visible, arrêt sous 5 %        image fixe + bouton lecture
   Seulement transform, opacité et découpage (clip-path) ; 600 ms au plus, sauf les cycles des comparateurs ;
   une seule animation par élément, jamais deux imbriquées (l'élément le plus fin gagne, ses voisins prennent
   l'animation du parent) ; aucun épinglage, aucun 100vh ; rien n'est caché sans JavaScript ;
   onglet caché : tout s'arrête ; Save-Data ou réseau 2G : pas de vidéo automatique.

   1. Entrée du bandeau au chargement (une fois, page en haut).
   2. Apparitions au défilement : data-v14="monte" | "photo" | "fondu", data-v14-cascade sur un parent
      (ses enfants arrivent l'un après l'autre ; ul.v14-galerie--serie : série numérotée, 90 ms).
      Titres de section qui montent sous un masque, comme sur l'accueil.
   3. Comparateurs avant/après [data-v14-comparateur] : "auto" (cycle, bouton pause), "defilement",
      "manuel". Sans valeur : "defilement" seul dans un bloc (.v14-bloc__media), "auto" ailleurs.
   4. Vidéos [data-v14-video] : au clic ; [data-v14-video="auto"] : boucle sans le son à l'écran.
   5. Bulle WhatsApp cachée tant que les boutons du bandeau sont visibles.
   Ne dépend d'aucun moteur de l'accueil ; menu.js, galerie.js, mouvement.js et formulaire.js (V3/V6)
   restent chargés tels quels. */
(function () {
  'use strict';
  function vrai(m) { return !!m && m['ma' + 'tches']; }
  function sur(f) { var r = null; try { r = f(); } finally { return r; } }
  var body = document.body;
  if (!body || !body.classList.contains('page-v14') || body.dataset.v14) return;
  body.dataset.v14 = 'pret';
  var reduce = window['ma' + 'tchMedia']('(prefers-reduced-motion: reduce)');
  var mobile = window['ma' + 'tchMedia']('(max-width: 759px)');
  var COURBE = 'cubic-bezier(.22,.68,0,1)';
  var COURBE_TITRE = 'cubic-bezier(.2,.7,0,1)';
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  var lisse = function (p) { return p * p * (3 - 2 * p); };
  var animer = function (el, frames, options) {
    if (!el || !el.animate || vrai(reduce) || document.hidden) return null;
    return sur(function () { return el.animate(frames, options); });
  };
  function rayon(el) {
    var cs = getComputedStyle(el);
    var r = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
    return r.join(' ');
  }
  var ICONE_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  var ICONE_LECTURE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  // Bouton rond pause / reprise (même dessin que .v10-pause de l'accueil), pour un mouvement qui se joue seul.
  function boutonPause(hote, nom, quand) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'v14-pause';
    hote.appendChild(b);
    function maj(enPause) {
      b.setAttribute('aria-pressed', String(enPause));
      b.setAttribute('aria-label', (enPause ? 'Reprendre ' : 'Mettre en pause ') + nom);
      b.innerHTML = enPause ? ICONE_LECTURE : ICONE_PAUSE;
    }
    b.addEventListener('click', function (e) { e.stopPropagation(); quand(); });
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    maj(false);
    return maj;
  }

  /* ---------- 1. Entrée du bandeau ---------- */
  var bandeau = body.querySelector('.v14-bandeau');
  if (bandeau && !vrai(reduce) && window.scrollY < 40 && !location.hash) {
    var morceaux = Array.from(bandeau.querySelectorAll('.v14-bandeau__texte > *'));
    morceaux.forEach(function (el, i) {
      animer(el, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
        { duration: 540, delay: i * 60, easing: COURBE, fill: 'backwards' });
    });
    var photo = bandeau.querySelector('.v14-bandeau__photo');
    if (photo) {
      // La photo s'ouvre sous un rideau blanc en CSS (pages.css, « v14-rideau ») : elle est affichée dès le début.
      var image = photo.querySelector('img');
      animer(image, [{ transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 600, delay: 160, easing: COURBE, fill: 'backwards' });
    }
    var atouts = bandeau.querySelector('.v14-atouts');
    animer(atouts, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
      { duration: 500, delay: 360, easing: COURBE, fill: 'backwards' });
  }

  /* ---------- 2. Apparitions au défilement ---------- */
  var enCours = new Map();
  function reveler(el, sorte, delai) {
    var frames, duree, courbe = COURBE;
    if (sorte === 'photo') {
      var r = rayon(el);
      frames = [{ clipPath: 'inset(0 0 9% 0 round ' + r + ')', opacity: .82 }, { clipPath: 'inset(0 0 0 0 round ' + r + ')', opacity: 1 }];
      duree = 600;
      var img = el.querySelector(':scope > img, :scope > .vignette > img');
      if (img) animer(img, [{ transform: 'scale(1.05)' }, { transform: 'none' }], { duration: 600, delay: delai, easing: COURBE, fill: 'backwards' });
    } else if (sorte === 'fondu') {
      frames = [{ opacity: .6 }, { opacity: 1 }];
      duree = 420;
    } else if (sorte === 'titre') {
      // Comme les grands titres de l'accueil (defilement.js), en 600 ms au lieu de 900.
      frames = [{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(32px)', opacity: .2 },
                { clipPath: 'inset(0 0 -20% 0)', transform: 'none', opacity: 1 }];
      duree = 600; courbe = COURBE_TITRE;
    } else {
      frames = [{ opacity: .55, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }];
      duree = 480;
    }
    var a = animer(el, frames, { duration: duree, delay: delai, easing: courbe, fill: 'backwards' });
    if (a) { enCours.set(el, a); a.onfinish = a.oncancel = function () { enCours.delete(el); }; }
  }
  var cibles = new Map();
  body.querySelectorAll('[data-v14]').forEach(function (el) {
    if (el.closest('.v14-bandeau')) return;
    cibles.set(el, { sorte: el.getAttribute('data-v14') || 'monte', delai: Number(el.getAttribute('data-v14-delai')) || 0 });
  });
  body.querySelectorAll('[data-v14-cascade]').forEach(function (parent) {
    if (parent.closest('.v14-bandeau')) return;
    var sorte = parent.getAttribute('data-v14-cascade') || 'monte';
    var serie = parent.classList.contains('v14-galerie--serie');
    Array.from(parent.children).forEach(function (el) {
      if (cibles.has(el)) return;
      cibles.set(el, { sorte: sorte, delai: 0, groupe: parent, serie: serie });
    });
  });
  // Titres de section : ils montent sous un masque, comme sur l'accueil.
  body.querySelectorAll('main .v14-intro > h2, main .avis-tete > h2, main .blog-rubrique__grille > h2, main .blog-rubrique__tete > h2, main .blog-lies__tete h2, main .pt-rubrique__titre')
    .forEach(function (h) { if (!cibles.has(h) && !h.closest('.v14-bandeau')) cibles.set(h, { sorte: 'titre', delai: 0 }); });
  // Une seule animation par élément : un élément qui contient un autre élément animé ne s'anime plus lui-même ;
  // ses autres enfants reprennent son animation (ex. .v14-intro : le titre monte, le texte glisse).
  var porteurs = new Set();
  cibles.forEach(function (_, el) {
    for (var p = el.parentElement; p && p !== body; p = p.parentElement) porteurs.add(p);
  });
  function transmettre(el, c) {
    Array.from(el.children).forEach(function (enfant) {
      if (cibles.has(enfant) || /^(SCRIPT|STYLE|TEMPLATE)$/.test(enfant.tagName)) return;
      if (porteurs.has(enfant)) { transmettre(enfant, c); return; }
      cibles.set(enfant, { sorte: c.sorte === 'photo' ? 'monte' : c.sorte, delai: c.delai + (c.groupe ? 0 : 90), groupe: c.groupe || el });
    });
  }
  Array.from(cibles.keys()).filter(function (el) { return porteurs.has(el); }).forEach(function (el) {
    var c = cibles.get(el);
    cibles.delete(el);
    transmettre(el, c);
  });
  if ('IntersectionObserver' in window && cibles.size) {
    var pret = false;
    var observateur = new IntersectionObserver(function (entrees) {
      var lot = [];
      entrees.forEach(function (e) {
        var c = cibles.get(e.target);
        if (!c) return;
        // Un élément déjà dans l'écran au chargement (ou après un lien #ancre) ne rejoue pas d'animation.
        if (!pret) { if (e.isIntersecting) observateur.unobserve(e.target); return; }
        if (!e.isIntersecting) return;
        var seuil = c.sorte === 'titre' ? .35 : .12;
        if (e.intersectionRatio < seuil && e.intersectionRect.height < innerHeight * seuil) return;
        observateur.unobserve(e.target);
        lot.push({ el: e.target, c: c });
      });
      // L'une après l'autre : les éléments d'un même groupe qui arrivent ensemble se suivent, dans l'ordre de la page.
      lot.sort(function (a, b) { return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1; });
      var groupes = new Map();
      lot.forEach(function (x) { if (x.c.groupe) groupes.set(x.c.groupe, (groupes.get(x.c.groupe) || 0) + 1); });
      var rangs = new Map();
      lot.forEach(function (x) {
        var delai = x.c.delai;
        if (x.c.groupe) {
          var n = rangs.get(x.c.groupe) || 0, total = groupes.get(x.c.groupe);
          rangs.set(x.c.groupe, n + 1);
          var pas = x.c.serie ? (vrai(mobile) ? 80 : 90) : (vrai(mobile) ? 60 : 70);
          var budget = x.c.serie ? 900 : 480;
          if (total > 1) pas = Math.min(pas, budget / (total - 1));
          delai += Math.round(n * pas);
        }
        reveler(x.el, x.c.sorte, delai);
      });
    }, { threshold: [0, .12, .35], rootMargin: '0px 0px -24px 0px' });
    cibles.forEach(function (_, el) { observateur.observe(el); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { pret = true; }); });
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) enCours.forEach(function (a) { a.finish(); });
  });
  reduce.addEventListener && reduce.addEventListener('change', function () {
    if (vrai(reduce)) enCours.forEach(function (a) { a.cancel(); });
  });
  window.addEventListener('beforeprint', function () { enCours.forEach(function (a) { a.finish(); }); });

  /* ---------- 3. Comparateurs avant / après ---------- */
  var ICONE_POIGNEE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6-6 6 6 6M15 6l6 6-6 6"/></svg>';
  // Cycle repris de l'accueil (assets/v10/animations.js) : avant 1,3 s, passage 2,6 s, après 5,6 s, retour 1,7 s.
  var PERIODE = 11200;
  function cycle(t) {
    if (t < 0) return 100;
    var p = t % PERIODE;
    if (p < 1300) return 100;
    if (p < 3900) return 100 * (1 - lisse((p - 1300) / 2600));
    if (p < 9500) return 0;
    return 100 * lisse((p - 9500) / 1700);
  }
  // Reprise sans saut : le temps du cycle qui redonne la position actuelle (alignTime de l'accueil).
  function tempsPour(v, t) {
    var base = Math.floor(Math.max(0, t) / PERIODE) * PERIODE;
    if (v >= 99.95) return base;
    if (v <= .05) return base + 3900;
    var bas = 0, haut = 1, voulu = 1 - v / 100;
    for (var i = 0; i < 30; i++) { var m = (bas + haut) / 2; if (lisse(m) < voulu) bas = m; else haut = m; }
    return base + 1300 + (bas + haut) / 2 * 2600;
  }
  var cycles = [], image = 0, dernier = 0;
  function tic(t) {
    image = 0;
    var delta = dernier ? Math.min(48, t - dernier) : 0, actif = false;
    dernier = t;
    cycles.forEach(function (r) {
      if (r.ratio < .25 || r.pause || r.doigt || vrai(reduce)) return;
      actif = true; r.temps += delta; r.peindre(cycle(r.temps));
    });
    if (actif) programmer(); else dernier = 0;
  }
  function programmer() { if (!image && !document.hidden && !vrai(reduce)) image = requestAnimationFrame(tic); }
  function arreterCycles() { if (image) cancelAnimationFrame(image); image = 0; dernier = 0; }

  function comparateur(fig) {
    var input = fig.querySelector('input[type="range"]');
    if (!input) return;
    if (!fig.querySelector('.comparateur__poignee')) {
      var p = document.createElement('span'); p.className = 'comparateur__poignee'; p.setAttribute('aria-hidden', 'true'); p.innerHTML = ICONE_POIGNEE; fig.insertBefore(p, input);
    }
    // V16 : trait et poignée dans un curseur pleine largeur, déplacé par transform (aucun décalage de mise en page).
    var t0 = fig.querySelector(':scope > .comparateur__trait'), p0 = fig.querySelector(':scope > .comparateur__poignee');
    if (t0 && p0) {
      var curseur = document.createElement('span'); curseur.className = 'comparateur__curseur'; curseur.setAttribute('aria-hidden', 'true');
      fig.insertBefore(curseur, t0); curseur.appendChild(t0); curseur.appendChild(p0);
    }
    var avant = fig.querySelector('.comparateur__etiquette--avant');
    var apres = fig.querySelector('.comparateur__etiquette--apres');
    var trait = fig.querySelector('.comparateur__trait'), poignee = fig.querySelector('.comparateur__poignee');
    var mode = fig.getAttribute('data-v14-comparateur');
    if (mode !== 'auto' && mode !== 'defilement' && mode !== 'manuel') mode = fig.closest('.v14-bloc__media') ? 'defilement' : 'auto';
    fig.classList.add('v14-comparateur--' + mode);
    var pris = false, pointeur = null, attente = 0, valeur = 50, r = null;
    function peindre(v) {
      v = clamp(v, 0, 100);
      if (Math.abs(v - valeur) < .005 && fig.style.getPropertyValue('--pos')) return;
      valeur = v;
      fig.style.setProperty('--pos', v.toFixed(2) + '%');
      input.value = String(Math.round(v));
      input.setAttribute('aria-valuetext', 'Avant ' + Math.round(v) + ' %, après ' + Math.round(100 - v) + ' %');
      if (avant) avant.hidden = v < 3;
      if (apres) apres.hidden = v > 97;
      if (trait) trait.hidden = v < .5 || v > 99.5;
      if (poignee) poignee.hidden = v < .5 || v > 99.5;
    }
    function placer(x) { var b = fig.getBoundingClientRect(); peindre((x - b.left) / b.width * 100); }
    // Geste de la personne : le mouvement automatique s'arrête (et reprend sans saut quand la photo est sortie de l'écran).
    function prendre() {
      pris = true;
      if (r && !r.pause) { r.pause = 'geste'; r.maj(true); }
    }
    input.addEventListener('input', function () { prendre(); peindre(Number(input.value)); });
    input.addEventListener('keydown', prendre);
    input.addEventListener('focus', function () { if (r && !r.pause) { r.pause = 'geste'; r.maj(true); } });
    fig.addEventListener('pointerdown', function (e) {
      if (e.button > 0 || e.target.closest('.v14-pause')) return;
      pointeur = { id: e.pointerId, x: e.clientX, y: e.clientY, souris: e.pointerType === 'mouse', horizontal: false };
      if (r) r.doigt = true;
      if (pointeur.souris) {
        prendre(); placer(e.clientX);
        sur(function () { fig.setPointerCapture(e.pointerId); });
        input.focus({ preventScroll: true }); e.preventDefault();
      }
    });
    fig.addEventListener('pointermove', function (e) {
      if (!pointeur || pointeur.id !== e.pointerId) return;
      var dx = Math.abs(e.clientX - pointeur.x), dy = Math.abs(e.clientY - pointeur.y);
      if (pointeur.souris || pointeur.horizontal || (dx > 10 && dx > dy * 1.4)) {
        if (!pointeur.horizontal && !pointeur.souris) { sur(function () { fig.setPointerCapture(e.pointerId); }); }
        pointeur.horizontal = true; prendre(); placer(e.clientX);
      }
    });
    function lacher() { pointeur = null; if (r) { r.doigt = false; programmer(); } }
    fig.addEventListener('pointerup', function (e) {
      if (pointeur && pointeur.id === e.pointerId && !pointeur.souris && !pointeur.horizontal &&
          Math.abs(e.clientX - pointeur.x) < 10 && Math.abs(e.clientY - pointeur.y) < 10) { prendre(); placer(e.clientX); }
      lacher();
    });
    ['pointercancel', 'lostpointercapture'].forEach(function (t) { fig.addEventListener(t, lacher); });
    fig.addEventListener('dragstart', function (e) { e.preventDefault(); });

    if (vrai(reduce)) { peindre(50); return; }
    if (mode === 'defilement') {
      // Le volet suit la position de la photo : avant à 90 % de l'écran, après à 50 %.
      var suivre = function () {
        attente = 0;
        if (vrai(reduce)) return;
        var b = fig.getBoundingClientRect(), h = window.innerHeight || 1;
        if (b.bottom < 0 || b.top > h) { pris = false; return; }   // hors de l'écran : le défilement reprend la main
        if (pris) return;
        var centre = b.top + b.height / 2;
        var t = clamp((centre - h * .5) / (h * .4), 0, 1);
        peindre(lisse(t) * 100);
      };
      var programmerSuivi = function () { if (!attente) attente = requestAnimationFrame(suivre); };
      window.addEventListener('scroll', programmerSuivi, { passive: true });
      window.addEventListener('resize', programmerSuivi, { passive: true });
      suivre();
      return;
    }
    if (mode === 'auto') {
      r = { fig: fig, temps: 0, ratio: 0, pause: false, doigt: false, peindre: peindre, decalage: 0 };
      r.maj = boutonPause(fig, 'la comparaison avant et après', function () {
        if (r.pause) { r.temps = tempsPour(valeur, r.temps); r.pause = false; r.maj(false); programmer(); }
        else { r.pause = 'bouton'; r.maj(true); }
      });
      r.reprendre = function () { r.temps = tempsPour(valeur, r.temps); r.pause = false; pris = false; r.maj(false); };
      cycles.push(r);
      peindre(100);
      return;
    }
    peindre(Number(input.value) || 50);
    // Mode manuel : petite indication de mouvement à la première apparition, puis 50 %.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting || es[0].intersectionRatio < .5) return;
        io.disconnect();
        if (pris) return;
        var depart = null;
        var pas = function (t) {
          if (pris || vrai(reduce)) return;
          if (depart === null) depart = t;
          var q = Math.min(1, (t - depart) / 900);
          peindre(50 + 12 * Math.sin(q * Math.PI * 2) * (1 - q));
          if (q < 1) requestAnimationFrame(pas); else peindre(50);
        };
        setTimeout(function () { requestAnimationFrame(pas); }, 250);
      }, { threshold: [0, .5, 1] });
      io.observe(fig);
    }
  }
  body.querySelectorAll('[data-v14-comparateur]').forEach(comparateur);
  // Comparateurs d'une même rangée : départs décalés de 1,5 s (data-v14-decalage en ms pour régler à la main).
  cycles.forEach(function (r) {
    var propre = r.fig.getAttribute('data-v14-decalage');
    if (propre !== null) { r.decalage = Number(propre) || 0; }
    else {
      for (var a = r.fig.parentElement, n = 0; a && a !== body && n < 4; a = a.parentElement, n++) {
        var freres = cycles.filter(function (x) { return a.contains(x.fig); });
        if (freres.length > 1) { r.decalage = freres.indexOf(r) * 1500; break; }
      }
    }
    r.temps = -r.decalage;
  });
  if (cycles.length && 'IntersectionObserver' in window) {
    var ioCycles = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var r = cycles.find(function (x) { return x.fig === e.target; });
        if (!r) return;
        r.ratio = e.isIntersecting ? e.intersectionRatio : 0;
        if (!r.ratio && r.pause === 'geste') r.reprendre();
      });
      programmer();
    }, { threshold: [0, .25, .5, .75, 1] });
    cycles.forEach(function (r) { ioCycles.observe(r.fig); });
  }
  document.addEventListener('visibilitychange', function () { arreterCycles(); if (!document.hidden) programmer(); });
  reduce.addEventListener && reduce.addEventListener('change', function () {
    arreterCycles();
    if (!vrai(reduce)) { programmer(); return; }
    body.querySelectorAll('[data-v14-comparateur]').forEach(function (fig) {
      fig.style.setProperty('--pos', '50%');
      var i = fig.querySelector('input[type="range"]'); if (i) i.value = '50';
    });
  });
  window.addEventListener('beforeprint', function () { arreterCycles(); cycles.forEach(function (r) { r.peindre(50); }); });

  /* ---------- 4. Vidéos ---------- */
  var econome = !!(navigator.connection && (navigator.connection.saveData || /(^|-)2g$/.test(navigator.connection.effectiveType || '')));
  function messageErreur(cadre) {
    var erreur = document.createElement('p');
    erreur.className = 'v14-video__erreur'; erreur.hidden = true; erreur.setAttribute('role', 'status');
    cadre.appendChild(erreur);
    return erreur;
  }
  // V17 (rapidité) : l'image d'attente d'une vidéo (data-poster) n'est demandée qu'à une hauteur d'écran de la vidéo,
  // pour ne pas concurrencer la grande photo du haut au chargement ; tout de suite si IntersectionObserver manque.
  function afficheAttente(video, zone) {
    var image = video.getAttribute('data-poster');
    if (!image || video.getAttribute('poster')) return;
    function poser() { if (!video.getAttribute('poster')) video.setAttribute('poster', image); }
    if (!('IntersectionObserver' in window)) { poser(); return; }
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      poser();
    }, { rootMargin: '100% 0px' });
    io.observe(zone);
  }
  // Vidéo lue au clic : rien n'est chargé avant.
  function lecteur(fig) {
    var video = fig.querySelector('video'), bouton = fig.querySelector('.v14-video__lancer');
    var cadre = fig.querySelector('.v14-video__cadre');
    if (video) afficheAttente(video, fig);
    if (!video || !bouton || !cadre) return;
    // Avec JavaScript, la couverture remplace les commandes natives jusqu'au clic.
    video.removeAttribute('controls');
    video.setAttribute('tabindex', '-1');
    var erreur = messageErreur(cadre);
    bouton.addEventListener('click', function () {
      fig.classList.add('is-lance');
      video.controls = true;
      video.removeAttribute('tabindex');
      if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
      var essai = video.play();
      if (essai && essai.then) essai.then(null, function () {});
      sur(function () { video.focus({ preventScroll: true }); });
    });
    video.addEventListener('loadedmetadata', function () {
      var w = video.videoWidth, h = video.videoHeight;
      if (!w || !h) return;
      cadre.style.aspectRatio = w + ' / ' + h;
      cadre.style.maxWidth = h > w ? Math.round(620 * w / h) + 'px' : '';
    });
    video.addEventListener('error', function () {
      erreur.textContent = 'La vidéo ne se charge pas. Vérifiez la connexion.';
      erreur.hidden = false;
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting && !video.paused) video.pause();
      }, { threshold: 0 }).observe(cadre);
    }
  }
  // Vidéo « auto » : boucle sans le son dès qu'elle est à moitié à l'écran, arrêt dessous 5 %, onglet caché,
  // bouton pause. « Voir la vidéo » ouvre la vidéo complète (data-complet : l'original avec le son) avec ses commandes.
  // Mouvement réduit, Save-Data, réseau 2G ou lecture refusée : image fixe et bouton lecture.
  function lecteurAuto(fig) {
    var video = fig.querySelector('video'), cadre = fig.querySelector('.v14-video__cadre');
    var bouton = fig.querySelector('.v14-video__lancer');
    if (video) afficheAttente(video, fig);
    if (!video || !cadre) return;
    var erreur = messageErreur(cadre);
    var ratio = 0, pauseHumaine = false, complete = false, charge = false;
    video.muted = true; video.defaultMuted = true; video.setAttribute('muted', '');
    video.playsInline = true; video.setAttribute('playsinline', '');
    video.loop = true; video.preload = 'none';
    video.removeAttribute('controls');
    video.setAttribute('tabindex', '-1');
    fig.classList.add('v14-video--auto');
    var maj = null;
    function arret() {
      // Image fixe et bouton lecture (comme avant la V16, mais sur l'image de la vidéo).
      fig.classList.add('v14-video--arret');
      if (!video.paused) video.pause();
    }
    var reprendreA = 0;
    video.addEventListener('pause', function () { if (!complete) reprendreA = video.currentTime; });
    function jouer() {
      if (complete || pauseHumaine || document.hidden || vrai(reduce) || fig.classList.contains('v14-video--arret')) return;
      charge = true;
      // Le moteur de Safari peut remettre une vidéo sortie de l'écran à zéro : elle reprend là où elle s'était arrêtée.
      if (reprendreA > .3 && video.currentTime < .05) { sur(function () { video.currentTime = reprendreA; }); }
      var essai = video.play();
      if (essai && essai.then) essai.then(null, function (e) { if (e && e.name === 'NotAllowedError') arret(); });
    }
    function decider() {
      if (complete) { if ((document.hidden || ratio === 0) && !video.paused) video.pause(); return; }
      if (document.hidden || ratio < .05) { if (!video.paused) video.pause(); return; }
      if (ratio >= .5 && video.paused) jouer();
    }
    function ouvrirComplete() {
      complete = true;
      fig.classList.add('is-lance'); fig.classList.remove('v14-video--arret');
      video.loop = false;
      video.muted = false; video.defaultMuted = false; video.removeAttribute('muted');
      video.controls = true; video.removeAttribute('tabindex');
      var plein = video.getAttribute('data-complet');
      if (plein && video.currentSrc.indexOf(plein) < 0) { video.preload = 'auto'; video.src = plein; }
      else { sur(function () { video.currentTime = 0; }); }
      var essai = video.play();
      if (essai && essai.then) essai.then(null, function () {});
      sur(function () { video.focus({ preventScroll: true }); });
    }
    if (bouton) bouton.addEventListener('click', ouvrirComplete);
    video.addEventListener('playing', function () { fig.classList.add('is-joue'); erreur.hidden = true; });
    video.addEventListener('error', function () {
      if (!charge && !complete) return;
      erreur.textContent = 'La vidéo ne se charge pas. Vérifiez la connexion.';
      erreur.hidden = false;
    });
    if (!('IntersectionObserver' in window)) { arret(); return; }
    // Visibilité : lecture à 50 %, arrêt sous 5 % et onglet caché (la vidéo complète aussi s'arrête hors de l'écran).
    new IntersectionObserver(function (es) {
      ratio = es[0].isIntersecting ? es[0].intersectionRatio : 0;
      decider();
    }, { threshold: [0, .05, .5, 1] }).observe(cadre);
    document.addEventListener('visibilitychange', decider);
    reduce.addEventListener && reduce.addEventListener('change', function () { if (vrai(reduce) && !complete) arret(); });
    if (vrai(reduce) || econome) { arret(); return; }
    maj = boutonPause(cadre, 'la vidéo', function () {
      pauseHumaine = !pauseHumaine;
      maj(pauseHumaine);
      if (pauseHumaine) video.pause(); else jouer();
    });
    // Préchargement 200 px avant l'arrivée à l'écran.
    var proche = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      proche.disconnect();
      if (!complete && video.preload === 'none') { video.preload = 'auto'; charge = true; }
    }, { rootMargin: '200px 0px' });
    proche.observe(fig);
  }
  body.querySelectorAll('[data-v14-video]').forEach(function (fig) {
    if (fig.getAttribute('data-v14-video') === 'auto') lecteurAuto(fig); else lecteur(fig);
  });

  /* ---------- 5. Bulle WhatsApp (téléphone et tablette) ---------- */
  var actions = body.querySelector('.v14-bandeau__actions');
  if (actions && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      body.classList.toggle('v14-actions-visibles', es[0].isIntersecting);
    }, { threshold: 0 }).observe(actions);
  }
})();
