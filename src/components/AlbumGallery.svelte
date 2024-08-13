<script>
    import { onMount } from "svelte";
    export let albumId;

    let album = null;
    let loading = true;
    let isOwner = false;
    let albumKey = "";

    async function fetchAlbumData() {
        try {
            const response = await fetch(`/api/album/${albumId}`);
            if (response.ok) {
                album = await response.json();
                checkOwnership();
            } else if (response.status === 404) {
                album = null;
            } else {
                console.error("Failed to fetch album data");
            }
        } catch (error) {
            console.error("Error fetching album data:", error);
        } finally {
            loading = false;
        }
    }

    function checkOwnership() {
        const storedAlbums = getStoredAlbums();
        const storedAlbum = storedAlbums.find(album => album.id === albumId);
        if (storedAlbum) {
            isOwner = true;
            albumKey = storedAlbum.key;
        }
    }

    function getStoredAlbums() {
        return JSON.parse(localStorage.getItem("uploadedAlbums") || "[]");
    }

    onMount(fetchAlbumData);

    function copyAlbumLink() {
        navigator.clipboard.writeText(window.location.href)
            .then(() => alert("Album link copied to clipboard!"))
            .catch((err) => console.error("Failed to copy album link: ", err));
    }

    function addMoreImages() {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.multiple = true;
        fileInput.accept = "image/*";

        fileInput.addEventListener("change", async (event) => {
            const files = event.target.files;
            if (files) {
                await uploadMoreImages(files);
            }
        });

        fileInput.click();
    }

    async function uploadMoreImages(files) {
        const uploadedFiles = [];

        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("albumId", albumId);

            try {
                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    uploadedFiles.push(data);
                } else {
                    const errorData = await response.json();
                    alert(`Request failed: ${errorData.message || "An error occurred"}`);
                }
            } catch (error) {
                console.error("Error uploading image:", error);
                alert(`An error occurred while uploading the file: ${error}`);
            }
        }

        const filteredFiles = uploadedFiles.map(file => {
            const { id, albumId, ext, name, type, link, timestamp } = file;
            return { id, albumId, ext, name, type, link, timestamp };
        });

        try {
            const response = await fetch(`/api/album/${albumId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: albumId, key: albumKey, files: [...album.files, ...filteredFiles] })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            album.files = [...album.files, ...uploadedFiles];

            const storedAlbums = JSON.parse(localStorage.getItem("uploadedAlbums") || "[]");
            const albumIndex = storedAlbums.findIndex(album => album.id === albumId);
            if (albumIndex !== -1) {
                storedAlbums[albumIndex].files = [...storedAlbums[albumIndex].files, ...uploadedFiles];
                localStorage.setItem("uploadedAlbums", JSON.stringify(storedAlbums));
            }
        } catch (error) {
            console.error("Error updating album:", error);
        }
    }

    async function deleteAlbum() {
        if (!confirm("Are you sure you want to delete this album? This action cannot be undone.")) return;

        try {
            const storedAlbums = getStoredAlbums();
            const albumData = storedAlbums.find((a) => a.id === albumId);

            if (albumData) {
                const response = await fetch(`/api/delete?albumId=${albumId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ albumKey })
                });

                if (!response.ok) {
                    console.error("Failed to delete album", response);
                    return;
                }

                const updatedAlbums = storedAlbums.filter(a => a.id !== albumId);
                localStorage.setItem("uploadedAlbums", JSON.stringify(updatedAlbums));
                window.location.href = "/";
            }
        } catch (error) {
            console.error("Error deleting album:", error);
        }
    }
</script>

<div class="album-container">
    {#if loading}
        <p>Loading album data...</p>
    {:else if album}
        <div class="album-content">
            {#each album.files as file}
                <div class="image-container">
                    <img src={file.link} alt={file.name} />
                </div>
            {/each}
        </div>
        <div class="image-tools">
            <h3>Album Tools</h3>
            <button on:click={copyAlbumLink}>Copy Album Link</button>
            {#if isOwner}
                <button on:click={addMoreImages}>Add More Images</button>
                <button on:click={deleteAlbum} class="delete-btn">Delete Album</button>
            {/if}
        </div>
    {:else}
        <p>Album doesn't exist.</p>
    {/if}
</div>

<style>
    .album-container {
        display: flex;
        gap: 2rem;
        padding: 1rem;
    }

    .album-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
    }

    .image-container {
        width: 100%;
        max-width: 800px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .image-container img {
        max-width: 100%;
        height: auto;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .image-tools {
        width: 200px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: sticky;
        top: 2rem;
        align-self: flex-start;
    }

    .image-tools button {
        padding: 0.5rem;
        background-color: #4a4a4a;
        color: white;
        border: none;
        border-radius: 0.25rem;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .image-tools button:hover {
        background-color: #5a5a5a;
    }

    .image-tools .delete-btn {
        background-color: #d9534f;
    }

    .image-tools .delete-btn:hover {
        background-color: #c9302c;
    }

    @media (max-width: 768px) {
        .album-container {
            flex-direction: column;
        }

        .image-tools {
            width: 100%;
            position: static;
        }
    }
</style>
