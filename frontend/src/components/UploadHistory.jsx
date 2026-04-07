import React, { useState, useEffect } from "react";
import { getUploadHistory } from "../api/uploadApi";
import "./UploadHistory.css";

export default function UploadHistory({ triggerUpdate }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await getUploadHistory();
        setHistory(data);
        setError(null);
      } catch (err) {
        setError("Failed to load upload history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [triggerUpdate]);

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  if (loading && history.length === 0) return <div className="history-status">Loading history...</div>;
  if (error) return <div className="history-status error">{error}</div>;

  return (
    <div className="upload-history">
      <h3>Recent Uploads</h3>
      {history.length === 0 ? (
        <p className="no-history">No files uploaded yet.</p>
      ) : (
        <ul className="history-list">
          {history.map((record) => (
            <li key={record.id} className="history-item">
              <div className="history-file">📄 {record.filename}</div>
              <div className="history-meta">
                <span className="history-size">{formatSize(record.size)}</span>
                <span className="history-date">{formatDate(record.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
