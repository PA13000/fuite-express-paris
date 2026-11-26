/* A.T.C. BAT : formulaire de contact.
   Vérifie les champs dans la page (mêmes règles que /envoi.php), puis laisse partir le formulaire vers
   /envoi.php, qui envoie la demande par mail à A.T.C. BAT et ouvre la page /merci/.
   Sans JavaScript, le formulaire part tel quel et /envoi.php vérifie les champs de son côté. */
(function () {
  'use strict';
  // Adresse mail : même règle que /envoi.php (FILTER_VALIDATE_EMAIL de PHP) pour les adresses courantes. Lettres sans
  // accent, 64 caractères au plus avant @, 160 au total (longueur gardée par /envoi.php), extension qui commence par une
  // lettre. Sinon la page laisserait partir une adresse que le serveur refuse, et le client devrait tout retaper.
  var MAIL = /^(?=.{1,160}$)(?=[^@]{1,64}@)[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?!.*[^.]{64})(?:[a-z0-9]+(?:-+[a-z0-9]+)*\.)+[a-z][a-z0-9]*(?:-+[a-z0-9]+)*$/i;
  document.querySelectorAll('form.formulaire').forEach(function (f) {
    var bouton = f.querySelector('button[type="submit"]');
    var libelle = bouton ? bouton.textContent : '';
    var enCours = false;
    function rendre() {
      enCours = false;
      if (bouton) { bouton.disabled = false; bouton.textContent = libelle; }
    }
    // Retour arrière depuis la page /merci/ : le bouton redevient utilisable.
    window.addEventListener('pageshow', rendre);
    f.addEventListener('submit', function (e) {
      if (enCours) { e.preventDefault(); return; }
      var ok = true, premier = null;
      function signaler(champ, zone, msg) {
        if (zone) zone.textContent = msg || '';
        if (champ) champ.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg) { ok = false; if (!premier) premier = champ; }
      }
      var cases = f.querySelectorAll('fieldset input[type="checkbox"]');
      signaler(cases[0], f.querySelector('[data-erreur="statut"]'), Array.prototype.some.call(cases, function (c) { return c.checked; }) ? '' : 'Cochez au moins une case.');
      f.querySelectorAll('[data-requis]').forEach(function (c) {
        var v = (c.value || '').trim(), msg = '';
        if (!v) msg = 'Ce champ est obligatoire.';
        else if (c.dataset.motif && !new RegExp('^(?:' + c.dataset.motif + ')$').test(v)) msg = c.title || 'Format incorrect.';
        else if (c.type === 'tel' && !/^(?:0[1-9][0-9]{8}|(?:\+|00)330?[1-9][0-9]{8}|(?:\+|00)(?!33)[1-9][0-9]{6,14})$/.test(v.replace(/[\s.\-()]/g, ''))) msg = 'Indiquez un numéro à 10 chiffres, ou au format international (+33…).';
        else if (c.type === 'email' && !MAIL.test(v)) msg = 'Adresse mail incorrecte.';
        signaler(c, f.querySelector('[data-erreur="' + c.name + '"]'), msg);
      });
      if (!ok) { e.preventDefault(); if (premier) premier.focus(); return; }
      enCours = true;
      if (bouton) { bouton.disabled = true; bouton.textContent = 'Envoi en cours…'; }
    });
  });
})();
