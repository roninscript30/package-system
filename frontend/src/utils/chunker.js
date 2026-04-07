const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Split a File object into 5MB chunks.
 * @param {File} file
 * @returns {Array<{ partNumber: number, blob: Blob, start: number, end: number }>}
 */
export function splitFileIntoChunks(file) {
  const chunks = [];
  let start = 0;
  let partNumber = 1;

  while (start < file.size) {
    const end = Math.min(start + CHUNK_SIZE, file.size);
    chunks.push({
      partNumber,
      blob: file.slice(start, end),
      start,
      end,
    });
    start = end;
    partNumber++;
  }

  return chunks;
}

/**
 * Calculate total number of chunks for a given file size.
 */
export function getTotalChunks(fileSize) {
  return Math.ceil(fileSize / CHUNK_SIZE);
}

export { CHUNK_SIZE };
