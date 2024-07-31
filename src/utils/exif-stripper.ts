export async function stripExifData(file: File): Promise<Blob> {
    if (!file.type.startsWith("image/jpeg")) {
        return file;
    }

    const arrayBuffer = await file.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // Check for JPEG SOI marker
    if (dataView.getUint16(0) !== 0xFFD8) {
        throw new Error("Not a valid JPEG");
    }

    let offset = 2;
    let markerLength: number;
    let exifOffset = -1;

    // Find APP1 marker (where EXIF data is stored)
    while (offset < dataView.byteLength) {
        if (dataView.getUint16(offset) === 0xFFE1) {
            exifOffset = offset;
            break;
        }
        markerLength = dataView.getUint16(offset + 2) + 2;
        offset += markerLength;
    }

    if (exifOffset === -1) {
        return file;
    }

    const newSize = arrayBuffer.byteLength - (dataView.getUint16(exifOffset + 2) + 2);
    const newArrayBuffer = new ArrayBuffer(newSize);
    const newDataView = new DataView(newArrayBuffer);

    new Uint8Array(newArrayBuffer).set(new Uint8Array(arrayBuffer.slice(0, exifOffset)));

    const afterExif = arrayBuffer.slice(exifOffset + dataView.getUint16(exifOffset + 2) + 2);
    new Uint8Array(newArrayBuffer).set(new Uint8Array(afterExif), exifOffset);

    return new Blob([newArrayBuffer], { type: "image/jpeg" });
}