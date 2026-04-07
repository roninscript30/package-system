import { useState, useRef, useCallback } from "react";
import { splitFileIntoChunks } from "../utils/chunker";
import { startUpload, getPresignedUrl, completeUpload, abortUpload, updatePart, resumeSession } from "../api/uploadApi";

const MAX_RETRIES = 3;
const MAX_CONCURRENT = 5;
const RETRY_BASE_DELAY = 1000;

export function useChunkedUpload() {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [chunkStatuses, setChunkStatuses] = useState([]);
  const [error, setError] = useState(null);
  const [uploadInfo, setUploadInfo] = useState(null);

  const isPausedRef = useRef(false);
  const fileRef = useRef(null);

  const uploadChunk = async (chunk, fileKey, uploadId, retryCount = 0) => {
    try {
      const { url } = await getPresignedUrl(fileKey, uploadId, chunk.partNumber);

      const response = await fetch(url, {
        method: "PUT",
        body: chunk.blob,
        headers: { "Content-Type": "application/octet-stream" },
      });

      if (!response.ok) {
        throw new Error(`S3 returned ${response.status}`);
      }

      const etag = response.headers.get("ETag");
      if (!etag) throw new Error("No ETag returned from S3");

      await updatePart(fileKey, uploadId, chunk.partNumber, etag);
      
      return { ETag: etag, PartNumber: chunk.partNumber };
    } catch (err) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount);
        await new Promise((r) => setTimeout(r, delay));
        return uploadChunk(chunk, fileKey, uploadId, retryCount + 1);
      }
      throw err;
    }
  };

  const uploadWithPool = async (chunks, fileKey, uploadId, completedParts, file) => {
    const remaining = chunks.filter(
      (c) => !completedParts.find((p) => p.PartNumber === c.partNumber)
    );

    const totalChunks = chunks.length;
    let doneCount = completedParts.length;
    const parts = [...completedParts];

    const statuses = chunks.map((c) => ({
      partNumber: c.partNumber,
      status: completedParts.find((p) => p.PartNumber === c.partNumber)
        ? "completed"
        : "pending",
    }));
    setChunkStatuses([...statuses]);

    const setOneStatus = (partNumber, newStatus) => {
      const idx = statuses.findIndex((s) => s.partNumber === partNumber);
      if (idx !== -1) statuses[idx].status = newStatus;
      setChunkStatuses([...statuses]);
    };

    let queueIdx = 0;
    let hasError = null;

    const processNext = () => {
      if (isPausedRef.current || hasError || queueIdx >= remaining.length) {
        return Promise.resolve();
      }

      const chunk = remaining[queueIdx++];
      setOneStatus(chunk.partNumber, "uploading");

      return uploadChunk(chunk, fileKey, uploadId)
        .then((result) => {
          setOneStatus(chunk.partNumber, "completed");
          parts.push(result);
          doneCount++;
          setProgress(Math.round((doneCount / totalChunks) * 100));

          return processNext();
        })
        .catch((err) => {
          setOneStatus(chunk.partNumber, "error");
          hasError = err;
        });
    };

    const poolSize = Math.min(MAX_CONCURRENT, remaining.length);
    const workers = Array.from({ length: poolSize }, () => processNext());

    await Promise.all(workers);

    if (hasError && !isPausedRef.current) throw hasError;

    if (isPausedRef.current) {
      return { parts, complete: false };
    }

    return { parts, complete: true };
  };

  const upload = useCallback(async (file) => {
    fileRef.current = file;
    isPausedRef.current = false;
    setError(null);
    setStatus("uploading");
    setProgress(0);

    try {
      const chunks = splitFileIntoChunks(file);
      let uploadId, fileKey;
      let completedParts = [];

      const savedState = await resumeSession(file.name);
      
      if (savedState) {
        uploadId = savedState.upload_id;
        fileKey = savedState.file_key;
        completedParts = savedState.parts_uploaded || [];
        setProgress(Math.round((completedParts.length / chunks.length) * 100));
      } else {
        const result = await startUpload(file.name, file.type);
        uploadId = result.upload_id;
        fileKey = result.file_key;
      }

      setUploadInfo({ uploadId, fileKey });

      const { parts, complete } = await uploadWithPool(
        chunks, fileKey, uploadId, completedParts, file
      );

      if (!complete) return; 

      await completeUpload(fileKey, uploadId, parts);
      setStatus("completed");
      setProgress(100);
    } catch (err) {
      if (isPausedRef.current) return;
      setError(err.message || "Upload failed");
      setStatus("error");
    }
  }, []);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    if (fileRef.current) upload(fileRef.current);
  }, [upload]);

  const cancel = useCallback(async () => {
    isPausedRef.current = true;
    if (uploadInfo) {
      try { await abortUpload(uploadInfo.fileKey, uploadInfo.uploadId); } catch { }
    }
    setStatus("idle");
    setProgress(0);
    setChunkStatuses([]);
    setError(null);
    setUploadInfo(null);
  }, [uploadInfo]);

  return { status, progress, chunkStatuses, error, uploadInfo, upload, pause, resume, cancel };
}
