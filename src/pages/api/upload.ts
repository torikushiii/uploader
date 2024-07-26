import type { APIRoute } from "astro";

const generateRandomFileName = () => {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array(5).fill(null).map(() => characters.charAt(Math.floor(Math.random() * characters.length))).join("");
};

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
    const randomFileName = generateRandomFileName();
    const fileName = `${randomFileName}.${fileExtension}`;

    try {
        // @ts-expect-error
        const bucket = locals.runtime.env.MY_BUCKET;
        await bucket.put(fileName, await file.arrayBuffer(), {
            httpMetadata: { contentType: file.type }
        });

        const fileUrl = new URL(`/${fileName}`, site).toString();

        const fileInfo = {
            url: fileUrl,
            name: file.name,
            timestamp: Date.now(),
            type: file.type
        };

        return new Response(JSON.stringify({
            url: fileUrl,
            fileInfo
        }), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Error uploading file" }), { status: 500 });
    }
};

export const GET: APIRoute = async () => {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};