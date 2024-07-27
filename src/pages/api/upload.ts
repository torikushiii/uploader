import type { APIRoute } from "astro";
import { generateRandomString } from "utils/helpers";

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
        await bucket.put(fileName, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type }
        });

        const fileUrl = new URL(`/${id}.${fileExtension}`, site).toString();
        const deleteUrl = new URL(`/delete?${key}`, site).toString();

        const fileInfo = {
            id,
            ext: `.${fileExtension}`,
            name: file.name.split(".")[0],
            type: file.type,
            key,
            link: fileUrl,
            delete: deleteUrl,
            timestamp: Date.now()
        };

        // Store the key in the bucket for later verification
        await bucket.put(`${id}_key`, key);

        return new Response(JSON.stringify(fileInfo), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Error uploading file" }), { status: 500 });
    }
};

export const GET: APIRoute = async () => {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};