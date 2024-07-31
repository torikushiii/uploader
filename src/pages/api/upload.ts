// src/pages/api/upload.ts
import { cache } from "scripts/cache";
import type { APIRoute } from "astro";
import { generateRandomString } from "utils/helpers";
import { getVideoDimensions } from "utils/videoHelpers";
import { setCachedData } from "utils/kv-cache";

export const POST: APIRoute = async ({ request, locals, site }) => {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return new Response(JSON.stringify({ error: "Please select a file to upload" }), { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "File size exceeds 100 MB" }), { status: 400 });
    }

    const fileExtension = file.name.split(".").pop();
    const id = generateRandomString(5);
    const key = generateRandomString(16);
    const fileName = `${id}.${fileExtension}`;

    try {
        // @ts-expect-error
        const bucket = locals.runtime.env.MY_BUCKET;
        // @ts-expect-error
        const kv = locals.runtime.env.FILE_METADATA_CACHE;

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