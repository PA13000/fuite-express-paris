/* ATC V10 — propriétaire des arrivées de sections et du parcours photo.
   Remplace v5/motion.js sur l'accueil. Doit précéder le moteur des comparateurs.
   Aucun contenu n'est caché avant le chargement de ce script. */
(function () {
  'use strict';
  function init() {
    var body = document.body;
    if (!body || !body.classList.contains('accueil-v10') || body.dataset.v10Sections) return;
    body.dataset.v10Sections = 'ready';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    var desktop = window.matchMedia('(min-width:980px) and (min-height:680px)');
    var mobile = window.matchMedia('(max-width:759px)');
    var motion = new Map();
    var printing = false;
    var regions = Array.from(body.querySelectorAll('main > .section:not(.rubriques)'));
    var clamp = function (n, min, max) { return Math.max(min, Math.min(max, n)); };

    // V3 conserve progression et raccourci de contact. Ses marqueurs de mouvement
    // sont retirés dans notre périmètre avant son scan DOMContentLoaded.
    regions.forEach(function (region) {
      region.querySelectorAll('[data-apparition],[data-revele],[data-scroll-photo]').forEach(function (el) {
        el.removeAttribute('data-apparition');
        el.removeAttribute('data-revele');
        el.removeAttribute('data-scroll-photo');
        el.classList.remove('photo-parallaxe');
        el.style.removeProperty('--decalage-photo');
      });
    });

    var story = body.querySelector('.parcours');
    var steps = story ? Array.from(story.querySelectorAll('.parcours__etape')) : [];
    var scene = null, slides = [], centers = [], dirty = true;
    var frame = 0, visible = false, position = null, lastTime = 0, active = -1;

    // Construire les copies avant les contrôles mobiles : aucun contrôle dupliqué.
    if (story && steps.length > 1 && !story.querySelector('.v5-scene') && steps.every(function (step) {
      var source = step.querySelector('[data-v5-story-media]') || step.querySelector('.photo');
      return source && source.querySelector('img') && !source.querySelector('a,button,input,video');
    })) {
      scene = document.createElement('div');
      scene.className = 'v5-scene v10-scene';
      scene.setAttribute('aria-hidden', 'true');
      steps.forEach(function (step, index) {
        var source = step.querySelector('[data-v5-story-media]') || step.querySelector('.photo');
        var copy = source.cloneNode(true);
        var pair = source.hasAttribute('data-v5-story-media');
        copy.className = 'v5-scene__photo' + (pair ? ' v5-scene__photo--pair' : ' photo');
        copy.removeAttribute('data-v5-story-media');
        copy.removeAttribute('id');
        copy.querySelectorAll('[id]').forEach(function (node) { node.removeAttribute('id'); });
        copy.querySelectorAll('img').forEach(function (img) { img.alt = ''; img.removeAttribute('fetchpriority'); });
        copy.style.opacity = index ? '0' : '1';
        copy.style.visibility = index ? 'hidden' : 'visible';
        copy.style.zIndex = String(index + 1);
        scene.appendChild(copy);
        slides.push(copy);
      });
      var envelope = story.querySelector('.enveloppe');
      if (envelope) {
        envelope.appendChild(scene);
        story.classList.add('is-v5-story');
      } else { scene = null; slides = []; }
    }

    // Les classes V6 sont l'interface partagée avec animations.js. Ce fichier
    // crée les contrôles, mais ne pilote ni leur lecture ni leur pause.
    // V16 : trait et poignée dans un curseur pleine largeur déplacé par transform (aucun décalage de mise en page).
    steps.forEach(function (step) {
      var group = step.querySelector('[data-v5-story-media]');
      if (!group || group.querySelector('[data-v6-compare]') || group.querySelectorAll(':scope > .photo').length !== 2) return;
      group.classList.add('v6-comparaison-mobile');
      var controls = document.createElement('div');
      controls.className = 'v6-comparaison-controls';
      controls.innerHTML = '<span class="v6-comparaison-curseur" aria-hidden="true"><span class="v6-comparaison-trait"></span><span class="v6-comparaison-poignee"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m8 8-4 4 4 4m8-8 4 4-4 4M4 12h16"/></svg></span></span><span class="v6-comparaison-etiquette" aria-hidden="true">Avant</span><span class="v6-comparaison-etiquette v6-comparaison-etiquette--apres" aria-hidden="true">Après</span>';
      var input = document.createElement('input');
      input.type = 'range'; input.min = '0'; input.max = '100'; input.value = '50';
      input.setAttribute('data-v6-compare', '');
      var heading = step.querySelector('h3');
      input.setAttribute('aria-label', 'Comparer avant et après : ' + (heading ? heading.textContent.trim() : 'les travaux'));
      input.addEventListener('input', function () { group.style.setProperty('--v6-pos', input.value + '%'); });
      controls.appendChild(input);
      group.appendChild(controls);
      var host = document.createElement('div');
      host.className = 'v6-comparaison-aide';
      host.setAttribute('role', 'group');
      host.setAttribute('aria-label', 'Lecture de la comparaison');
      group.insertAdjacentElement('afterend', host);
    });

    function stopReveals() {
      motion.forEach(function (animation) { animation.cancel(); });
      motion.clear();
    }
    function reveal(el, kind, delay) {
      if (reduce.matches || printing || document.hidden || !el.animate) return;
      var frames = kind === 'photo' ? [
        { clipPath: 'inset(0 0 8% 0 round 16px)', opacity: .8 },
        { clipPath: 'inset(0 round 16px)', opacity: 1 }
      ] : kind === 'fade' ? [{ opacity: .65 }, { opacity: 1 }] : [
        { opacity: .55, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ];
      var animation = el.animate(frames, {
        duration: kind === 'photo' ? 620 : kind === 'fade' ? 400 : 480,
        delay: mobile.matches ? 0 : delay,
        easing: 'cubic-bezier(.22,.68,0,1)', fill: 'backwards'
      });
      motion.set(el, animation);
      animation.onfinish = animation.oncancel = function () { motion.delete(el); };
    }

    if ('IntersectionObserver' in window) {
      var kinds = new Map();
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          var config = kinds.get(entry.target);
          reveal(entry.target, config.kind, config.delay);
        });
      }, { threshold: .12, rootMargin: '0px 0px -24px 0px' });
      function track(selector, kind, stagger) {
        body.querySelectorAll(selector).forEach(function (el, index) {
          // Jamais de parent animé et enfant animé dans la même liste.
          kinds.set(el, { kind: kind, delay: stagger ? (index % 3) * 65 : 0 });
          el.dataset.v10Motion = kind;
          observer.observe(el);
        });
      }
      track('.famille, .billet', 'card', true);
      track('.service__photos, .service-carte > .photo, .syndics > .photo', 'photo', false);
      track('.societe__photos, .clients__texte', 'fade', false);
      // Les comparateurs et les vidéos ont leur propre mouvement ; leurs
      // cadres et leurs textes ne reçoivent pas une deuxième animation.
    }

    function enabled() { return scene && desktop.matches && !reduce.matches && !printing; }
    function schedule() {
      if (!frame && enabled() && visible && !document.hidden) frame = requestAnimationFrame(render);
    }
    function render(time) {
      frame = 0;
      if (!enabled() || !visible || document.hidden) { lastTime = 0; return; }
      if (dirty) {
        centers = steps.map(function (step) {
          var rect = step.getBoundingClientRect();
          return window.scrollY + rect.top + rect.height / 2;
        });
        dirty = false;
      }
      var line = window.scrollY + window.innerHeight * .55;
      var target = 0;
      for (var i = 0; i < centers.length - 1; i++) {
        if (line >= centers[i]) target = i + clamp((line - centers[i]) / Math.max(1, centers[i + 1] - centers[i]), 0, 1);
      }
      if (line >= centers[centers.length - 1]) target = centers.length - 1;
      var snap = position === null;
      if (snap) position = target;
      var delta = lastTime ? clamp(time - lastTime, 1, 64) : 16.7;
      lastTime = time;
      position += (target - position) * (1 - Math.exp(-delta / 90));
      var moving = Math.abs(target - position) > .001;
      if (!moving) position = target;
      var index = Math.min(steps.length - 1, Math.round(position));
      if (index !== active) {
        steps.forEach(function (step, n) { step.classList.toggle('is-v5-active', n === index); });
        active = index;
      }
      // Mouvement : la photo suivante arrive du coin bas droit,
      // grandit et prend la scène ; la précédente reste dessous, légèrement en recul.
      slides.forEach(function (slide, n) {
        var distance = n - position;
        var entrance = clamp(1 - distance, 0, 1);
        entrance = entrance * entrance * (3 - 2 * entrance);
        var scale = .72 + .28 * entrance, x = (1 - entrance) * 20, y = (1 - entrance) * 104;
        if (distance < 0) { scale = 1 - clamp(-distance, 0, 1) * .045; x = clamp(-distance, 0, 1) * -3; y = 0; }
        slide.style.opacity = '1';
        slide.style.transform = 'translate(' + x.toFixed(3) + '%,' + y.toFixed(3) + '%) scale(' + scale.toFixed(4) + ')';
        slide.style.visibility = distance > 1.15 || distance < -1.15 ? 'hidden' : 'visible';
      });
      if (moving) schedule(); else lastTime = 0;
    }
    function reset() {
      dirty = true; position = null; lastTime = 0;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      stopReveals();
      schedule();
    }
    if (scene && 'IntersectionObserver' in window) {
      var storyObserver = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (!visible) { if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
        else schedule();
      }, { threshold: 0 });
      storyObserver.observe(story);
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', reset, { passive: true });
      if ('ResizeObserver' in window) {
        new ResizeObserver(function () { dirty = true; schedule(); }).observe(body.querySelector('main'));
      }
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { dirty = true; schedule(); });
    } else if (story && scene) {
      story.classList.remove('is-v5-story');
      scene.remove();
      scene = null;
    }
    reduce.addEventListener('change', reset);
    desktop.addEventListener('change', reset);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stopReveals(); if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
      else { dirty = true; schedule(); }
    });
    window.addEventListener('beforeprint', function () { printing = true; reset(); });
    window.addEventListener('afterprint', function () { printing = false; reset(); });
    body.dispatchEvent(new CustomEvent('atc:sections-ready'));
  }
  // Un script defer s'exécute après la construction du body, avant DOMContentLoaded.
  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init, { once: true });
})();
