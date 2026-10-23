// Offline-first service worker. Bump VERSION whenever the ASSETS list changes.
const VERSION = "v6";
const CACHE = "99names-" + VERSION;
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/names.js",
  "js/app.js",
  "icons/favicon-48.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "fonts/amiri-arabic-400-normal.woff2",
  "fonts/amiri-arabic-700-normal.woff2",
  "fonts/scheherazade-new-arabic-400-normal.woff2",
  "fonts/noto-naskh-arabic-arabic-400-normal.woff2",
  "fonts/lateef-arabic-400-normal.woff2",
  "fonts/reem-kufi-arabic-400-normal.woff2",
  "fonts/aref-ruqaa-arabic-400-normal.woff2",
  "fonts/inter-latin-400-normal.woff2",
  "fonts/inter-latin-600-normal.woff2",
  "fonts/lora-latin-400-normal.woff2",
  "fonts/lora-latin-600-normal.woff2"
];

// Cache each file on its own so one failed download cannot stop the app working offline.
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((url) => c.add(new Request(url, { cache: "reload" })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: answer from the cache at once (works offline) and refresh the
// cached copy in the background, so the next launch picks up any update.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === "navigate" ? "index.html" : req;

  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(key, { ignoreSearch: true }).then((hit) => {
        const fresh = fetch(req).then((res) => {
          // A redirected response cannot be replayed for a page load, so never cache one.
          if (res.ok && !res.redirected) cache.put(key, res.clone());
          return res;
        });
        if (hit) {
          e.waitUntil(fresh.catch(() => {}));
          return hit;
        }
        return fresh.catch(() => cache.match("index.html"));
      })
    )
  );
});
