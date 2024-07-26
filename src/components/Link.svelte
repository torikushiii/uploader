<script lang="ts">
    export let href: string;
    export let title: string | undefined;
    let className: string | undefined;
    export { className as class };
</script>

<a class={className} {href} {title} {...$$restProps}><slot /></a>

<style>
    a {
        text-decoration: underline;
        text-decoration-color: var(--color-semi-trans);
        color: var(--color);

        transition: color 0.2s ease;
    }

    a:hover,
    a:focus {
        color: var(--accent);
        text-decoration-color: var(--accent);
        text-decoration-thickness: 2px;
        outline: none;
    }
</style>