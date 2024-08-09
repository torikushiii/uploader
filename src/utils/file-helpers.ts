export const validateFile = (file: File, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string } => {
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: "File type not allowed. Please upload an image or video file." };
    }

    if (file.size > maxSize) {
        return { valid: false, error: "File size exceeds 100MB. Please choose a smaller file." };
    }

    return { valid: true };
};

export const previewFile = (file: File, previewContainer: HTMLDivElement): void => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewElement = document.createElement("div");
        previewElement.classList.add("preview-item");

        if (file.type.startsWith("image/")) {
            previewElement.innerHTML = `<img src="${e.target?.result}" alt="Image Preview" style="max-width: 100%; max-height: 150px; object-fit: contain;">`;
        } else if (file.type.startsWith("video/")) {
            previewElement.innerHTML = `<video src="${e.target?.result}" controls style="max-width: 100%; max-height: 150px; object-fit: contain;"></video>`;
        } else {
            previewElement.innerHTML = `<p>File type not supported for preview</p>`;
        }

        previewContainer.appendChild(previewElement);
    };
    reader.readAsDataURL(file);
};