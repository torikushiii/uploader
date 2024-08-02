import { cache } from "scripts/cache";
import type { APIRoute } from "astro";
import { generateRandomString } from "utils/helpers";
import { getVideoDimensions } from "utils/videoHelpers";
import { getCachedData, setCachedData } from "utils/kv-cache";
import { stripExifData } from "utils/exif-stripper";

const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const GALLERY_FILE_LIST_KEY = "gallery_file_list";
const INVALID_UPLOAD_REQUEST = "Please select a file to upload";
const FILE_SIZE_EXCEEDED = "File size exceeds 100 MB";
const RATE_LIMIT_EXCEEDED = "Rate limit exceeded";
const METHOD_NOT_ALLOWED = "Method not allowed";
const ERROR_UPLOADING_FILE = "Error uploading file";

const createErrorResponse = (message: string, status: number) => {
    return new Response(JSON.stringify({ error: message }), { status });
};

const checkRateLimit = async (clientIp: string, kv: any) => {
    const rateLimitKey = `ratelimit:${clientIp}`;
    let rateLimit = await getCachedData(rateLimitKey, kv) || { count: 0, timestamp: Date.now() };

    if (Date.now() - rateLimit.timestamp > RATE_LIMIT_WINDOW) {
        rateLimit = { count: 0, timestamp: Date.now() };
    }

    rateLimit.count++;

    if (rateLimit.count > RATE_LIMIT) {
        await setCachedData(rateLimitKey, rateLimit, kv);
        return false;
    }

    await setCachedData(rateLimitKey, rateLimit, kv);
    return true;
};

export const POST: APIRoute = async ({ request, locals, site }) => {
    const formData = await request.formData();
    let file = formData.get("file") as File;

    if (!file) {
        return createErrorResponse(INVALID_UPLOAD_REQUEST, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
        return createErrorResponse(FILE_SIZE_EXCEEDED, 400);
    }

    if (file.type.startsWith("image/")) {
        try {
            const strippedFile = await stripExifData(file);
            file = new File([strippedFile], file.name, { type: file.type });
        } catch (e) {
            console.error(e);
        }
    }

    const fileExtension = file.name.split(".").pop();
    const id = generateRandomString(5);
    const key = generateRandomString(16);
    const fileName = `${id}.${fileExtension}`;

    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";

    try {
        // @ts-expect-error
        const bucket = locals.runtime.env.MY_BUCKET;
        // @ts-expect-error
        const kv = locals.runtime.env.FILE_METADATA_CACHE;

        if (!await checkRateLimit(clientIp, kv)) {
            return createErrorResponse(RATE_LIMIT_EXCEEDED, 429);
        }

        await bucket.put(fileName, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type }
        });

        const fileUrl = new URL(`/${id}.${fileExtension}`, site).toString();
        const deleteUrl = new URL(`/api/delete?id=${id}.${fileExtension}&key=${key}`, site).toString();
        const embedUrl = new URL(`/v/${id}`, site).toString();

        let dimensions = { width: 0, height: 0 };
        if (file.type.startsWith("video/")) {
            dimensions = await getVideoDimensions(await file.arrayBuffer());
        }

        const fileInfo = {
            id,
            ext: `.${fileExtension}`,
            name: file.name.split(".")[0],
            type: file.type,
            key,
            link: fileUrl,
            delete: deleteUrl,
            embed: embedUrl,
            width: dimensions.width,
            height: dimensions.height,
            timestamp: Date.now()
        };

        await Promise.all([
            bucket.put(`${id}_metadata`, JSON.stringify(fileInfo)),
            setCachedData(key, id, kv)
        ]);

        const galleryList = await kv.get(GALLERY_FILE_LIST_KEY, "json") || [];
        galleryList.unshift(fileInfo);
        await setCachedData(GALLERY_FILE_LIST_KEY, galleryList, kv);

        const response = new Response(JSON.stringify(fileInfo), { status: 200 });
        return cache(response, 0);
    } catch (error) {
        console.error(error);
        return createErrorResponse(ERROR_UPLOADING_FILE, 500);
    }
};

export const GET: APIRoute = async () => {
    const response = createErrorResponse(METHOD_NOT_ALLOWED, 405);
    return cache(response, 0);
};