import { cache } from "scripts/cache";
import type { APIRoute } from "astro";
import { getCachedData, setCachedData, invalidateCache } from "utils/kv-cache";

export const GET: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
        return new Response(JSON.stringify({ error: "Invalid delete request" }), { status: 400 });
    }

    try {
        // @ts-expect-error
        const bucket = locals.runtime.env.MY_BUCKET;
        // @ts-expect-error
        const kv = locals.runtime.env.FILE_METADATA_CACHE;

        const fileInfo = await getCachedData(key, kv);

        if (!fileInfo) {
            return new Response(JSON.stringify({ error: "File not found" }), { status: 404 });
        }

        await Promise.all([
            bucket.delete(fileInfo.id),
            invalidateCache(fileInfo.key, kv)
        ]);

        let galleryList = await getCachedData("gallery_file_list", kv) || [];
        galleryList = galleryList.filter(file => file.key !== key);
        await setCachedData("gallery_file_list", galleryList, kv);

        const response = new Response(JSON.stringify({ message: "File deleted successfully" }), { status: 200 });
        return cache(response, 0);
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Error deleting file" }), { status: 500 });
    }
};

export const POST: APIRoute = async () => {
    const response = new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    return cache(response, 0);
};