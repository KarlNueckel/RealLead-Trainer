import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });
dotenv.config();

const router = express.Router();

// ElevenLabs TTS endpoint
router.post('/speak', async (req, res) => {
  try {
    const { text, voice_id = 'EXAVITQu4vr4xnSDxMaL', voice_settings } = req.body; // Accept custom voice_settings

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('❌ ELEVENLABS_API_KEY not found');
      return res.status(500).json({ error: 'ElevenLabs API key not configured' });
    }

    console.log(`🎙️ Generating TTS with ElevenLabs (voice: ${voice_id.substring(0, 8)}...)`);

    // Use provided voice_settings or fall back to defaults
    const voiceSettings = voice_settings || {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.0,
      use_speaker_boost: true,
    };

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5', // Fastest model for real-time
        voice_settings: voiceSettings,
        optimize_streaming_latency: 3, // Maximum speed optimization (0-4, higher = faster)
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API Error:', error);
      return res.status(response.status).json({ error: 'TTS generation failed' });
    }

    // Get audio as buffer
    const audioBuffer = await response.arrayBuffer();

    // Send as MP3
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));

    console.log('✅ TTS audio generated successfully');
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


