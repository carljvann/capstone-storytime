import { useState, useEffect } from "react";
import { audioAPI, voiceAPI, API_BASE_URL } from "../services/api";

const GenerateAudio = () => {
  const [text, setText] = useState("");
  const [stability, setStability] = useState(0.75);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [audioHistory, setAudioHistory] = useState([]);
  const [hasVoice, setHasVoice] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVoiceAndLoadHistory();
  }, []);

  const checkVoiceAndLoadHistory = async () => {
    try {
      const voiceRes = await voiceAPI.getVoiceStatus();
      setHasVoice(voiceRes.data.status === "ready");

      if (voiceRes.data.status === "ready") {
        loadHistory();
      }
    } catch (err) {
      console.error("No voice found");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await audioAPI.getHistory(20, 0);
      setAudioHistory(response.data.data || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    if (text.length > 5000) {
      setError("Text must be less than 5000 characters");
      return;
    }

    setGenerating(true);
    setError("");
    setGeneratedAudio(null);

    try {
      const response = await audioAPI.generateAudio({
        text: text.trim(),
        stability,
        similarityBoost,
      });

      setGeneratedAudio(response.data.data);
      loadHistory(); // Refresh history
      setText(""); // Clear input
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to generate audio. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this audio file?")) return;

    try {
      await audioAPI.deleteAudio(id);
      setAudioHistory(audioHistory.filter((a) => a.id !== id));
      if (generatedAudio?.id === id) {
        setGeneratedAudio(null);
      }
    } catch (err) {
      console.error("Failed to delete audio:", err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!hasVoice) {
    return (
      <div className="generate-page">
        <div className="no-voice-message">
          <h2>🎙️ No Voice Clone Found</h2>
          <p>You need to create a voice clone before you can generate audio.</p>
          <a href="/voice-clone" className="btn-primary">
            Create Voice Clone
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="generate-page">
      <h1>✨ Generate Audio</h1>
      <p className="page-subtitle">
        Convert any text to speech using your cloned voice
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleGenerate} className="generate-form">
        <div className="form-group">
          <label htmlFor="text">Text to Convert</label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to convert to speech..."
            rows="6"
            maxLength="5000"
            disabled={generating}
          />
          <span className="char-count">{text.length} / 5000 characters</span>
        </div>

        <div className="settings-grid">
          <div className="form-group">
            <label htmlFor="stability">
              Stability: {stability.toFixed(2)}
              <span className="label-hint">Higher = more consistent</span>
            </label>
            <input
              type="range"
              id="stability"
              min="0"
              max="1"
              step="0.05"
              value={stability}
              onChange={(e) => setStability(parseFloat(e.target.value))}
              disabled={generating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="similarity">
              Similarity Boost: {similarityBoost.toFixed(2)}
              <span className="label-hint">Higher = closer to original</span>
            </label>
            <input
              type="range"
              id="similarity"
              min="0"
              max="1"
              step="0.05"
              value={similarityBoost}
              onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
              disabled={generating}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary btn-large"
          disabled={generating || !text.trim()}
        >
          {generating ? "⏳ Generating..." : "🎵 Generate Audio"}
        </button>
      </form>

      {generatedAudio && (
        <div className="generated-result">
          <h2>✅ Audio Generated!</h2>
          <div className="audio-card">
            <div className="audio-info">
              <p className="audio-text">{generatedAudio.input_text}</p>
              <div className="audio-meta">
                <span>{generatedAudio.character_count} characters</span>
                <span>{generatedAudio.duration_seconds} seconds</span>
              </div>
            </div>
            <audio
              controls
              src={`${API_BASE_URL}${generatedAudio.audio_url}`}
              autoPlay
            />
          </div>
        </div>
      )}

      {audioHistory.length > 0 && (
        <div className="audio-history">
          <h2>📚 Your Audio Library</h2>
          <div className="audio-list">
            {audioHistory.map((audio) => (
              <div key={audio.id} className="audio-card">
                <div className="audio-info">
                  <p className="audio-text">
                    {audio.input_text.substring(0, 150)}
                    {audio.input_text.length > 150 ? "..." : ""}
                  </p>
                  <div className="audio-meta">
                    <span>{audio.character_count} chars</span>
                    <span>{audio.duration_seconds}s</span>
                    <span>
                      {new Date(audio.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="audio-actions">
                  <audio controls src={`${API_BASE_URL}${audio.audio_url}`} />
                  <button
                    onClick={() => handleDelete(audio.id)}
                    className="btn-icon"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateAudio;
