/**
 * localStorage helpers for resumable uploads.
 *
 * Key format: "upload_<fileName>_<fileSize>_<lastModified>"
 *
 * Stored value:
 * {
 *   uploadId: string,
 *   fileKey: string,
 *   completedParts: [{ ETag: string, PartNumber: number }],
 *   timestamp: number
 * }
 */

const PREFIX = "upload_";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function _buildKey(file) {
  return `${PREFIX}${file.name}_${file.size}_${file.lastModified}`;
}

/**
 * Save the current upload state to localStorage.
 */
export function saveUploadState(file, uploadId, fileKey, completedParts) {
  const key = _buildKey(file);
  const state = {
    uploadId,
    fileKey,
    completedParts,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // localStorage full — silently ignore
  }
}

/**
 * Load a previously saved upload state.
 * Returns null if not found or expired.
 */
export function loadUploadState(file) {
  const key = _buildKey(file);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const state = JSON.parse(raw);

    // Expire after 24 hours
    if (Date.now() - state.timestamp > EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

/**
 * Clear the upload state for a file.
 */
export function clearUploadState(file) {
  const key = _buildKey(file);
  localStorage.removeItem(key);
}
