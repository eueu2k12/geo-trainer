// Service Worker: legt die App im Gerät ab, damit sie auch ohne Internet startet.
// Bei jedem Start mit Internet wird im Hintergrund die neueste Version geholt.
// WICHTIG: Bei jedem Update den Namen V hochzählen (v1 -> v2 ...), damit alte Dateien ersetzt werden.
const V = "geografie-v1";
const FILES = ["./", "./index.html", "./app.js", "./content.js", "./maps.js", "./manifest.webmanifest",
               "./icon.svg", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(V)
      .then(c => c.addAll(FILES.map(u => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.open(V).then(async c => {
      const hit = await c.match(e.request, { ignoreSearch: true });
      const net = fetch(e.request.url, { cache: "no-cache" })
        .then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; })
        .catch(() => null);
      return hit || (await net) || c.match("./index.html");
    })
  );
});
