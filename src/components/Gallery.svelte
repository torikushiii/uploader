<script lang="ts">
    import { onMount } from "svelte";
    import LazyImage from "./LazyImage.svelte";
    import { loadComponent } from "utils/component-loader";

    const DOMAIN = window.location.origin;
    
    interface FileInfo {
        id: string;
        name: string;
        ext: string;
        timestamp: number;
        type: string;
        key: string;
        link: string;
        delete: string;
        embed: string;
        albumId?: string;
        thumbnail?: string;
    }

    export const initialFiles: FileInfo[] = [];

    let files: FileInfo[] = [];
    let selectedImage: FileInfo | null = null;
    let isModalOpen = false;
    let ImageModal: any;

    onMount(loadFiles);

    function loadFiles() {
        const storedFiles = JSON.parse(localStorage.getItem("uploadedFiles") || "[]");
        const storedAlbums = JSON.parse(localStorage.getItem("uploadedAlbums") || "[]");

        files = [
            ...storedFiles,
            ...storedAlbums.map(album => ({
                id: album.id,
                name: album.id,
                ext: "",
                embed: "",
                timestamp: album.files[0]?.timestamp || 0,
                type: "album",
                key: album.id,
                link: `/a/${album.id}`,
                delete: `/api/delete?albumId=${album.id}`,
                albumId: album.id,
                thumbnail: album.files[0]?.link || ""
            }))
        ].sort((a, b) => b.timestamp - a.timestamp);
    }

    function removeFile(fileToRemove: FileInfo) {
        const storageKey = fileToRemove.type === "album" ? "uploadedAlbums" : "uploadedFiles";
        const storedItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
        const updatedItems = storedItems.filter(item => 
            fileToRemove.type === "album" ? item.id !== fileToRemove.id : item.key !== fileToRemove.key
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedItems));
        files = files.filter(file => file !== fileToRemove);
    }

    async function deleteFile(file: FileInfo) {
        if (!confirm("Are you sure you want to delete this file? This action cannot be undone.")) return;

        try {
            const response = await fetch(file.delete, {
                method: "DELETE",
                headers: file.type === "album" ? { "Content-Type": "application/json" } : {},
                body: file.type === "album" ? JSON.stringify({ albumKey: file.key }) : undefined
            });

            if (response.ok) {
                removeFile(file);
            } else {
                const errorData = await response.json();
                alert(`Request failed: ${errorData.message || "An error occurred"}`);
            }
        } catch (error) {
            console.error(error);
            alert(`An error occurred while deleting the file: ${error}`);
        } finally {
            location.reload();
        }
    }

    function truncateFilename(name: string, maxLength: number = 20): string {
        if (name.length <= maxLength) return name;
        const extension = name.split(".").pop();
        const nameWithoutExtension = name.slice(0, name.lastIndexOf("."));
        return `${nameWithoutExtension.slice(0, maxLength - 3)}...${extension}`;
    }

    async function openModal(file: FileInfo) {
        if (file.type.startsWith("image/")) {
            ImageModal = ImageModal || await loadComponent(() => import("./ImageModal.svelte"));
            selectedImage = file;
            isModalOpen = true;
        }
    }

    function closeModal() {
        isModalOpen = false;
        selectedImage = null;
    }

    const copyLink = (link: string) => navigator.clipboard.writeText(link).catch(console.error);

    function downloadFile(link: string, fileName: string) {
        const a = document.createElement("a");
        a.href = link;
        a.download = fileName;
        a.click();
    }
</script>

<div class="gallery">
    {#if files.length === 0}
        <div class="no-files-message fade-in">
            <p>No files uploaded yet.</p>
        </div>
    {:else}
        {#each files as file, index}
            <div class="file-card slide-in" style="animation-delay: {index * 0.05}s">
                {#if file.type === "album"}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div class="album-preview" on:click={() => window.location.href = file.link}>
                        {#if file.thumbnail}
                            <LazyImage src={file.thumbnail} alt={file.name} />
                        {/if}
                        <span class="album-label">Album</span>
                    </div>
                {:else if file.type.startsWith("image/")}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div class="image-container" on:click={() => openModal(file)}>
                        <LazyImage src={file.link} alt={file.name} />
                    </div>
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
                    <span title={file.name + file.ext}>{truncateFilename(file.name + file.ext)}</span>
                    <span>{new Date(file.timestamp).toLocaleString()}</span>
                </div>
                <div class="file-actions">
                    <button class="icon-button copy" on:click={() => copyLink(file.type === "album" ? `${DOMAIN}${file.link}` : file.link)} title="Copy Link">
                        <img src="/assets/copy.svg" alt="Copy" width="18" height="18" />
                    </button>
                    {#if file.type !== "album"}
                        <button class="icon-button download" on:click={() => downloadFile(file.link, file.name + file.ext)} title="Download">
                            <img src="/assets/download.svg" alt="Download" width="18" height="18" />
                        </button>
                    {/if}
                    <button class="icon-button newtab" on:click={() => window.open(file.link, "_blank")} title="Open in new tab">
                        <img src="/assets/newtab.svg" alt="Open in new tab" width="18" height="18" />
                    </button>
                    <button class="icon-button delete" on:click={() => deleteFile(file)} title="Delete">
                        <img src="/assets/delete.svg" alt="Delete" width="18" height="18" />
                    </button>
                </div>
            </div>
        {/each}
    {/if}
</div>

{#if selectedImage && ImageModal}
    <svelte:component 
        this={ImageModal}
        src={selectedImage.link}
        alt={selectedImage.name}
        isOpen={isModalOpen}
        onClose={closeModal}
    />
{/if}

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
        transition: all 0.3s ease;
        padding-bottom: 50px;
        position: relative;
    }

    .file-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

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
        position: absolute;
        bottom: 10px;
        right: 10px;
        display: flex;
        gap: 5px;
    }

    .icon-button {
        width: 30px;
        height: 30px;
        padding: 0;
        border: none;
        border-radius: 4px;  /* Changed from 50% to 4px for square buttons */
        cursor: pointer;
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.3s ease;
    }

    .icon-button:hover {
        transform: scale(1.1);
    }

    .copy {
        background-color: #4CAF50;  /* Green */
    }

    .download {
        background-color: #FFC107;  /* Amber */
    }

    .newtab {
        background-color: #1976d2;  /* Blue */
    }

    .delete {
        background-color: #d32f2f;  /* Red */
    }

    .image-container {
        cursor: pointer;
        transition: transform 0.2s ease-in-out;
    }

    .image-container:hover {
        transform: scale(1.05);
    }

    .album-preview {
        position: relative;
        width: 100%;
        height: 150px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
        overflow: hidden;
    }

    .album-label {
        position: absolute;
        bottom: 10px;
        left: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }
</style>
