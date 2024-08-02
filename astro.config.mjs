import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import mdx from "@astrojs/mdx";
import cloudflare from "@astrojs/cloudflare";

import { HOST, PORT, SITE } from "./config";

export default defineConfig({
    site: SITE,
    integrations: [sitemap(), svelte(), mdx()],
    output: "server",
    vite: {
        build: {
            sourcemap: true
        }
    },
    markdown: {
        syntaxHighlight: "prism"
    },
    adapter: cloudflare({
        mode: "directory",
        kvNamespace: ["FILE_METADATA_CACHE"],
    }),
    publicDir: "public",
    server: {
        host: HOST || "0.0.0.0",
        port: PORT ? parseInt(PORT) : 3000
    }
});