const CACHE_NAME = "uploader-v1";
const urlsToCache = [
    "/",
    "/styles/global.css",
    "/styles/animations.css"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .catch((error) => console.error("Failed to cache resources during install:", error))
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
            .then((response) => {
                if (response && response.status === 200 && response.type === "basic") {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => cache.put(event.request, responseToCache));
                }
                return response;
            })
            .catch((error) => console.error("Fetch failed:", error))
    );
});