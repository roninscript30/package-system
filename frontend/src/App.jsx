import { useState, useCallback } from "react";
import { useChunkedUpload } from "./hooks/useChunkedUpload";
import FileUploader from "./components/FileUploader";
import ProgressTracker from "./components/ProgressTracker";
import UploadStatus from "./components/UploadStatus";
import FilePreviewModal from "./components/FilePreviewModal";
import UploadHistory from "./components/UploadHistory";
import Login from "./components/Login";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [file, setFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const { status, progress, chunkStatuses, error, uploadInfo, upload, pause, resume, cancel } =
    useChunkedUpload();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return (
      <div className="app-container" style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
        <header className="app-header">
          <div className="app-logo">🏥</div>
          <h1>
            <span className="gradient-text">MedUpload</span>
          </h1>
          <p>Secure, resumable file uploads for medical imaging and records</p>
        </header>
        <Login onLogin={setToken} />
      </div>
    );
  }

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setShowPreview(false);
  }, []);

  const handleUpload = useCallback(() => {
    if (file) upload(file);
  }, [file, upload]);

  const handleCancel = useCallback(() => {
    cancel();
    setFile(null);
    setShowPreview(false);
  }, [cancel]);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">🏥</div>
        <h1>
          <span className="gradient-text">MedUpload</span>
        </h1>
        <p>Secure, resumable file uploads for medical imaging and records</p>
        <button onClick={handleLogout} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      {/* Main Upload Card */}
      <main className="upload-card">
        <FileUploader
          file={file}
          onFileSelect={handleFileSelect}
          status={status}
          onUpload={handleUpload}
          onPause={pause}
          onResume={resume}
          onCancel={handleCancel}
          onPreview={() => setShowPreview(true)}
        />

        {/* Status Banner */}
        <UploadStatus status={status} error={error} />

        {/* Progress Tracker — show when uploading, paused, or completed */}
        {(status === "uploading" || status === "paused" || status === "completed") && (
          <ProgressTracker
            progress={progress}
            chunkStatuses={chunkStatuses}
            status={status}
          />
        )}
      </main>

      {/* Upload History List */}
      <UploadHistory triggerUpdate={status} />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-badge">
          <span>🔒</span> End-to-end encrypted
        </div>
        <div className="footer-badge">
          <span>☁️</span> AWS S3 storage
        </div>
        <div className="footer-badge">
          <span>🔄</span> Resumable uploads
        </div>
      </footer>

      {/* Preview Modal */}
      {showPreview && file && (
        <FilePreviewModal
          file={file}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

export default App;
