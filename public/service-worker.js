const CACHE_NAME = "uploader-v3";
const OFFLINE_URL = "/offline";

const PRECACHE_RESOURCES = [
    "/",
    OFFLINE_URL,
    "/favicon.ico"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_RESOURCES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log("Deleting out of date cache:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.mode === "navigate" || (event.request.method === "GET" && event.request.headers.get("accept").includes("text/html"))) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(OFFLINE_URL);
            })
        );
    } else {
        if (event.request.url.startsWith(self.location.origin)) {
            event.respondWith(
                caches.match(event.request)
                    .then(response => {
                        return response || fetch(event.request).then(fetchResponse => {
                            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== "basic") {
                                return fetchResponse;
                            }
    
                            const responseToCache = fetchResponse.clone();
    
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
    
                            return fetchResponse;
                        });
                    })
                    .catch(() => {
                        if (event.request.mode === "navigate") {
                            return caches.match(OFFLINE_URL);
                        }
                    })
            );
        }
    }
});

self.addEventListener("message", event => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});