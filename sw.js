const C = "dh-shop-v5";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(C).then(cache =>
      cache.addAll([
        "./",
        "./index.html",
        "./style.css?v=2",
        "./app.js?v=5",
        "./manifest.json"
      ])
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== C)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});
