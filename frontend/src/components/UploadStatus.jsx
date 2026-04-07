import "./UploadStatus.css";

const STATUS_CONFIG = {
  uploading: {
    icon: "⬆️",
    title: "Uploading...",
    description: "Your file is being securely uploaded to the cloud.",
  },
  paused: {
    icon: "⏸️",
    title: "Upload Paused",
    description: "You can resume the upload at any time. Progress is saved.",
  },
  completed: {
    icon: "✅",
    title: "Upload Complete!",
    description: "Your medical file has been securely uploaded and stored.",
  },
  error: {
    icon: "❌",
    title: "Upload Failed",
    description: null, // Will use error message
  },
};

export default function UploadStatus({ status, error }) {
  if (status === "idle") return null;

  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <div className={`upload-status ${status}`}>
      <span className="status-icon">{config.icon}</span>
      <div className="status-text">
        <h4>{config.title}</h4>
        <p>{status === "error" && error ? error : config.description}</p>
      </div>
    </div>
  );
}
