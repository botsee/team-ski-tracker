const CACHE_NAME = "team-ski-tracker-v2";

const APP_SHELL = [
  "/team-ski-tracker/",
  "/team-ski-tracker/manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(res => res || caches.match("/team-ski-tracker/"))
    )
  );
});
