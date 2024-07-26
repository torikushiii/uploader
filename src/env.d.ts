/// <reference types="../.astro/typesd.ts" />
/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").AdvancedRuntime;

declare namespace App {
    interface Locals extends Runtime {}
}