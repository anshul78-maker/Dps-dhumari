/* Dhumari Public School ERP — service worker
   Makes the app installable and usable offline for the static shell.
   Strategy:
   - API calls (/api/*): network-first (always try fresh data, fall back to cache).
   - Everything else (HTML/CSS/JS/img): cache-first, updated in the background.
*/
const CACHE = "dps-erp-v1";
const SHELL = [
  "/login.html",
  "/index.html",
  "/css/styles.css",
  "/js/api.js",
  "/js/login.js",
  "/js/app.js",
  "/js/notices.js",
  "/js/student.js",
  "/js/teacher.js",
  "/js/accountant.js",
  "/js/pwa.js",
  "/img/logo.jpg",
  "/img/icon-192.png",
  "/img/icon-512.png",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API: network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Static shell: cache-first with background refresh
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
