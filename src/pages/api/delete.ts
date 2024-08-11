import { cache } from "scripts/cache";
import type { APIRoute } from "astro";
import { getCachedData, setCachedData, invalidateCache } from "utils/kv-cache";

const INVALID_DELETE_REQUEST = "Invalid delete request";
const FILE_NOT_FOUND = "File not found";
const ALBUM_NOT_FOUND = "Album not found";
const UNAUTHORIZED = "Unauthorized";
const METHOD_NOT_ALLOWED = "Method not allowed";
const ERROR_DELETING_FILE = "Error deleting file";
const ERROR_DELETING_ALBUM = "Error deleting album";

const createErrorResponse = (message: string, status: number) => {
    return new Response(JSON.stringify({ error: message }), { status });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    const albumId = url.searchParams.get("albumId");

    let albumKey: string | undefined;
    try {
        if (request.body) {
            const body = await request.json();
            albumKey = body.albumKey;
        }
    } catch (error) {
        console.error("Error parsing request body:", error);
    }

    if ((!key && !albumId) || (albumId && !albumKey)) {
        return createErrorResponse(INVALID_DELETE_REQUEST, 400);
    }

    try {
        // @ts-expect-error
        const bucket = locals.runtime.env.MY_BUCKET;
        // @ts-expect-error
        const kv = locals.runtime.env.FILE_METADATA_CACHE;

        if (key) {
            const data = await bucket.get(`${key}_metadata`);
            const fileInfo = data ? JSON.parse(await data.text()) : null;

            if (!fileInfo) {
                return createErrorResponse(FILE_NOT_FOUND, 404);
            }

            const id = `${fileInfo.id}${fileInfo.ext}`;
            await Promise.all([
                bucket.delete(id),
                bucket.delete(`${fileInfo.id}_metadata`),
                bucket.delete(`${key}_metadata`),
            ]);

            const galleryList = await getCachedData("gallery_file_list", kv) || [];
            const updatedGalleryList = galleryList.filter(file => file.key !== key);
            await setCachedData("gallery_file_list", updatedGalleryList, kv);

            if (fileInfo.albumId) {
                const albumKey = `album:${fileInfo.albumId}`;
                const albumData = await getCachedData(albumKey, kv);
                if (albumData) {
                    const updatedAlbumData = albumData.files.filter(file => file.key !== key);
                    await setCachedData(albumKey, updatedAlbumData, kv);
                }
            }

            const response = new Response(JSON.stringify({ message: "File deleted successfully" }), { status: 200 });
            return cache(response, 0);
        } else if (albumId) {
            const albumKeyPrefix = `album:${albumId}`;
            // @ts-expect-error
            const albumBucket = locals.runtime.env.ALBUM_BUCKET;
            const albumResponse = await albumBucket.get(albumKeyPrefix);

            if (!albumResponse) {
                return createErrorResponse(ALBUM_NOT_FOUND, 404);
            }

            const albumData = JSON.parse(await albumResponse.text());
            if (albumData.key !== albumKey) {
                return createErrorResponse(UNAUTHORIZED, 401);
            }

            await Promise.all(albumData.files.map(async (file) => {
                bucket.delete(file.id + file.ext);
                bucket.delete(`${file.id}_metadata`);
                bucket.delete(`${file.key}_metadata`);
            }));

            await albumBucket.delete(albumKeyPrefix);
            await kv.delete(albumKeyPrefix);
            await invalidateCache("gallery_file_list", kv);

            const response = new Response(JSON.stringify({ message: "Album deleted successfully" }), { status: 200 });
            return cache(response, 0);
        }

        return createErrorResponse(INVALID_DELETE_REQUEST, 400);
    } catch (error) {
        console.error(error);
        return key ? createErrorResponse(ERROR_DELETING_FILE, 500) : createErrorResponse(ERROR_DELETING_ALBUM, 500);
    }
};

export const GET: APIRoute = async () => {
    const response = createErrorResponse(METHOD_NOT_ALLOWED, 405);
    return cache(response, 0);
};

export const POST: APIRoute = async () => {
    const response = createErrorResponse(METHOD_NOT_ALLOWED, 405);
    return cache(response, 0);
};
