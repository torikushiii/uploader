<script lang="ts">
    import { onMount } from "svelte";

    export let src: string;
    export let alt: string;

    let loaded = false;
    let thisImage: HTMLImageElement;

    onMount(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                thisImage.src = src;
                observer.unobserve(thisImage);
            }
        });

        observer.observe(thisImage);

        return () => {
            observer.unobserve(thisImage);
        };
    });

    function onLoad() {
        loaded = true;
    }
</script>

<div class="lazy-image-container">
    {#if !loaded}
        <div class="placeholder" />
    {/if}
    <!-- svelte-ignore a11y-missing-attribute -->
    <img bind:this={thisImage} {alt} class:loaded on:load={onLoad} />
</div>

<style>
    .lazy-image-container {
        position: relative;
        width: 100%;
        height: 150px;
    }

    .placeholder {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: #f0f0f0;
        border-radius: 4px;
    }

    img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    }

    img.loaded {
        opacity: 1;
    }
</style>
