import { useState, useRef, useCallback } from "react";
import "./FileUploader.css";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function FileUploader({ onFileSelect, file, status, onUpload, onPause, onResume, onCancel, onPreview }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) onFileSelect(droppedFile);
  }, [onFileSelect]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) onFileSelect(selected);
  };

  const isUploading = status === "uploading";
  const isPaused = status === "paused";
  const isCompleted = status === "completed";

  return (
    <div className="file-uploader">
      {/* Drop Zone */}
      <div
        id="drop-zone"
        className={`drop-zone ${dragOver ? "drag-over" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <span className="upload-icon">🏥</span>
        <h3>Upload Medical File</h3>
        <p>
          Drag & drop your file here, or{" "}
          <span className="browse-link">browse</span>
        </p>
        <div className="file-constraints">
          <span>Max 3GB</span>
          <span>DICOM, NIfTI, PDF, ZIP</span>
          <span>Encrypted transfer</span>
        </div>
        <input
          id="file-input"
          ref={inputRef}
          type="file"
          className="file-input-hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Selected File */}
      {file && (
        <div className="selected-file">
          <span className="file-icon">📄</span>
          <div className="file-details">
            <div className="file-name">{file.name}</div>
            <div className="file-size">{formatFileSize(file.size)}</div>
          </div>
          {status === "idle" && (
            <button
              className="remove-file-btn"
              onClick={(e) => {
                e.stopPropagation();
                onFileSelect(null);
              }}
              title="Remove file"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {file && (
        <div className="upload-actions">
          <button 
            id="preview-btn" 
            className="btn btn-secondary" 
            onClick={onPreview}
          >
            👁 Preview
          </button>

          {status === "idle" || status === "error" ? (
            <button id="upload-btn" className="btn btn-primary" onClick={onUpload}>
              🚀 Start Upload
            </button>
          ) : null}

          {isUploading && (
            <button id="pause-btn" className="btn btn-secondary" onClick={onPause}>
              ⏸ Pause
            </button>
          )}

          {isPaused && (
            <button id="resume-btn" className="btn btn-resume" onClick={onResume}>
              ▶ Resume
            </button>
          )}

          {(isUploading || isPaused) && (
            <button id="cancel-btn" className="btn btn-danger" onClick={onCancel}>
              ✕ Cancel
            </button>
          )}

          {isCompleted && (
            <button className="btn btn-primary" disabled>
              ✅ Upload Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
