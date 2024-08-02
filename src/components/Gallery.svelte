<script lang="ts">
    import { onMount } from "svelte";
    import LazyImage from "./LazyImage.svelte";
    import { loadComponent } from "utils/component-loader";

    interface FileInfo {
        id: string;
        name: string;
        ext: string;
        timestamp: number;
        type: string;
        key: string;
        link: string;
        embed: string;
    }

    export let initialFiles = [];
    let files: FileInfo[] = initialFiles;

    let selectedImage: FileInfo | null = null;
    let isModalOpen = false;
    let ImageModal: any;

    onMount(() => {
        if (files.length === 0) {
            loadFiles();
        }
    });

    function loadFiles() {
        const storedFiles = localStorage.getItem("uploadedFiles");
        if (storedFiles) {
            files = JSON.parse(storedFiles);
            files.sort((a, b) => b.timestamp - a.timestamp);
        }
    }

    function removeFile(index: number) {
        files = files.filter((_, i) => i !== index);
        localStorage.setItem("uploadedFiles", JSON.stringify(files));
    }

    async function deleteFile(file: FileInfo, index: number) {
        if (confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
            try {
                // need to find a better way to handle this pepeW
                const response = await fetch(`/api/delete?id=${file.id}${file.ext}&key=${file.key}`, {
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
            finally {
                location.reload();
            }
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
            if (!ImageModal) {
                ImageModal = await loadComponent(() => import("./ImageModal.svelte"));
            }
            selectedImage = file;
            isModalOpen = true;
        }
    }

    function closeModal() {
        isModalOpen = false;
        selectedImage = null;
    }

    function copyLink(link: string) {
        navigator.clipboard.writeText(link)
            .then(() => alert("Link copied to clipboard!"))
            .catch(err => console.error("Error copying link: ", err));
    }

    function downloadFile(link: string, fileName: string) {
        const a = document.createElement("a");
        a.href = link;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
                {#if file.type.startsWith("image/")}
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
                    <span title={file.name + file.ext}
                        >{truncateFilename(file.name + file.ext)}</span
                    >
                    <span>{new Date(file.timestamp).toLocaleString()}</span>
                </div>
                <div class="file-actions">
                    <div class="file-actions">
                        <button class="icon-button copy" on:click={() => copyLink(file.link)} title="Copy Link">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M0 0h24v24H0z" fill="none"/>
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </button>
                        <button class="icon-button download" on:click={() => downloadFile(file.link, file.name + file.ext)} title="Download">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M0 0h24v24H0z" fill="none"/>
                                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                        </button>
                        <button class="icon-button newtab" on:click={() => window.open(file.link, "_blank")} title="Open in new tab">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M0 0h24v24H0V0z" fill="none"/>
                                <path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                            </svg>
                        </button>
                        <button class="icon-button delete" on:click={() => deleteFile(file, index)} title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M0 0h24v24H0V0z" fill="none"/>
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/>
                            </svg>
                        </button>
                    </div>
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
</style>
