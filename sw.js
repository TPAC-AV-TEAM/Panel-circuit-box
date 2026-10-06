// AV 迴路盒查詢 — Service Worker V13
// 路徑改由 registration.scope 取得，換 Repo 名稱 / 自訂網域 / localhost 都能運作
const CACHE_NAME = 'av-panel-v13';
const BASE = self.registration.scope;               // 結尾已含 "/"
const PRECACHE = ['', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            // 逐一快取：任何一個檔案不存在，不會讓其他檔案一起失敗
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
    if (new URL(event.request.url).origin !== self.location.origin) return;   // 外部資源（字型）交給瀏覽器

    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200) {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request, { ignoreSearch: true })
                    .then(cached => cached || caches.match(BASE + 'index.html'))
            )
    );
});
