export const validateFileSize = (file: File): boolean => {
    const maxSizeInBytes = 100 * 1024 * 1024; // 100 MB
    const errorDiv = document.getElementById("fileSizeError") as HTMLDivElement;

    if (file.size > maxSizeInBytes) {
        errorDiv.textContent = "File size exceeds 100MB. Please choose a smaller file.";
        return false;
    } else {
        errorDiv.textContent = "";
        return true;
    }
};

export const previewFile = (file: File, previewContainer: HTMLDivElement): void => {
    const reader = new FileReader();
    reader.onload = (e) => {
        if (file.type.startsWith("image/")) {
            previewContainer.innerHTML = `<img src="${e.target?.result}" alt="Image Preview" style="max-width: 100%; margin-top: 10px;">`;
        } else if (file.type.startsWith("video/")) {
            previewContainer.innerHTML = `<p>${file.name}</p>`;
        } else {
            previewContainer.innerHTML = `<p>File type not supported for preview</p>`;
        }
    };
    reader.readAsDataURL(file);
};

export const handleFile = async (
    file: File,
    showPreview: boolean,
    previewContainer: HTMLDivElement,
    progressBar: HTMLDivElement,
    progressBarFill: HTMLDivElement,
    uploadStatus: HTMLDivElement
): Promise<void> => {
    if (showPreview) {
        previewFile(file, previewContainer);
    }

    const formData = new FormData();
    formData.append("file", file, file.name);

    uploadStatus.textContent = "Uploading...";
    progressBar.style.display = "block";
    progressBarFill.style.width = "0%";

    try {
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            window.location.href = data.url;
        } else {
            const errorData = await response.json();
            displayError(errorData.error);
        }
    } catch (error) {
        displayError("An error occurred during the upload.");
    } finally {
        uploadStatus.textContent = "";
        progressBar.style.display = "none";
    }
};

const displayError = (error: string): void => {
    const errorDiv = document.getElementById("fileSizeError") as HTMLDivElement;
    errorDiv.textContent = error;
};
