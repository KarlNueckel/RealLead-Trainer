import express from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });
dotenv.config();

const router = express.Router();

// TTS endpoint: Prefer ElevenLabs for consistent voices if available; fallback to OpenAI
router.post('/speak', async (req, res) => {
  try {
    const { text, personaId, settings } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const preferEleven = !!process.env.ELEVENLABS_API_KEY;

    if (preferEleven && personaId) {
      // ElevenLabs voice mapping from personaId
      const map = {
        avery: 'EXAVITQu4vr4xnSDxMaL', // Bella
        morgan: 'ErXwobaYiN019PkySvjV', // Adam
        quinn: 'pFZP5JQG7iQjIQuC4Bku', // Alt mature female (example)
      };
      const voiceId = map[personaId] || map['avery'];
      const model = process.env.ELEVENLABS_TTS_MODEL || 'eleven_multilingual_v2';

      console.log(`🎙️ Generating TTS with ElevenLabs (voice: ${voiceId}, model: ${model})`);
      const elResp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          model_id: model,
          text,
          optimize_streaming_latency: 0,
          output_format: 'mp3_44100_128',
          voice_settings: settings || undefined,
        }),
      });

      if (!elResp.ok) {
        const errTxt = await elResp.text().catch(() => '');
        console.warn('⚠️ ElevenLabs TTS failed:', elResp.status, errTxt);
      } else {
        const audioBuffer = await elResp.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(audioBuffer));
        console.log('✅ ElevenLabs TTS audio generated successfully');
        return;
      }
      // Fall through to OpenAI if EL fails
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found');
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // OpenAI fallback voices
    const voiceMap = { avery: 'alloy', morgan: 'verse', quinn: 'amber' };
    const voice = (personaId && voiceMap[personaId]) || 'alloy';
    const model = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';

    console.log(`🎙️ Generating TTS with OpenAI (voice: ${voice}, model: ${model})`);
    const oaResp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, voice, input: text, format: 'mp3' }),
    });

    if (!oaResp.ok) {
      const err = await oaResp.text().catch(() => '');
      console.error('❌ OpenAI TTS failed:', oaResp.status, err);
      return res.status(oaResp.status).json({ error: 'TTS generation failed' });
    }

    const audioBuffer = await oaResp.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
    console.log('✅ OpenAI TTS audio generated successfully');
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


