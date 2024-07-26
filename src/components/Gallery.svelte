<script lang="ts">
    import { onMount } from "svelte";

    interface FileInfo {
        url: string;
        name: string;
        timestamp: number;
        type: string;
    }

    let files: FileInfo[] = [];

    onMount(() => {
        const storedFiles = localStorage.getItem("uploadedFiles");
        if (storedFiles) {
            files = JSON.parse(storedFiles);
            files.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
        }
    });

    function removeFile(index: number) {
        files = files.filter((_, i) => i !== index);
        localStorage.setItem("uploadedFiles", JSON.stringify(files));
    }

    function truncateFilename(name: string, maxLength: number = 20): string {
        if (name.length <= maxLength) return name;
        const extension = name.split(".").pop();
        const nameWithoutExtension = name.slice(0, name.lastIndexOf("."));
        return `${nameWithoutExtension.slice(0, maxLength - 3)}...${extension}`;
    }
</script>

<div class="gallery">
    {#if files.length === 0}
        <p>No files uploaded yet.</p>
    {:else}
        {#each files as file, index}
            <div class="file-card">
                {#if file.type.startsWith("image/")}
                    <img src={file.url} alt={file.name} />
                {:else if file.type.startsWith("video/")}
                    <!-- svelte-ignore a11y-media-has-caption -->
                    <video src={file.url} controls>
                        Your browser does not support the video tag.
                    </video>
                {:else}
                    <div class="file-icon">
                        <span>{file.type.split("/")[1].toUpperCase()}</span>
                    </div>
                {/if}
                <div class="file-info">
                    <span title={file.name}>{truncateFilename(file.name)}</span>
                    <span>{new Date(file.timestamp).toLocaleString()}</span>
                </div>
                <button on:click={() => removeFile(index)}>Remove</button>
            </div>
        {/each}
    {/if}
</div>

<style>
    .gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem;
    }

    .file-card {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        height: 250px;
    }

    .file-card img, .file-card video {
        width: 100%;
        height: 150px;
        object-fit: cover;
        border-radius: 4px;
    }

    .file-icon {
        width: 100%;
        height: 150px;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #f0f0f0;
        border-radius: 4px;
    }

    .file-icon span {
        font-size: 1.5rem;
        font-weight: bold;
    }

    .file-info {
        margin-top: 0.5rem;
        font-size: 0.8rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    button {
        margin-top: auto;
        background-color: #f44336;
        color: white;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        cursor: pointer;
    }

    button:hover {
        background-color: #d32f2f;
    }
</style>