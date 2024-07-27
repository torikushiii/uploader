<script lang="ts">
    import { onMount } from "svelte";

    interface FileInfo {
        id: string;
        name: string;
        ext: string;
        timestamp: number;
        type: string;
        key: string;
        link: string;
    }

    let files: FileInfo[] = [];

    onMount(() => {
        loadFiles();
    });

    function loadFiles() {
        const storedFiles = localStorage.getItem("uploadedFiles");
        if (storedFiles) {
            files = JSON.parse(storedFiles);
            files.sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
        }
    }

    function removeFile(index: number) {
        files = files.filter((_, i) => i !== index);
        localStorage.setItem("uploadedFiles", JSON.stringify(files));
    }

    async function deleteFile(file: FileInfo, index: number) {
        if (confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
            try {
                const response = await fetch(`/api/delete?key=${file.key}`, {
                    method: "GET"
                });
                if (response.ok) {
                    removeFile(index);
                } else {
                    const errorData = await response.json();
                    alert(`Error deleting file: ${errorData.error}`);
                }
            } catch (error) {
                alert(`Error deleting file: ${error}`);
            }
        }
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
        <div class="no-files-message">
            <p>No files uploaded yet.</p>
        </div>
    {:else}
        {#each files as file, index}
            <div class="file-card">
                {#if file.type.startsWith("image/")}
                    <img src={file.link} alt={file.name} />
                {:else if file.type.startsWith("video/")}
                    <!-- svelte-ignore a11y-media-has-caption -->
                    <video src={file.link} controls>
                        Your browser does not support the video tag.
                    </video>
                {:else}
                    <div class="file-icon">
                        <span>{file.type.split("/")[1].toUpperCase()}</span>
                    </div>
                {/if}
                <div class="file-info">
                    <span title={file.name + file.ext}
                        >{truncateFilename(file.name + file.ext)}</span
                    >
                    <span>{new Date(file.timestamp).toLocaleString()}</span>
                </div>
                <div class="file-actions">
                    <button class="newtab" on:click={() => window.open(file.link, "_blank")}>Open in new tab</button>
                    <button class="delete" on:click={() => deleteFile(file, index)}>Delete</button>
                </div>
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
        min-height: 300px;
    }

    .no-files-message {
        grid-column: 1 / -1;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        min-height: 300px;
    }

    .no-files-message p {
        font-size: 1.2rem;
        color: #666;
    }

    .file-card {
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 0.5rem;
        display: flex;
        flex-direction: column;
        height: 250px;
    }

    .file-card img,
    .file-card video {
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

    .file-actions {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    button {
        width: 100%;
        padding: 0.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        color: white;
    }

    .newtab {
        background-color: #1976d2;
    }

    .delete {
        background-color: #d32f2f;
    }

    button:hover {
        opacity: 0.9;
    }
</style>
