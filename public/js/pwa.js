/* Registers the service worker and wires up an optional "Install app" button.
   Kept in its own file because the site's CSP blocks inline <script>. */
(function () {
  // Register the service worker (installability + offline shell).
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function (err) {
        console.warn("Service worker registration failed:", err);
      });
    });
  }

  // Custom install flow: capture the browser prompt and show our own button
  // (any element with id="installApp"), if the page has one.
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    var btn = document.getElementById("installApp");
    if (btn) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        btn.hidden = true;
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
      });
    }
  });

  window.addEventListener("appinstalled", function () {
    var btn = document.getElementById("installApp");
    if (btn) btn.hidden = true;
    deferredPrompt = null;
  });
})();
