import { cache } from "scripts/cache";
import type { APIRoute } from "astro";
import { generateRandomString } from "utils/helpers";
import { getVideoDimensions } from "utils/videoHelpers";
import { getCachedData, setCachedData } from "utils/kv-cache";
import { stripExifData } from "utils/exif-stripper";

const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

export const POST: APIRoute = async ({ request, locals, site }) => {
    const formData = await request.formData();
    let file = formData.get("file") as File;

    if (!file) {
        return new Response(JSON.stringify({ error: "Please select a file to upload" }), { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "File size exceeds 100 MB" }), { status: 400 });
    }

    if (file.type.startsWith("image/")) {
        try {
            const strippedFile = await stripExifData(file);
            file = new File([strippedFile], file.name, { type: file.type });
        }
        catch (e) {
            // If exif stripping fails, log the error and continue with the original file
            console.error(e);
        }
    }

    const fileExtension = file.name.split(".").pop();
    const id = generateRandomString(5);
    const key = generateRandomString(16);
    const fileName = `${id}.${fileExtension}`;

    const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
    const rateLimitKey = `ratelimit:${clientIp}`;

    try {
        // @ts-expect-error
        const bucket = locals.runtime.env.MY_BUCKET;
        // @ts-expect-error
        const kv = locals.runtime.env.FILE_METADATA_CACHE;

        let rateLimit = await getCachedData(rateLimitKey, kv) || { count: 0, timestamp: Date.now() };
        if (Date.now() - rateLimit.timestamp > RATE_LIMIT_WINDOW) {
            rateLimit = { count: 0, timestamp: Date.now() };
        }

        rateLimit.count++;

        if (rateLimit.count > RATE_LIMIT) {
            await setCachedData(rateLimitKey, rateLimit, kv);
            return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
        }

        await setCachedData(rateLimitKey, rateLimit, kv);

        await bucket.put(fileName, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type }
        });

        const fileUrl = new URL(`/${id}.${fileExtension}`, site).toString();
        const deleteUrl = new URL(`/delete?key=${key}`, site).toString();
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
        ])

        const galleryList = await kv.get("gallery_file_list", "json") || [];
        galleryList.unshift(fileInfo);
        await setCachedData("gallery_file_list", galleryList, kv);

        const response = new Response(JSON.stringify(fileInfo), { status: 200 });
        return cache(response, 0);
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Error uploading file" }), { status: 500 });
    }
};

export const GET: APIRoute = async () => {
    const response = new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    return cache(response, 0);
};