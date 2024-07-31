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
        if (file.type.startsWith("image/")) {
            previewContainer.innerHTML = `<img src="${e.target?.result}" alt="Image Preview" style="max-width: 100%; margin-top: 10px;">`;
        } else if (file.type.startsWith("video/")) {
            previewContainer.innerHTML = `<video src="${e.target?.result}" controls style="max-width: 100%; margin-top: 10px;"></video>`;
        } else {
            previewContainer.innerHTML = `<p>File type not supported for preview</p>`;
        }
    };
    reader.readAsDataURL(file);
};