export async function onRequest({ next }) {
    const response = await next();
    if (response.status === 404) {
        return Response.redirect(new URL("/404", response.url), 404);
    }
    return response;
}