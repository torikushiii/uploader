import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
    const path = params.path;
    // @ts-expect-error
    const bucket = locals.runtime.env.MY_BUCKET;

    if (!bucket) {
        return new Response("Server configuration error", { status: 500 });
    }

    const object = await bucket.get(path);
    if (object === null) {
        return new Response("Not Found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);

    return new Response(object.body, {
        headers,
    });
};