import "./ProgressTracker.css";

export default function ProgressTracker({ progress, chunkStatuses, status }) {
  const completed = chunkStatuses.filter((c) => c.status === "completed").length;
  const uploading = chunkStatuses.filter((c) => c.status === "uploading").length;
  const errors = chunkStatuses.filter((c) => c.status === "error").length;
  const pending = chunkStatuses.filter((c) => c.status === "pending").length;

  return (
    <div className="progress-tracker">
      {/* Overall progress bar */}
      <div className="overall-progress">
        <div className="progress-header">
          <h4>Upload Progress</h4>
          <span className="progress-percentage">{progress}%</span>
        </div>
        <div className="progress-bar-wrapper">
          <div
            className={`progress-bar-fill ${status === "uploading" ? "uploading" : ""} ${status === "completed" ? "completed" : ""}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="upload-stats">
        <div className="stat-item">
          <span className="stat-dot completed" />
          {completed} completed
        </div>
        <div className="stat-item">
          <span className="stat-dot uploading" />
          {uploading} uploading
        </div>
        <div className="stat-item">
          <span className="stat-dot pending" />
          {pending} pending
        </div>
        {errors > 0 && (
          <div className="stat-item">
            <span className="stat-dot error" />
            {errors} failed
          </div>
        )}
      </div>

      {/* Chunk grid visualization */}
      {chunkStatuses.length > 0 && chunkStatuses.length <= 600 && (
        <div className="chunk-section">
          <h5>Chunk Map ({chunkStatuses.length} parts)</h5>
          <div className="chunk-grid">
            {chunkStatuses.map((chunk) => (
              <div
                key={chunk.partNumber}
                className={`chunk-cell ${chunk.status}`}
                title={`Part ${chunk.partNumber}: ${chunk.status}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
