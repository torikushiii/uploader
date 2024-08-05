import { cache } from "scripts/cache";
import type { APIRoute } from "astro";

const INVALID_DELETE_REQUEST = "Invalid delete request";
const FILE_NOT_FOUND = "File not found";
const METHOD_NOT_ALLOWED = "Method not allowed";
const ERROR_DELETING_FILE = "Error deleting file";

const createErrorResponse = (message: string, status: number) => {
    return new Response(JSON.stringify({ error: message }), { status });
};

export const GET: APIRoute = async ({ request, locals }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (!key) {
        return createErrorResponse(INVALID_DELETE_REQUEST, 400);
    }

    try {
        // @ts-expect-error
        const bucket = locals.runtime.env.MY_BUCKET;

        const data = await bucket.get(`${key}_metadata`);
        const fileInfo = data ? JSON.parse(await data.text()) : null;
        if (!fileInfo) {
            return createErrorResponse(FILE_NOT_FOUND, 404);
        }

        const id = `${fileInfo.id}${fileInfo.ext}`;
        await Promise.all([
            bucket.delete(id),
            bucket.delete(`${fileInfo.id}_metadata`),
            bucket.delete(`${key}_metadata`),
        ]);

        const response = new Response(JSON.stringify({ message: "File deleted successfully" }), { status: 200 });
        return cache(response, 0);
    } catch (error) {
        console.error(error);
        return createErrorResponse(ERROR_DELETING_FILE, 500);
    }
};

export const POST: APIRoute = async () => {
    const response = createErrorResponse(METHOD_NOT_ALLOWED, 405);
    return cache(response, 0);
};