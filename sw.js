// TPAC 班表系統 — Service Worker V22.7.2
// 修正：GitHub Pages 子路徑 /team-schedule-viewer/ 部署

const CACHE_NAME = 'tpac-v22';
const BASE = '/team-schedule-viewer/';

self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                BASE,
                BASE + 'index.html',
                BASE + 'manifest.json'
            ]).catch(err => {
                console.warn('[SW] Cache addAll partial fail:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    const isExternal = (
        url.hostname !== self.location.hostname ||
        url.hostname.includes('firebasejs') ||
        url.hostname.includes('firestore') ||
        url.hostname.includes('googleapis') ||
        url.hostname.includes('unpkg.com') ||
        url.hostname.includes('cdn.tailwindcss') ||
        url.hostname.includes('fonts.gstatic') ||
        url.hostname.includes('fonts.googleapis')
    );

    if (isExternal) {
        event.respondWith(fetch(request));
        return;
    }

    event.respondWith(
        fetch(request)
            .then(response => {
                if (response && response.status === 200) {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
                }
                return response;
            })
            .catch(() => {
                return caches.match(request).then(cached => {
                    if (cached) return cached;
                    // fallback：回傳 index.html
                    return caches.match(BASE + 'index.html');
                });
            })
    );
});
