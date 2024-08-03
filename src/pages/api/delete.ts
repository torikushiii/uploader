import { cache } from "scripts/cache";
import type { APIRoute } from "astro";
import { getCachedData, setCachedData, invalidateCache } from "utils/kv-cache";

const GALLERY_FILE_LIST_KEY = "gallery_file_list";
const INVALID_DELETE_REQUEST = "Invalid delete request";
const FILE_NOT_FOUND = "File not found";
const METHOD_NOT_ALLOWED = "Method not allowed";
const ERROR_DELETING_FILE = "Error deleting file";
const INVALID_KEY = "Invalid key";

const createErrorResponse = (message: string, status: number) => {
    return new Response(JSON.stringify({ error: message }), { status });
};

export const GET: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const key = url.searchParams.get("key");

    if (!key) {
        return createErrorResponse(INVALID_DELETE_REQUEST, 400);
    }

    try {
        // @ts-expect-error
        const bucket = locals.runtime.env.MY_BUCKET;
        // @ts-expect-error
        const kv = locals.runtime.env.FILE_METADATA_CACHE;

        let fileInfo = await getCachedData(key, kv);
        if (!fileInfo) {
            const object = await bucket.get(id);
            if (object) {
                const keyData = object.key;
                if (key !== keyData) {
                    return createErrorResponse(INVALID_KEY, 400);
                }
            }
            else {
                return createErrorResponse(FILE_NOT_FOUND, 404);
            }
        }

        const keyId = id?.split(".")[0];
        await Promise.all([
            bucket.delete(id),
            bucket.delete(`${keyId}_metadata`),
            invalidateCache(key, kv)
        ]);

        let galleryList = await getCachedData(GALLERY_FILE_LIST_KEY, kv) || [];
        galleryList = galleryList.filter(file => file.key !== key && file.id !== id);
        await setCachedData(GALLERY_FILE_LIST_KEY, galleryList, kv);

        const response = new Response(JSON.stringify({ message: "File deleted successfully" }), { status: 200 });
        return cache(response, 0);
    } catch (error) {
        console.error(error);
        return createErrorResponse(ERROR_DELETING_FILE, 500);
    }
};

export const POST: APIRoute = async () => {
    const response = createErrorResponse(METHOD_NOT_ALLOWED, 405);
    return cache(response, 0);
};