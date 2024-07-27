import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
        return new Response(JSON.stringify({ error: "Invalid delete request" }), { status: 400 });
    }

    try {
        // @ts-expect-error
        const bucket = locals.runtime.env.MY_BUCKET;

        const files = await bucket.list();
        const fileToDelete = files.objects.find(async (i: { key: string; }) => i.key.endsWith(`_key`) && await bucket.get(i.key) === key);

        if (!fileToDelete) {
            return new Response(JSON.stringify({ error: "File not found" }), { status: 404 });
        }

        const fileId = fileToDelete.key.split("_key")[0];
        const fileKey = fileId.split(".")[0];

        await Promise.all([
            bucket.delete(fileId),
            bucket.delete(`${fileKey}_key`)
        ]);

        return new Response(JSON.stringify({ message: "File deleted successfully" }), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Error deleting file" }), { status: 500 });
    }
};

export const POST: APIRoute = async () => {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};