const CACHE_NAME = "uploader-v5";
const PRECACHE_RESOURCES = [
    "/",
    "/offline",
    "/ChenComfy.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(CACHE_NAME);
            await cache.addAll(PRECACHE_RESOURCES);
            self.skipWaiting();
        })()
    );
});

self.addEventListener("activate", async event => {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
                console.log("Deleting out of date cache:", cacheName);
                return caches.delete(cacheName);
            }
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.method === "POST" && event.request.url.includes("/api/upload")) {
        return;
    }
    if (event.request.method === "POST" || event.request.method === "PUT" || event.request.method === "DELETE") {
        return;
    }

    if (event.request.mode === "navigate" || (event.request.method === "GET" && event.request.headers.get("accept").includes("text/html"))) {
        event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
    } else {
        if (event.request.url.startsWith(self.location.origin)) {
            event.respondWith(
                caches.match(event.request).then(response => {
                    return response || fetch(event.request).then(fetchResponse => {
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== "basic") {
                            return fetchResponse;
                        }

                        const responseToCache = fetchResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                        return fetchResponse;
                    });
                }).catch(() => {
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