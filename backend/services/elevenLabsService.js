const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const fs = require("fs");

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

class ElevenLabsService {
  /**
   * Clone a voice from an audio file using Instant Voice Clone (IVC)
   * @param {string} audioFilePath - Path to the audio file
   * @param {string} name - Name for the voice (optional)
   * @returns {Promise<Object>} - Voice data including voice_id
   */
  async cloneVoice(audioFilePath, name = "Cloned Voice") {
    try {
      console.log("🎙️ Cloning voice from:", audioFilePath);

      // Create a readable stream from the audio file
      const audioStream = fs.createReadStream(audioFilePath);

      // Create voice clone using the IVC API (Instant Voice Clone)
      // This matches the official documentation:
      // elevenlabs.voices.ivc.create()
      const voice = await elevenlabs.voices.ivc.create({
        name: name,
        description: "Voice cloned via StoryTime Voice app",
        files: [audioStream],
      });

      console.log("✅ Voice cloned successfully:", voice.voiceId);

      return {
        voiceId: voice.voiceId,
        name: voice.name,
        status: "ready",
      };
    } catch (error) {
      console.error("❌ Error cloning voice:", error);
      console.error("Full error:", error.message);
      throw new Error(`Failed to clone voice: ${error.message}`);
    }
  }

  /**
   * Delete a voice clone
   * @param {string} voiceId - ElevenLabs voice ID
   * @returns {Promise<boolean>}
   */
  async deleteVoice(voiceId) {
    try {
      console.log("🗑️ Deleting voice:", voiceId);

      await elevenlabs.voices.delete(voiceId);

      console.log("✅ Voice deleted successfully");
      return true;
    } catch (error) {
      console.error("❌ Error deleting voice:", error.message);
      throw new Error(`Failed to delete voice: ${error.message}`);
    }
  }

  /**
   * Generate speech from text using a cloned voice
   * Uses the official textToSpeech.convert method from docs
   * @param {string} voiceId - ElevenLabs voice ID
   * @param {string} text - Text to convert to speech
   * @param {Object} options - Voice settings (stability, similarity_boost)
   * @returns {Promise<Buffer>} - Audio data as buffer
   */
  async generateSpeech(voiceId, text, options = {}) {
    try {
      console.log("🎵 Generating speech for voice:", voiceId);
      console.log("📝 Text length:", text.length, "characters");

      const {
        stability = 0.75,
        similarity_boost = 0.75,
        style = 0,
        use_speaker_boost = true,
      } = options;

      // Generate audio using the convert method from the documentation
      const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
        text: text,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
        voice_settings: {
          stability: stability,
          similarity_boost: similarity_boost,
          style: style,
          use_speaker_boost: use_speaker_boost,
        },
      });

      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }
      const audioBuffer = Buffer.concat(chunks);

      console.log("✅ Speech generated successfully");
      console.log(
        "📊 Audio size:",
        (audioBuffer.length / 1024).toFixed(2),
        "KB"
      );

      return audioBuffer;
    } catch (error) {
      console.error("❌ Error generating speech:", error.message);
      throw new Error(`Failed to generate speech: ${error.message}`);
    }
  }

  /**
   * Get voice details
   * @param {string} voiceId - ElevenLabs voice ID
   * @returns {Promise<Object>}
   */
  async getVoice(voiceId) {
    try {
      console.log("🔍 Getting voice details:", voiceId);

      const voice = await elevenlabs.voices.get(voiceId);

      return {
        voiceId: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        samples: voice.samples || [],
      };
    } catch (error) {
      console.error("❌ Error getting voice:", error.message);
      throw new Error(`Failed to get voice: ${error.message}`);
    }
  }

  /**
   * Check if service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!process.env.ELEVENLABS_API_KEY;
  }
}

module.exports = new ElevenLabsService();
