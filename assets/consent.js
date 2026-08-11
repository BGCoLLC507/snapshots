/* ============================================================
   Black Girl Co. — opt-in analytics consent (GA4)
   GA4 does NOT load and no event fires until the visitor accepts.
   Decline = nothing runs, and we remember the choice.
   Events: snapshot_started · snapshot_completed · cta_clicked
   ============================================================ */
(function () {
  var GA_ID   = 'G-ZXT5Y11FBX';
  var STORAGE = 'bgc-consent';          /* 'granted' | 'denied' */
  var queue   = [];                     /* events fired before a decision */
  var loaded  = false;

  /* Public: pages call window.bgcTrack('event', {..}) at any time.
     Before consent the call is buffered; on decline the buffer is dropped. */
  window.bgcTrack = function (name, params) {
    if (loaded && window.gtag) { window.gtag('event', name, params || {}); return; }
    if (getChoice() === 'denied') return;           /* never collected */
    queue.push([name, params || {}]);
  };

  function getChoice() {
    try { return localStorage.getItem(STORAGE); } catch (e) { return null; }
  }
  function setChoice(v) {
    try { localStorage.setItem(STORAGE, v); } catch (e) {}
  }

  function loadGA() {
    if (loaded) return;
    loaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };

    /* Deny-by-default consent state, then grant — analytics only, no ads. */
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });

    /* flush anything captured before the visitor accepted */
    queue.forEach(function (e) { window.gtag('event', e[0], e[1]); });
    queue = [];
  }

  function banner() {
    var el = document.createElement('div');
    el.className = 'consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Analytics consent');
    el.innerHTML =
      '<div class="inner">' +
        '<p>We use Google Analytics to understand how these snapshots are used — only if you agree. ' +
        'Nothing is collected unless you accept. See the <a href="privacy.html">privacy policy</a>.</p>' +
        '<div class="btns">' +
          '<button type="button" class="decline" id="bgcDecline">Decline</button>' +
          '<button type="button" class="accept"  id="bgcAccept">Accept analytics</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    el.classList.add('show');   /* set directly — rAF is paused in background tabs */

    document.getElementById('bgcAccept').addEventListener('click', function () {
      setChoice('granted'); el.remove(); loadGA();
    });
    document.getElementById('bgcDecline').addEventListener('click', function () {
      setChoice('denied'); queue = []; el.remove();
    });
  }

  function start() {
    var choice = getChoice();
    if (choice === 'granted') { loadGA(); return; }   /* returning visitor */
    if (choice === 'denied')  { return; }             /* respect the no */
    banner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else { start(); }
})();
