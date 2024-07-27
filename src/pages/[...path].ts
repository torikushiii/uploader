import type { APIRoute } from "astro";

export const all: APIRoute = async ({ params, locals, request }) => {
    const path = params.path;
    // @ts-expect-error
    const bucket = locals.runtime.env.MY_BUCKET;

    if (!bucket) {
        return new Response("Server configuration error", { status: 500 });
    }

    const object = await bucket.get(path);
    if (object !== null) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);

        return new Response(object.body, {
            headers,
        });
    }

    const notFoundResponse = await fetch(new URL("/404", request.url));
    return new Response(notFoundResponse.body, {
        status: 404,
        headers: notFoundResponse.headers,
    });
};