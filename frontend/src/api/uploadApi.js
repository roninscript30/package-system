import axios from "axios";

const API_BASE = "/api/upload";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function startUpload(fileName, contentType) {
  const { data } = await api.post("/start-upload", {
    file_name: fileName,
    content_type: contentType || "application/octet-stream",
  });
  return data;
}

export async function getPresignedUrl(fileKey, uploadId, partNumber) {
  const { data } = await api.post("/presigned-url", {
    file_key: fileKey,
    upload_id: uploadId,
    part_number: partNumber,
  });
  return data;
}

export async function updatePart(fileKey, uploadId, partNumber, etag) {
  const { data } = await api.post("/update-part", {
    file_key: fileKey,
    upload_id: uploadId,
    part_number: partNumber,
    etag: etag,
  });
  return data;
}

export async function resumeSession(fileName) {
  try {
    const { data } = await api.get(`/resume-session?filename=${encodeURIComponent(fileName)}`);
    return data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function completeUpload(fileKey, uploadId, parts) {
  const { data } = await api.post("/complete-upload", {
    file_key: fileKey,
    upload_id: uploadId,
    parts,
  });
  return data;
}

export async function abortUpload(fileKey, uploadId) {
  const { data } = await api.post("/abort", {
    file_key: fileKey,
    upload_id: uploadId,
  });
  return data;
}

export async function getUploadHistory() {
  const { data } = await api.get("/uploads");
  return data;
}

