/* Accueil ATC : comparaison par pièces observées, pas par secondes identiques.
   Profil relevé le 05/10/2026.
   AVANT = horloge. APRÈS = interpolation monotone par segment, vitesse variable.
   Montage court : détours et angles non comparables sautés par seek sur les deux sources.
   Les angles et quelques détours restent différents : aucune promesse d'alignement image par image.
   Sources attachées uniquement au clic ou à l'arrivée du lecteur dans l'écran.
   Pause hors écran/onglet caché ; pause humaine et réduction des animations respectées.
   V16 (15/10/2026) : les deux vidéos sont ré-encodées dans /assets/v16/video/ (sans son, mêmes horodatages image
   par image que les originaux, même nom de fichier : le profil reste reconnu). Si le serveur ne permet pas de se
   placer dans la vidéo (pas de requêtes partielles), l'original de
   atcbat.fr (data-complet, même minutage) est repris automatiquement.
   V17 (16/10/2026) : images d'attente en data-poster, posées à l'approche du lecteur (rapidité). */
(function () {
  'use strict';
  var PROFIL = {
    id: 'lelexine-reperes-spatiaux-v5-20261005',
    avant: 'Pendant-Renovation-appartement-de-standing-Lelexine.mp4',
    apres: 'Apres-Renovation-complete-appartement-de-standing-Lelexine.mp4',
    /* [début avant, fin avant, début après, fin après, pièce].
       Coupures explicites : prises de vue non comparables retirées des deux parcours.
       Chaque segment conserve les fichiers originaux et avance les deux positions. */
    segments: [[16, 21.5, 18, 25.5, 'Dégagement en pierre'],
      [21.5, 26.5, 25.5, 30, 'Pièce côté dégagement'],
      [26.5, 31.5, 30, 33, 'Pièce côté dégagement'],
      [31.5, 35, 33, 36, 'Pièce côté dégagement'],
      [35, 37, 36, 39, 'Dégagement en pierre'],
      [37, 40.5, 39, 42.5, 'Première chambre'],
      [40.5, 45, 42.5, 46, 'Première chambre'],
      [45, 48, 46, 49, 'Première chambre'],
      [48, 50, 49, 51, 'Dégagement en pierre'],
      [50, 54, 51, 55, 'Deuxième chambre'],
      [54, 58, 55, 60, 'Deuxième chambre'],
      [61, 63, 61, 63, 'Deuxième chambre'],
      [63, 66, 63, 66, 'Deuxième chambre'],
      [66, 72.5, 66, 75.5, 'Dégagement en pierre'],
      [72.5, 75.5, 75.5, 80, 'Séjour et cuisine'],
      [75.5, 78, 80, 82, 'Séjour et cuisine'],
      [78, 82, 82, 86, 'Séjour et cuisine'],
      [94, 96, 98, 100, 'Vue depuis le balcon'],
      [100, 102, 108, 110, 'Séjour'],
      [102, 105, 115.5, 119, 'Chambre côté balcon'],
      [110, 114, 119, 122, 'Chambre côté balcon'],
      [114, 118, 122, 126, 'Chambre côté balcon'],
      [118, 122, 126, 130, 'Pièce attenante au séjour'],
      [124, 127.34, 132, 134.51, 'Dernière pièce']]


  };
  function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function Duo(racine) {
    var videos = racine.querySelectorAll('video'), A = videos[0], B = videos[1];
    var bouton = racine.querySelector('[data-action="lecture"]'), libelle = bouton.querySelector('span');
    var debut = racine.querySelector('[data-action="debut"]'), prog = racine.querySelector('.duo-video__progression input');
    var temps = racine.querySelector('.duo-video__temps'), statut = racine.querySelector('.duo-video__statut');
    var epure = document.body.classList.contains('accueil-v10');
    var voiles = racine.querySelectorAll('.duo-video__voile');
    var etat = 'repos', veutLire = false, charge = false, initialise = false, raf = 0, glisse = false;
    var corrections = 0, relance = 0, generation = 0, dansEcran = null, pauseHumaine = false, autoTente = false;
    var mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)');
    var profilReel = (A.dataset.src || '').endsWith(PROFIL.avant) && (B.dataset.src || '').endsWith(PROFIL.apres);
    var segments = profilReel ? PROFIL.segments : null, segmentIndex = 0;
    var pieceLabel = racine.querySelector('[data-piece-label]');
    var ICONE_LECTURE = '<path d="M8 5v14l11-7z"/>', ICONE_PAUSE = '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>';
    function duree(v) { return Number.isFinite(v.duration) ? v.duration : 0; }
    function secours(v) {
      var plein = v.dataset.complet, fin = v.seekable.length ? v.seekable.end(v.seekable.length - 1) : 0;
      if (!plein || v.dataset.secours || !duree(v) || fin >= duree(v) - 1) return false;
      v.dataset.secours = 'original'; v.src = plein; v.load();
      return true;
    }
    function parcours() {
      return segments || [[0, duree(A), 0, Math.max(0, duree(B) - 0.02), 'Comparaison des deux vidéos']];
    }
    function segment() { return parcours()[segmentIndex]; }
    function total() { return parcours().reduce(function (d, s) { return d + s[1] - s[0]; }, 0); }
    function position() {
      var d = 0, liste = parcours();
      for (var i = 0; i < segmentIndex; i++) d += liste[i][1] - liste[i][0];
      return d + Math.max(0, Math.min(A.currentTime - segment()[0], segment()[1] - segment()[0]));
    }
    function fin() { return segmentIndex === parcours().length - 1 && (A.ended || A.currentTime >= segment()[1] - 0.06); }
    function mapping(t) {
      var s = segment(), vitesse = (s[3] - s[2]) / Math.max(0.001, s[1] - s[0]);
      return { temps: s[2] + Math.max(0, Math.min(t - s[0], s[1] - s[0])) * vitesse, vitesse: vitesse };
    }
    function cible(t) { return Math.max(0, Math.min(mapping(t).temps, duree(B) ? duree(B) - 0.02 : 0)); }
    function possible() { return !document.hidden && dansEcran !== false; }
    function pret(v) { return duree(v) > 0 && v.readyState >= 3 && !v.seeking; }
    function avance(v) {
      for (var i = 0; i < v.buffered.length; i++) {
        if (v.buffered.start(i) <= v.currentTime + 0.05 && v.buffered.end(i) >= v.currentTime) return v.buffered.end(i) - v.currentTime;
      }
      return 0;
    }
    function assez(v) {
      return pret(v) && (v.readyState >= 4 || avance(v) >= Math.min(1.5 * v.playbackRate, Math.max(0, duree(v) - v.currentTime - 0.04)));
    }
    function majVoiles() {
      [A, B].forEach(function (v, i) {
        var message = veutLire && possible() && !pret(v) ? 'Chargement…' : '';
        voiles[i].hidden = !message; voiles[i].querySelector('span').textContent = message;
      });
    }
    function setEtat(e, message) {
      etat = e; racine.dataset.etat = e;
      racine.dataset.comparaison = e === 'attente' || e === 'chargement' || e === 'demarrage' ? 'transition' : 'par-pieces';
      if (typeof message === 'string') statut.textContent = epure && !/ne se charge pas|interrompue|pour lancer les deux vidéos/.test(message) ? '' : message;
      var actif = e === 'lecture' || e === 'demarrage' || e === 'chargement' || e === 'attente';
      bouton.querySelector('svg').innerHTML = actif ? ICONE_PAUSE : ICONE_LECTURE;
      libelle.textContent = e === 'repos' ? 'Lancer les deux vidéos' : actif ? 'Mettre en pause' : e === 'fin' ? 'Revoir depuis le début' : 'Reprendre';
      majVoiles();
    }
    function majTemps() {
      var t = position(), d = total();
      if (!glisse && d) prog.value = Math.round(t / d * 1000);
      temps.textContent = fmt(t) + ' / ' + (d ? fmt(d) : '1:19');
      var piece = segment()[4];
      racine.dataset.piece = piece;
      if (pieceLabel && pieceLabel.textContent !== piece) pieceLabel.textContent = piece;
      var message = epure ? '' : piece + ' · lecture sans son.';
      if (etat === 'lecture' && statut.textContent !== message) statut.textContent = message;

    }
    function charger() {
      if (charge) return;
      charge = true;
      [A, B].forEach(function (v) {
        v.muted = true; v.defaultMuted = true; v.playsInline = true;
        v.preload = 'auto'; v.src = v.dataset.src; v.load();
      });
    }
    function aligner(t) {
      if (!duree(A) || !duree(B)) return;
      t = Math.max(0, Math.min(t, total() - 0.02));
      var liste = parcours(), i = 0;
      while (i < liste.length - 1 && t >= liste[i][1] - liste[i][0]) {
        t -= liste[i][1] - liste[i][0]; i++;
      }
      segmentIndex = i;
      var cibleA = Math.min(liste[i][0] + t, duree(A) - 0.02);
      if (Math.abs(A.currentTime - cibleA) > 0.04) A.currentTime = cibleA;
      var cibleB = cible(cibleA);
      if (Math.abs(B.currentTime - cibleB) > 0.04) B.currentTime = cibleB;
      A.playbackRate = 1; B.playbackRate = mapping(cibleA).vitesse;
    }
    function arreter(e, message) {
      generation++; clearTimeout(relance); cancelAnimationFrame(raf);
      racine.dataset.comparaison = e === 'attente' ? 'transition' : 'par-pieces';
      setEtat(e, message); /* avant pause(), pour ignorer les événements internes */
      A.pause(); B.pause();
    }
    function attendre(message) {
      arreter(charge && initialise ? 'attente' : 'chargement', message);
      relance = setTimeout(function () { if (veutLire && possible()) jouer(); }, 250);
    }
    function terminer() {
      veutLire = false;
      arreter('fin', 'Les deux visites sont terminées.');
      majTemps(); prog.value = 1000;
    }
    function jouer() {
      if (!veutLire || !possible() || etat === 'lecture' || etat === 'demarrage') return;
      charger();
      if (!duree(A) || !duree(B)) { attendre('Chargement des deux vidéos…'); return; }
      if (!initialise) { initialise = true; aligner(0); prog.disabled = false; }
      if (fin()) { terminer(); return; }
      if (Math.abs(B.currentTime - cible(A.currentTime)) > 0.05) aligner(position());
      B.playbackRate = mapping(A.currentTime).vitesse;
      if (!assez(A) || !assez(B)) { attendre('Les deux vidéos attendent d’être prêtes ensemble.'); return; }
      clearTimeout(relance); setEtat('demarrage', 'Démarrage des deux vidéos sans son…');
      var tour = ++generation;
      var promesses = [A, B].map(function (v) { v.muted = true; return v.play(); });
      Promise.all(promesses).then(function () {
        if (tour !== generation || !veutLire || !possible()) return;
        setEtat('lecture', 'Lecture des deux visites sans son.');
        raf = requestAnimationFrame(boucle);
      }).catch(function (err) {
        if (tour !== generation) return;
        veutLire = false; pauseHumaine = true;
        arreter('pause', err && err.name === 'NotAllowedError' ? 'Appuyez sur « Reprendre » pour lancer les deux vidéos.' : 'La lecture a été interrompue. Appuyez sur « Reprendre ».');
      });
    }
    function boucle() {
      if (etat !== 'lecture') return;
      if (!possible()) { suspendre(); return; }
      if (fin()) { terminer(); return; }
      /* Un repère change la vitesse sans couper le film si les deux temps se suivent.
         Seuls les détours réellement retirés demandent une pause et un seek commun. */
      while (segmentIndex < parcours().length - 1) {
        var suivant = parcours()[segmentIndex + 1];
        var continu = Math.abs(segment()[1] - suivant[0]) < 0.001 && Math.abs(segment()[3] - suivant[2]) < 0.001;
        if (A.currentTime < segment()[1] - (continu ? 0 : 0.025)) break;
        if (continu) { segmentIndex++; continue; }
        var prochain = 0;
        for (var i = 0; i <= segmentIndex; i++) prochain += parcours()[i][1] - parcours()[i][0];
        arreter('attente', 'Passage au prochain point de vue…');
        aligner(prochain); majTemps(); relance = setTimeout(jouer, 250); return;
      }
      if (!pret(A) || !pret(B)) { attendre('Une vidéo attend des données : les deux reprendront ensemble.'); return; }
      var repere = mapping(A.currentTime), ecart = B.currentTime - cible(A.currentTime);
      racine.dataset.ecart = ecart.toFixed(3);
      if (Math.abs(ecart) > 0.35) {
        corrections++; racine.dataset.corrections = String(corrections);
        arreter('attente', 'Recalage sur le prochain repère de la visite…');
        B.currentTime = cible(A.currentTime);
        relance = setTimeout(jouer, 250); return;
      }
      var correction = Math.abs(ecart) > 0.04 ? Math.max(0.92, Math.min(1.08, 1 - ecart * 0.25)) : 1;
      B.playbackRate = Math.max(profilReel ? 0.5 : 0.25, Math.min(profilReel ? 1.5 : 4, repere.vitesse * correction));
      racine.dataset.vitesse = B.playbackRate.toFixed(3);
      majTemps(); majVoiles(); raf = requestAnimationFrame(boucle);
    }
    function lancer(humain) {
      autoTente = true;
      if (humain) pauseHumaine = false;
      veutLire = true;
      if (etat === 'fin') { arreter('pause'); aligner(0); }
      jouer();
    }
    function pause() {
      pauseHumaine = true; veutLire = false;
      arreter('pause', 'Les deux vidéos sont en pause.');
    }
    function suspendre() {
      if (veutLire) arreter('pause', 'Lecture suspendue hors de l’écran.');
    }
    function contexteChange() {
      if (!possible()) { suspendre(); return; }
      if (veutLire && !pauseHumaine && !mouvementReduit.matches) jouer();
      else if (!autoTente && !pauseHumaine && !mouvementReduit.matches && dansEcran === true) {
        autoTente = true; lancer(false);
      }
    }
    [A, B].forEach(function (v) {
      v.muted = true; v.defaultMuted = true; v.playsInline = true;
      v.addEventListener('loadedmetadata', function () { if (secours(v)) return; majTemps(); if (veutLire) jouer(); });
      ['canplay', 'canplaythrough', 'loadeddata', 'seeked'].forEach(function (ev) {
        v.addEventListener(ev, function () { majVoiles(); if (veutLire && (etat === 'chargement' || etat === 'attente')) jouer(); });
      });
      v.addEventListener('waiting', function () {
        if (etat === 'lecture' || etat === 'demarrage') attendre('Une vidéo attend des données : les deux reprendront ensemble.');
      });
      v.addEventListener('ended', function () {
        if (fin()) terminer();
        else if (veutLire) attendre('Recalage de la fin des deux visites…');
      });
      v.addEventListener('error', function () {
        veutLire = false; pauseHumaine = true;
        arreter('pause', 'Une vidéo ne se charge pas. Vérifiez la connexion.');
      });
      v.addEventListener('pause', function () {
        if (etat === 'lecture' && veutLire && !v.seeking && !v.ended && v.readyState >= 3) pause();
      });
    });
    bouton.addEventListener('click', function () {
      if (etat === 'lecture' || etat === 'demarrage' || etat === 'chargement' || etat === 'attente') pause();
      else lancer(true);
    });
    debut.addEventListener('click', function () {
      if (!initialise) { majTemps(); return; }
      var reprend = veutLire;
      arreter('pause', 'Retour au début.'); aligner(0); majTemps();
      if (reprend) jouer();
    });
    prog.addEventListener('input', function () { glisse = true; temps.textContent = fmt(prog.value / 1000 * total()) + ' / ' + fmt(total()); });
    prog.addEventListener('change', function () {
      var t = prog.value / 1000 * total();
      glisse = false; arreter('pause', 'Position changée.'); aligner(t); majTemps();
      if (veutLire) jouer();
    });
    document.addEventListener('visibilitychange', contexteChange);
    function reductionChange() {
      if (mouvementReduit.matches && veutLire) { veutLire = false; arreter('pause', 'Lecture automatique suspendue : réduction des animations activée.'); }
      else contexteChange();
    }
    if (mouvementReduit.addEventListener) mouvementReduit.addEventListener('change', reductionChange);
    else mouvementReduit.addListener(reductionChange);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.intersectionRatio >= 0.2) dansEcran = true;
          else if (entry.intersectionRatio < 0.05) dansEcran = false;
          contexteChange();
        });
      }, { threshold: [0, 0.05, 0.2] }).observe(racine);
    }
    // V17 (rapidité) : les images d'attente (data-poster) ne sont demandées qu'à une hauteur d'écran du lecteur, pour
    // ne pas concurrencer la grande photo du haut au chargement ; tout de suite si IntersectionObserver manque.
    [A, B].forEach(function (v) {
      var image = v.getAttribute('data-poster');
      if (!image || v.getAttribute('poster')) return;
      function poser() { if (!v.getAttribute('poster')) v.setAttribute('poster', image); }
      if (!('IntersectionObserver' in window)) { poser(); return; }
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        poser();
      }, { rootMargin: '100% 0px' });
      io.observe(racine);
    });
    racine.dataset.profil = profilReel ? PROFIL.id : 'progression-proportionnelle';
    racine.dataset.corrections = '0';
    setEtat('repos', mouvementReduit.matches ? 'Appuyez sur le bouton pour lancer les deux vidéos sans son.' : 'Les vidéos démarrent sans son lorsqu’elles apparaissent à l’écran.');
    majTemps();
  }
  document.querySelectorAll('[data-duo-video]').forEach(Duo);
})();
