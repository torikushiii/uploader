export async function loadComponent(importFn: () => Promise<any>) {
    const component = await importFn();
    return component.default;
}