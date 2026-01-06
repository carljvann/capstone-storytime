import { useState, useEffect } from "react";
import { voiceAPI, API_BASE_URL } from "../services/api";

const VoiceClone = () => {
  const [voice, setVoice] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadVoice();
  }, []);

  const loadVoice = async () => {
    setLoading(true);
    try {
      const response = await voiceAPI.getMyVoice();
      setVoice(response.data.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Failed to load voice:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/mp3",
        "audio/x-m4a",
      ];
      if (
        !validTypes.includes(selectedFile.type) &&
        !selectedFile.name.match(/\.(mp3|wav|m4a)$/i)
      ) {
        setError("Please select a valid audio file (MP3, WAV, or M4A)");
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("audio", file);

      const response = await voiceAPI.createVoice(formData);
      setVoice(response.data.data);
      setSuccess("Voice clone created successfully! 🎉");
      setFile(null);

      // Reset file input
      document.getElementById("audio-file").value = "";
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to upload voice. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your voice clone? This will also delete all generated audio."
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await voiceAPI.deleteVoice();
      setVoice(null);
      setSuccess("Voice clone deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete voice");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading voice information...</div>;
  }

  return (
    <div className="voice-clone-page">
      <h1>🎙️ Voice Clone</h1>
      <p className="page-subtitle">
        Upload a sample of your voice to create a personalized text-to-speech
        model
      </p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {voice ? (
        <div className="voice-card">
          <div className="voice-status">
            <h2>Your Voice Clone</h2>
            <span className={`status-badge status-${voice.status}`}>
              {voice.status === "ready" ? "✅ Ready" : "⏳ Processing"}
            </span>
          </div>

          <div className="voice-details">
            <div className="detail-item">
              <span className="label">Voice ID:</span>
              <span className="value">{voice.elevenlabs_voice_id}</span>
            </div>
            <div className="detail-item">
              <span className="label">Duration:</span>
              <span className="value">{voice.duration_seconds} seconds</span>
            </div>
            <div className="detail-item">
              <span className="label">Created:</span>
              <span className="value">
                {new Date(voice.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {voice.audio_file_url && (
            <div className="voice-player">
              <h3>Original Sample</h3>
              <audio controls src={`${API_BASE_URL}${voice.audio_file_url}`} />
            </div>
          )}

          <button onClick={handleDelete} className="btn-danger">
            🗑️ Delete Voice Clone
          </button>
        </div>
      ) : (
        <div className="upload-card">
          <h2>Upload Voice Sample</h2>
          <div className="upload-instructions">
            <h3>📋 Instructions:</h3>
            <ul>
              <li>Record or upload a clear audio sample of your voice</li>
              <li>Minimum 30 seconds recommended for best results</li>
              <li>Speak naturally and clearly</li>
              <li>Avoid background noise</li>
              <li>Supported formats: MP3, WAV, M4A</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>

          <form onSubmit={handleUpload} className="upload-form">
            <div className="file-input-wrapper">
              <input
                type="file"
                id="audio-file"
                accept=".mp3,.wav,.m4a,audio/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <label htmlFor="audio-file" className="file-label">
                {file ? `📁 ${file.name}` : "📤 Choose Audio File"}
              </label>
            </div>

            {file && (
              <div className="file-info">
                <p>Selected: {file.name}</p>
                <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={!file || uploading}
            >
              {uploading ? "⏳ Uploading..." : "🚀 Create Voice Clone"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VoiceClone;
