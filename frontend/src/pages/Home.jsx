import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <div className="hero">
        <h1 className="hero-title">
          🎙️ Clone Your Voice with AI
        </h1>
        <p className="hero-subtitle">
          Transform any text into speech using your own voice. 
          Create audiobooks, narrations, and more with StoryTime Voice.
        </p>
        
        <div className="hero-actions">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-hero">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-hero">
                Get Started Free
              </Link>
              <Link to="/login" className="btn-hero-secondary">
                Log In
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎤</div>
            <h3>1. Upload Your Voice</h3>
            <p>Record a short sample of your voice reading naturally</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>2. AI Training</h3>
            <p>Our AI learns the unique characteristics of your voice</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>3. Generate Speech</h3>
            <p>Convert any text to natural-sounding speech in your voice</p>
          </div>
        </div>
      </div>

      <div className="use-cases">
        <h2>Perfect For</h2>
        <div className="use-cases-grid">
          <div className="use-case">
            <span className="use-case-icon">📚</span>
            <h3>Audiobooks</h3>
            <p>Turn your written stories into audiobooks</p>
          </div>
          
          <div className="use-case">
            <span className="use-case-icon">🎓</span>
            <h3>Education</h3>
            <p>Create personalized learning materials</p>
          </div>
          
          <div className="use-case">
            <span className="use-case-icon">📹</span>
            <h3>Content Creation</h3>
            <p>Add voiceovers to videos and podcasts</p>
          </div>
          
          <div className="use-case">
            <span className="use-case-icon">♿</span>
            <h3>Accessibility</h3>
            <p>Make content accessible to everyone</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;