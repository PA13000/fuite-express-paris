/* ATC V11 : propriétaire de l'avant/après déroulé au défilement, des tracés
   décoratifs et de l'arrivée des grands titres. Aucun clic n'est nécessaire :
   la position dans la page pilote tout. */
(function () {
  'use strict';
  var body = document.body;
  if (!body || !body.classList.contains('accueil-v10')) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  var smooth = function (p) { return p * p * (3 - 2 * p); };

  /* ---- Avant/après : rien n'est bloqué. Les paires se suivent l'une sous
     l'autre ; pendant que chaque photo traverse l'écran, elle grandit et son
     volet passe de l'avant à l'après. La liste suit la paire à l'écran et les
     deux grands mots glissent en sens contraires. ---- */
  var reel = body.querySelector('[data-v11-reel]');
  var gauge = reel ? reel.querySelector('.v11-reel__jauge') : null;
  var words = reel ? Array.from(reel.querySelectorAll('.v11-reel__mots span')) : [];
  var items = reel ? Array.from(reel.querySelectorAll('.v11-reel__liste li')) : [];
  var frame = 0, active = -1;
  var pairs = reel ? Array.from(reel.querySelectorAll('.v11-reel__cadre')).map(function (box) {
    var figure = box.querySelector('.v11-paire');
    if (!figure) return null;
    // Poignée sur le trait : elle montre le mouvement du volet.
    var knob = document.createElement('span');
    knob.className = 'v11-paire__poignee'; knob.setAttribute('aria-hidden', 'true');
    knob.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6-6 6 6 6M15 6l6 6-6 6"/></svg>';
    // V16 : trait et poignée dans un curseur pleine largeur, déplacé par transform (aucun décalage de mise en page).
    var cursor = document.createElement('span'), line = figure.querySelector('.v11-paire__trait');
    cursor.className = 'v11-paire__curseur'; cursor.setAttribute('aria-hidden', 'true');
    figure.insertBefore(cursor, line || null);
    if (line) cursor.appendChild(line);
    cursor.appendChild(knob);
    return { box: box, figure: figure, knob: knob, manual: null, pos: 100 };
  }).filter(Boolean) : [];
  function setPos(pair, pos) {
    pair.pos = pos;
    pair.figure.style.setProperty('--pos', pos.toFixed(2) + '%');
    pair.figure.style.setProperty('--avant-o', pos > 55 ? 1 : 0);
    pair.figure.style.setProperty('--apres-o', pos < 45 ? 1 : 0);
    pair.knob.style.opacity = pos < 2 || pos > 98 ? '0' : '1';
  }
  function paintReel() {
    frame = 0;
    if (!pairs.length) return;
    var vh = window.innerHeight, best = 0, gap = Infinity;
    pairs.forEach(function (pair, i) {
      var r = pair.box.getBoundingClientRect();
      var centre = r.top + r.height / 2;
      if (Math.abs(centre - vh / 2) < gap) { gap = Math.abs(centre - vh / 2); best = i; }
      if (reduce.matches) { setPos(pair, 50); pair.box.style.transform = 'none'; return; }
      if (r.bottom < -vh * .5 || r.top > vh * 1.5) { pair.manual = null; if (pair.pos !== (r.top > 0 ? 100 : 0)) setPos(pair, r.top > 0 ? 100 : 0); return; }
      // Arrivée courte : la photo monte et grandit pendant qu'elle entre.
      var grow = smooth(clamp((vh - r.top) / (vh * .35), 0, 1));
      pair.box.style.transform = 'translateY(' + ((1 - grow) * 30).toFixed(1) + 'px) scale(' + (.92 + .08 * grow).toFixed(4) + ')';
      // Volet piloté par le centre de la photo : 90 % de l'écran -> avant, 50 % -> après.
      var w = smooth(clamp((vh * .9 - centre) / (vh * .4), 0, 1));
      setPos(pair, pair.manual === null ? 100 * (1 - w) : pair.manual);
    });
    if (best !== active) {
      active = best;
      items.forEach(function (li, i) { li.classList.toggle('is-actif', i === active); });
    }
    if (gauge) gauge.style.setProperty('--avance', ((active + 1 - pairs[active].pos / 100) / pairs.length).toFixed(4));
    var rr = reel.getBoundingClientRect();
    var p = clamp((vh - rr.top) / (vh + rr.height), 0, 1);
    if (words[0]) words[0].style.transform = 'translateX(' + (-p * 22).toFixed(2) + '%)';
    if (words[1]) words[1].style.transform = 'translateX(' + ((1 - p) * 22).toFixed(2) + '%)';
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(paintReel); }
  if (pairs.length) {
    // Glissement au doigt ou à la souris : reprend la main jusqu'à la sortie de l'écran.
    pairs.forEach(function (pair) {
      var figure = pair.figure, drag = null;
      figure.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false }; });
      figure.addEventListener('pointermove', function (e) {
        if (!drag || drag.id !== e.pointerId) return;
        var dx = Math.abs(e.clientX - drag.x), dy = Math.abs(e.clientY - drag.y);
        if (!drag.on && dx > 10 && dx > dy * 1.4) { drag.on = true; try { figure.setPointerCapture(e.pointerId); } catch (_) {} }
        if (drag.on) { var b = figure.getBoundingClientRect(); pair.manual = clamp((e.clientX - b.left) / b.width * 100, 0, 100); setPos(pair, pair.manual); }
      });
      ['pointerup', 'pointercancel'].forEach(function (type) { figure.addEventListener(type, function () { drag = null; }); });
      figure.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    reduce.addEventListener('change', schedule);
    paintReel();
  }

  /* ---- Tracés dessinés à l'arrivée dans l'écran ---- */
  var decos = Array.from(body.querySelectorAll('.v11-deco'));
  function draw(svg) {
    var paths = svg.querySelectorAll('.v11-trace');
    if (reduce.matches || !svg.animate) { svg.classList.add('is-dessine'); return; }
    paths.forEach(function (path, i) {
      path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1400, delay: 120 + i * 260, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    });
    setTimeout(function () { svg.classList.add('is-dessine'); }, 260 * paths.length + 1500);
  }
  /* ---- Grands titres : montée sous un masque, une fois. ---- */
  var titles = Array.from(body.querySelectorAll('main > .section h2'));
  function rise(el) {
    if (reduce.matches || !el.animate) return;
    el.animate([{ clipPath: 'inset(0 0 100% 0)', transform: 'translateY(38px)', opacity: .2 },
                { clipPath: 'inset(0 0 -20% 0)', transform: 'translateY(0)', opacity: 1 }],
               { duration: 900, easing: 'cubic-bezier(.2,.7,0,1)', fill: 'backwards' });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        if (e.target.classList.contains('v11-deco')) draw(e.target); else rise(e.target);
      });
    }, { threshold: .35, rootMargin: '0px 0px -40px 0px' });
    decos.concat(titles).forEach(function (el) { io.observe(el); });
  } else {
    decos.forEach(function (svg) { svg.classList.add('is-dessine'); });
  }
})();
