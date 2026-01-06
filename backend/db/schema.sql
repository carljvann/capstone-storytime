DROP TABLE IF EXISTS generated_audio CASCADE;
DROP TABLE IF EXISTS voices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop triggers and functions if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_voices_updated_at ON voices;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================================================
-- TABLE: users
-- Purpose: Store user accounts (parent/guardian accounts)
-- ============================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    
    -- Authentication fields
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT password_hash_length CHECK (LENGTH(password_hash) >= 60),
    CONSTRAINT first_name_length CHECK (LENGTH(first_name) >= 1 AND LENGTH(first_name) <= 100),
    CONSTRAINT last_name_length CHECK (LENGTH(last_name) >= 1 AND LENGTH(last_name) <= 100)
);

-- Index for fast login lookups
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- Index for name searches (if needed later)
CREATE INDEX idx_users_name ON users(last_name, first_name);

-- Comments
COMMENT ON TABLE users IS 'Stores user account information for authentication and profile management';
COMMENT ON COLUMN users.email IS 'User email address - used for login (unique)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (60 characters)';
COMMENT ON COLUMN users.date_of_birth IS 'User date of birth - required at registration';

-- ============================================================================
-- TABLE: voices
-- Purpose: Store voice clones created by users (one per user)
-- ============================================================================
CREATE TABLE voices (
    id SERIAL PRIMARY KEY,
    
    -- Relationship
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Voice clone data
    elevenlabs_voice_id VARCHAR(255) NOT NULL,
    audio_file_url VARCHAR(500) NOT NULL,
    duration_seconds INTEGER,
    
    -- Voice status
    status VARCHAR(50) NOT NULL DEFAULT 'processing',
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT status_check CHECK (status IN ('processing', 'ready', 'failed')),
    CONSTRAINT duration_positive CHECK (duration_seconds > 0),
    CONSTRAINT elevenlabs_voice_id_length CHECK (LENGTH(elevenlabs_voice_id) > 0)
);

-- Index for fast user voice lookup
CREATE UNIQUE INDEX idx_voices_user_id ON voices(user_id);

-- Index for status queries (if checking processing voices)
CREATE INDEX idx_voices_status ON voices(status) WHERE status = 'processing';

-- Comments
COMMENT ON TABLE voices IS 'Stores voice clones - one voice per user (UNIQUE constraint on user_id)';
COMMENT ON COLUMN voices.user_id IS 'Foreign key to users table - CASCADE DELETE removes voice when user deleted';
COMMENT ON COLUMN voices.elevenlabs_voice_id IS 'Voice ID from ElevenLabs API for text-to-speech generation';
COMMENT ON COLUMN voices.audio_file_url IS 'Cloud storage URL (S3/R2) of the original voice recording';
COMMENT ON COLUMN voices.duration_seconds IS 'Duration of the voice recording in seconds';
COMMENT ON COLUMN voices.status IS 'Voice processing status: processing (initial), ready (usable), failed (error)';

-- ============================================================================
-- TABLE: generated_audio
-- Purpose: Store audio files generated from user text input
-- ============================================================================
CREATE TABLE generated_audio (
    id SERIAL PRIMARY KEY,
    
    -- Relationship (CASCADE DELETE: remove audio when voice is deleted)
    voice_id INTEGER NOT NULL REFERENCES voices(id) ON DELETE CASCADE,
    
    -- Audio generation data
    input_text TEXT NOT NULL,
    audio_url VARCHAR(500) NOT NULL,
    character_count INTEGER NOT NULL,
    duration_seconds INTEGER,
    
    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT input_text_not_empty CHECK (LENGTH(TRIM(input_text)) > 0),
    CONSTRAINT input_text_max_length CHECK (LENGTH(input_text) <= 5000),
    CONSTRAINT character_count_positive CHECK (character_count > 0 AND character_count <= 5000),
    CONSTRAINT duration_positive CHECK (duration_seconds IS NULL OR duration_seconds > 0)
);

-- Index for fast history lookup by voice
CREATE INDEX idx_generated_audio_voice_id ON generated_audio(voice_id);

-- Index for sorting by creation date (most recent first)
CREATE INDEX idx_generated_audio_created_at ON generated_audio(created_at DESC);

-- Composite index for user's audio history (via voice)
CREATE INDEX idx_generated_audio_voice_created ON generated_audio(voice_id, created_at DESC);

-- Comments
COMMENT ON TABLE generated_audio IS 'Stores generated audio files - CASCADE DELETE removes all audio when voice is deleted';
COMMENT ON COLUMN generated_audio.voice_id IS 'Foreign key to voices table - all audio deleted when voice is deleted';
COMMENT ON COLUMN generated_audio.input_text IS 'The text that was converted to speech (max 5000 characters)';
COMMENT ON COLUMN generated_audio.audio_url IS 'Cloud storage URL (S3/R2) of the generated audio file';
COMMENT ON COLUMN generated_audio.character_count IS 'Number of characters in input_text (for usage tracking)';
COMMENT ON COLUMN generated_audio.duration_seconds IS 'Duration of generated audio in seconds (optional)';

-- ============================================================================
-- TRIGGER FUNCTION: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at column to current timestamp on row update';

-- ============================================================================
-- TRIGGERS: Apply auto-update to tables with updated_at
-- ============================================================================

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for voices table
CREATE TRIGGER update_voices_updated_at
    BEFORE UPDATE ON voices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();