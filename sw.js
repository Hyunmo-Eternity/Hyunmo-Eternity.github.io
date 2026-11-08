// 현모 팬가든 앱: 항상 최신 사이트를 먼저 불러오고, 인터넷이 끊겼을 때만 저장해 둔 화면을 보여줘요
const CACHE = "hyunmo-v1";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html", "./icon-192.png"])).catch(() => {})); });
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin || r.headers.has("range")) return;
  if (/\.mp3(\?|$)/.test(r.url)) return; // 노래는 브라우저가 직접 받아요
  e.respondWith(fetch(r).then(res => {
    if (res.ok && r.mode === "navigate") { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || (r.mode === "navigate" ? caches.match("./index.html") : Response.error()))));
});
