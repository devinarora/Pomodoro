const CACHE_NAME = 'pomodoro-static-v1';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './pixel-visual.js',
    './manifest.json',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => {
                    return caches.match('./index.html');
                })
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME)
            .then((cache) =>
                cache.match(request)
                    .then((cached) => {
                        const network = fetch(request)
                            .then((response) => {
                                if (response && response.status === 200) {
                                    cache.put(request, response.clone());
                                }
                                return response;
                            })
                            .catch(() => cached);
                        return cached || network;
                    })
            )
    );
});