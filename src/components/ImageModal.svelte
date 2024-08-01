<script lang="ts">
    export let src: string;
    export let alt: string;
    export let isOpen: boolean;
    export let onClose: () => void;

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Escape") {
            onClose();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown}/>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if isOpen}
    <div class="modal-overlay" on:click={onClose}>
        <div class="modal-content" on:click|stopPropagation>
            <img {src} {alt} />
            <button class="close-button" on:click={onClose}>&times;</button>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
    }

    img {
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
    }

    .close-button {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 30px;
        color: white;
        background: none;
        border: none;
        cursor: pointer;
    }
</style>