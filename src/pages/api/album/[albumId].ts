import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ params, request, locals }) => {
    const { albumId } = params;
    const files = await request.json();

    try {
        // @ts-expect-error
        const ALBUM_BUCKET = locals.runtime.env.ALBUM_BUCKET;
        await ALBUM_BUCKET.put(`album:${albumId}`, JSON.stringify(files));

        return new Response(JSON.stringify({ message: "Album saved successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error saving album data:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
};

export const GET: APIRoute = async ({ params, locals }) => {
    const { albumId } = params;

    try {
        // @ts-expect-error
        const ALBUM_BUCKET = locals.runtime.env.ALBUM_BUCKET;
        const albumObject = await ALBUM_BUCKET.get(`album:${albumId}`);

        if (!albumObject) {
            return new Response(JSON.stringify({ error: "Album not found" }), { status: 404 });
        }

        const albumData = await albumObject.text();
        const albumFiles = JSON.parse(albumData);

        const res = JSON.stringify({ id: albumId, files: albumFiles.files });

        return new Response(res, {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Error fetching album data:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
};