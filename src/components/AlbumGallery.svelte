<script>
    import { onMount } from "svelte";
    export let albumId;

    let album = null;
    let loading = true;

    async function fetchAlbumData() {
        try {
            const response = await fetch(`/api/album/${albumId}`);
            
            if (response.ok) {
                album = await response.json();
            } else if (response.status === 404) {
                album = null;
            } else {
                console.error("Failed to fetch album data");
            }
        } catch (error) {
            console.error("Error fetching album data:", error);
        }
        finally {
            loading = false;
        }
    }

    onMount(fetchAlbumData);

    function copyAlbumLink() {
        navigator.clipboard.writeText(window.location.href)
            .catch((err) => console.error("Failed to copy album link: ", err));
    }

    async function deleteAlbum() {
        if (confirm("Are you sure you want to delete this album? This action cannot be undone.")) {
            try {
                const response = await fetch(`/api/delete?albumId=${albumId}`);
                if (response.ok) {
                    const storedAlbums = localStorage.getItem("uploadedAlbums") || "[]";
                    const albums = JSON.parse(storedAlbums);
                    const updatedAlbums = albums.filter((album) => album.id !== albumId);
                    localStorage.setItem("uploadedAlbums", JSON.stringify(updatedAlbums));

                    alert("Album deleted successfully.");

                    window.location.href = "/";
                } else {
                    const errorData = await response.json();
                    alert(`Error deleting album: ${errorData.error}`);
                }
            } catch (error) {
                alert(`Error deleting album: ${error}`);
            }
        }
    }
</script>

<div class="album-container">
    <div class="gallery">
        {#if loading}
            <p>Loading album data...</p> 
        {:else if album}
            <div class="first-image-container">
                {#if album.files.length > 0}
                    <img src={album.files[0].link} alt={album.files[0].name} />
                    <div class="album-tools">
                        <button on:click={copyAlbumLink} title="Copy Album Link">
                            <img src="/assets/copy.svg" alt="Copy" width="18" height="18" />
                        </button>
                    </div>
                {/if}
            </div>
            {#each album.files.slice(1) as file}
                <img src={file.link} alt={file.name} />
            {/each}
        {:else}
            <p>Album doesn't exist.</p> 
        {/if}
    </div>
</div>

<style>
    .album-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
    }

    .gallery {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        width: 100%;
        max-width: 800px;
    }

    .gallery img {
        max-width: 100%;
        height: auto;
        border-radius: 0.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .first-image-container {
        position: relative;
    }

    .album-tools {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 1rem;
    }

    .album-tools button {
        background-color: #eee;
        border: none;
        padding: 0.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
    }

    .album-tools button:hover {
        background-color: #ddd;
    }
</style>
