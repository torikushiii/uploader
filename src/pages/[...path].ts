import { cache } from "scripts/cache";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals, request }) => {
    const path = params.path;
    // @ts-expect-error
    const bucket = locals.runtime.env.MY_BUCKET;

    if (!bucket) {
        return new Response("Server configuration error", { status: 500 });
    }

    const filePath = Array.isArray(path) ? path.join("/") : path;
    const object = await bucket.get(filePath);
    if (object !== null) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        
        if (object.httpMetadata?.contentType?.startsWith("video/")) {
            headers.set("Accept-Ranges", "bytes");
        }

        const response = new Response(object.body, { headers });
        return cache(response);
    }

    const notFoundResponse = await fetch(new URL("/404", request.url));
    const response = new Response(notFoundResponse.body, {
        status: 404,
        headers: notFoundResponse.headers,
    });

    return cache(response, 0);
};