import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, audioAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [recentAudio, setRecentAudio] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [profileRes, audioRes] = await Promise.all([
        authAPI.getProfile(),
        audioAPI.getHistory(5, 0), // Get last 5 audio files
      ]);
      
      setProfile(profileRes.data);
      setRecentAudio(audioRes.data.data || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const hasVoice = profile?.voice?.status === 'ready';
  const stats = profile?.stats || {};

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.firstName}! 👋</h1>
        <p>Here's what's happening with your voice clone</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎙️</div>
          <div className="stat-content">
            <h3>Voice Clone</h3>
            <p className="stat-value">
              {hasVoice ? '✅ Ready' : '❌ Not Created'}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎵</div>
          <div className="stat-content">
            <h3>Generated Audio</h3>
            <p className="stat-value">{stats.totalAudioFiles || 0} files</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Total Characters</h3>
            <p className="stat-value">
              {stats.totalCharacters?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          {!hasVoice ? (
            <Link to="/voice-clone" className="action-btn">
              🎙️ Create Voice Clone
            </Link>
          ) : (
            <Link to="/generate" className="action-btn">
              ✨ Generate New Audio
            </Link>
          )}
          <Link to="/voice-clone" className="action-btn secondary">
            🔧 Manage Voice
          </Link>
        </div>
      </div>

      {recentAudio.length > 0 && (
        <div className="recent-audio">
          <h2>Recent Audio</h2>
          <div className="audio-list">
            {recentAudio.map((audio) => (
              <div key={audio.id} className="audio-item">
                <div className="audio-info">
                  <p className="audio-text">
                    {audio.input_text.substring(0, 100)}
                    {audio.input_text.length > 100 ? '...' : ''}
                  </p>
                  <span className="audio-meta">
                    {audio.character_count} chars • {audio.duration_seconds}s
                  </span>
                </div>
                <audio controls src={audio.audio_url} />
              </div>
            ))}
          </div>
          <Link to="/generate" className="view-all-link">
            View all audio →
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;