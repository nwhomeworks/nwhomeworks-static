/* Google Preferred Sources — custom buttons, popup flow.
   Loads Google's publisher.js in manual mode and binds every
   .nwh-preferred-source-btn to the in-page popup. If the library
   hasn't loaded (blocked, offline), the buttons fall back to their
   href: the Google source-preferences page in a new tab. */
(function () {
  var ps = null;

  var s = document.createElement('script');
  s.async = true;
  s.setAttribute('preferred-sources-control', 'manual');
  s.src = 'https://news.google.com/swg/js/v1/publisher.js';
  document.head.appendChild(s);

  (self.PREFERRED_SOURCE = self.PREFERRED_SOURCE || []).push(function (preferredSource) {
    try {
      preferredSource.init({ theme: 'light', lang: 'en' });
      ps = preferredSource;
    } catch (e) { /* fall back to deeplink */ }
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.nwh-preferred-source-btn');
    if (!btn || !ps) return; /* no library yet: let the link open normally */
    e.preventDefault();
    try {
      ps.addPreferredSource();
    } catch (err) {
      window.open(btn.href, '_blank', 'noopener');
    }
  });
})();
