const CACHE_NAME = 'av-panel-v14';
const BASE = self.registration.scope;
const PRECACHE = ['', 'index.html', 'style.css', 'tests.js', 'db.js', 'app.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled(PRECACHE.map(p => cache.add(BASE + p)))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    if (new URL(event.request.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200) {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
                }
                return response;
            })
            .catch(() => caches.match(event.request, { ignoreSearch: true }))
            .then(cached => {
                // 如果快取有資料就回傳，否則判斷是否為導航請求(切換頁面)，才回退 index.html
                if (cached) return cached;
                if (event.request.mode === 'navigate') {
                    return caches.match(BASE + 'index.html');
                }
                return Response.error();
            })
    );
});