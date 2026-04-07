/**
 * Detect file type from the file name extension.
 * Returns one of: "dicom", "pdf", "image", "excel", "other"
 */
export function getFileType(fileName) {
  if (!fileName) return "other";

  const ext = fileName.split(".").pop().toLowerCase();

  const typeMap = {
    // Medical imaging
    dcm: "dicom",
    dicom: "dicom",

    // PDF
    pdf: "pdf",

    // Images
    png: "image",
    jpg: "image",
    jpeg: "image",
    gif: "image",
    bmp: "image",
    webp: "image",
    svg: "image",

    // Excel
    xlsx: "excel",
    xls: "excel",
    csv: "excel",
  };

  return typeMap[ext] || "other";
}

/**
 * Get a human-readable label for the file type.
 */
export function getFileTypeLabel(fileType) {
  const labels = {
    dicom: "DICOM Medical Image",
    pdf: "PDF Document",
    image: "Image",
    excel: "Spreadsheet",
    other: "File",
  };
  return labels[fileType] || "File";
}
