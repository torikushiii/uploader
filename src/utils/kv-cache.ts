// src/utils/kvCache.ts
import { LRUCache } from 'lru-cache';

const memoryCache = new LRUCache<string, any>({
    max: 500,
    ttl: 1000 * 60 * 60
});

export async function getCachedData(key: string, kv: any) {
    let data = memoryCache.get(key);
    if (data) return data;

    data = await kv.get(key, "json");
    if (data) {
        memoryCache.set(key, data);
    }
    return data;
}

export async function setCachedData(key: string, data: any, kv: any) {
    await kv.put(key, JSON.stringify(data), { expirationTtl: 3600 });
    memoryCache.set(key, data);
}

export async function invalidateCache(key: string, kv: any) {
    await kv.delete(key);
    memoryCache.delete(key);
}