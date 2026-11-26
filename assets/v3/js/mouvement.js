/* Mouvement lié au parcours, sans détourner le défilement natif. */
(function () {
  'use strict';
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var racine = document.documentElement;
  if (!preference.matches && 'IntersectionObserver' in window) racine.classList.add('js-mouvement');
  function afficherTout() { document.querySelectorAll('[data-apparition],[data-revele]').forEach(function (e) { e.classList.add('visible'); }); }
  document.addEventListener('DOMContentLoaded', function () {
    if (racine.classList.contains('js-mouvement')) {
      var observer = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });
      document.querySelectorAll('[data-apparition],[data-revele]').forEach(function (e) { observer.observe(e); });
    }
    var photos = Array.from(document.querySelectorAll('[data-scroll-photo]'));
    photos.forEach(function (e) { e.classList.add('photo-parallaxe'); });
    var etapes = Array.from(document.querySelectorAll('.parcours__etape'));
    var hero = document.querySelector('.heros'), raccourci = document.querySelector('.contact-mobile'), actions = document.querySelectorAll('.heros__actions, .v14-bandeau__actions, .heros__comparateur');
    var pending = false;
    function cadre() {
      pending = false;
      var hauteur = window.innerHeight, total = Math.max(1,racine.scrollHeight-hauteur);
      racine.style.setProperty('--progression-page',Math.min(1,Math.max(0,window.scrollY/total)).toFixed(4));
      if (raccourci && actions.length) { var b = raccourci.getBoundingClientRect(); if (b.width) raccourci.classList.toggle('contact-mobile--retire', Array.prototype.some.call(actions,function (e) { var a = e.getBoundingClientRect(); return a.width && a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right; })); }
      if (preference.matches) return;
      if (hero) hero.style.setProperty('--decalage-decor',Math.min(window.scrollY,hauteur)+'px');
      photos.forEach(function (image) {
        var r = image.parentElement.getBoundingClientRect(); if (r.bottom < -100 || r.top > hauteur+100) return;
        var avance = (hauteur*.5-(r.top+r.height*.5))/(hauteur+r.height);
        var marge = Math.min(24,Math.max(0,r.height*.055-1));
        image.style.setProperty('--decalage-photo',Math.max(-marge,Math.min(marge,avance*52)).toFixed(2)+'px');
      });
      etapes.forEach(function (e,i) { var r = e.getBoundingClientRect(); var p = Math.max(0,Math.min(1,(hauteur*.85-r.top)/Math.max(150,r.height*.6)-(window.innerWidth>700?i*.15:0))); e.style.setProperty('--progression-etape',p.toFixed(3)); });
    }
    function programmer() { if (!pending) { pending = true; requestAnimationFrame(cadre); } }
    window.addEventListener('scroll',programmer,{passive:true}); window.addEventListener('resize',programmer,{passive:true}); document.addEventListener('click',function () { programmer(); setTimeout(programmer,450); }); document.addEventListener('transitionend',programmer); document.addEventListener('animationend',programmer); window.addEventListener('load',programmer); setTimeout(programmer,1500); if (document.fonts) document.fonts.ready.then(programmer);
    preference.addEventListener('change',function (e) { if (e.matches) { afficherTout();racine.classList.remove('js-mouvement');photos.forEach(function (p) { p.style.removeProperty('--decalage-photo'); }); } programmer(); });
    if (location.hash) { var cible = document.getElementById(location.hash.slice(1));if(cible) cible.querySelectorAll('[data-apparition],[data-revele]').forEach(function(e){e.classList.add('visible');}); }
    cadre();
  });
  window.addEventListener('beforeprint',afficherTout);
})();
