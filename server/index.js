import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import scriptRoutes from './routes/scripts.js';
import ttsRoutes from './routes/tts.js';
import scoringRoutes from './routes/scoring.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local (root) and .env (server/)
console.log('📂 Looking for .env.local at:', join(__dirname, '../.env.local'));
const result1 = dotenv.config({ path: join(__dirname, '../.env.local') });
if (result1.error) {
  console.log('⚠️ .env.local not found or has error:', result1.error.message);
} else {
  console.log('✅ Loaded .env.local with', Object.keys(result1.parsed || {}).length, 'variables');
}

console.log('📂 Looking for server/.env at:', join(__dirname, '.env'));
const result2 = dotenv.config({ path: join(__dirname, '.env') });
if (result2.error) {
  console.log('⚠️ server/.env not found or has error:', result2.error.message);
} else {
  console.log('✅ Loaded server/.env with', Object.keys(result2.parsed || {}).length, 'variables');
}

// Check critical keys
console.log('🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('🔑 ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? '✅ Set' : '❌ Missing');
console.log('🔑 DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');

const app = express();
const prisma = new PrismaClient();
const PORT = 3001; // Fixed port for backend

// Middleware
app.use(cors());
// Allow large webhook payloads (transcripts can be big)
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('server/uploads'));

// Routes
app.use('/api/scripts', scriptRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/scoring', scoringRoutes);

// ====================================
// 📞 VAPI WEBHOOK + TRANSCRIPT CACHE
// ====================================

// In‑memory store for last transcript (normalized for UI)
let lastTranscript = [];
// Map of callId -> { transcript: TranscriptEntry[], durationMs: number, endedAt: number }
const transcriptsById = new Map();

// Normalize webhook payload into UI-friendly shape
function normalizeTranscriptPayload(body) {
  const data = body?.data ?? body?.payload ?? {};

  const transcriptRaw =
    data?.transcript ||
    data?.artifacts?.transcript ||
    [];

  // Helper to classify speaker consistently
  const classify = (e) => {
    const fields = [e?.role, e?.speaker, e?.sender, e?.from, e?.source, e?.author, e?.participant?.role]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());
    const has = (n) => fields.some((f) => f.includes(n));
    if (e?.is_user === true) return 'user';
    if (has('assistant') || has('agent') || has('ai') || has('bot')) return 'ai';
    if (has('user') || has('client') || has('human') || has('caller')) return 'user';
    return 'user'; // safer default to reduce false AI attribution
  };

  // UI expects: { speaker: 'user'|'ai', message: string, timestamp: number }
  const transcript = Array.isArray(transcriptRaw)
    ? transcriptRaw.map((e) => {
        const speaker = classify(e);
        const message = e.text ?? e.content ?? e.message ?? e.transcript ?? '';
        const timestamp = Number(e.timestamp_ms ?? e.ts ?? e.time_ms ?? Date.now());
        return { speaker, message, timestamp };
      })
    : [];

  const durationMs = Number(
    data.duration_ms ?? data.call_duration_ms ?? data.duration ?? 0
  );
  const callId = data.call_id ?? data.id ?? data.callId ?? null;

  return { callId, transcript, durationMs };
}

// Webhook endpoint for Vapi CLI/ngrok forwarding
// Example CLI: vapi listen --forward-to localhost:3001/webhook
app.post('/webhook', (req, res) => {
  try {
    const type = req.body?.type || req.body?.event || 'unknown';
    console.log('📞 Vapi webhook event:', type);

    // Attempt to parse transcript regardless of type to be resilient
    const { callId, transcript, durationMs } = normalizeTranscriptPayload(req.body);
    if (type === 'end-of-call-report' || (Array.isArray(transcript) && transcript.length > 0)) {
      lastTranscript = transcript || [];
      if (callId) {
        transcriptsById.set(callId, {
          transcript: lastTranscript,
          durationMs,
          endedAt: Date.now(),
        });
      }
      console.log('✅ Transcript received:', Array.isArray(lastTranscript) ? lastTranscript.length : 0, 'entries', `(callId=${callId || 'n/a'})`);
      if (Array.isArray(lastTranscript) && lastTranscript.length > 0) {
        console.log('   First entries:', lastTranscript.slice(0, 2));
      }
    } else {
      console.log('⚠️ No transcript found in payload');
    }

    res.status(200).send('ok');
  } catch (e) {
    console.error('Webhook handler error:', e);
    res.status(200).send('ok');
  }
});

// Simple route for frontend to fetch latest transcript
app.get('/api/transcript', (req, res) => {
  try {
    // Keep legacy shape: array only
    res.json(lastTranscript || []);
  } catch (e) {
    res.json([]);
  }
});

// Fetch transcript by callId
app.get('/api/transcripts/:callId', (req, res) => {
  try {
    const callId = req.params.callId;
    const record = transcriptsById.get(callId);
    if (!record) return res.status(404).json({ error: 'not_found' });
    res.json(record);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

// ====================================
// 🎙️ REALTIME API SESSION ENDPOINT
// ====================================

// Generate a temporary Realtime session token
app.get('/api/realtime-session', async (req, res) => {
  try {
    // Debug: Check if API key is loaded
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    // No voice parameter needed - we're using text-only mode (ElevenLabs handles TTS)
    console.log(`🔑 Making request to OpenAI Realtime API (text-only mode)...`);
    
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-10-01',
        // No voice parameter - using text-only modality
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ OpenAI API Error (Status: ' + response.status + '):', error);
      return res.status(response.status).json({ 
        error: 'Failed to create session',
        details: error,
        status: response.status
      });
    }

    const data = await response.json();
    console.log('✅ Session token created successfully');
    res.json(data);
  } catch (error) {
    console.error('❌ Server error:', error.message);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// ====================================
// 🗣️ CONVERSATION ENDPOINTS
// ====================================

// 📝 POST /api/conversations - Save a conversation transcript
app.post('/api/conversations', async (req, res) => {
  try {
    const { transcript, userId, duration, scenario, difficulty } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // Convert transcript array to JSON string for storage
    const transcriptStr = typeof transcript === 'string' 
      ? transcript 
      : JSON.stringify(transcript);

    const conversation = await prisma.conversation.create({
      data: {
        transcript: transcriptStr,
        userId: userId || null,
        duration: duration || null,
        scenario: scenario || null,
        difficulty: difficulty || null,
      },
    });

    res.json({
      success: true,
      conversation,
    });
  } catch (err) {
    console.error('Error saving conversation:', err);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// 📋 GET /api/conversations - Get recent conversations
app.get('/api/conversations', async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;

    const conversations = await prisma.conversation.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    // Parse transcript strings back to JSON
    const parsedConversations = conversations.map(convo => ({
      ...convo,
      transcript: (() => {
        try {
          return JSON.parse(convo.transcript);
        } catch {
          return convo.transcript;
        }
      })(),
    }));

    res.json(parsedConversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// 🔍 GET /api/conversations/:id - Get a specific conversation
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Parse transcript string back to JSON
    const parsedConversation = {
      ...conversation,
      transcript: (() => {
        try {
          return JSON.parse(conversation.transcript);
        } catch {
          return conversation.transcript;
        }
      })(),
    };

    res.json(parsedConversation);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: 'Failed to load conversation' });
  }
});

// 🗑️ DELETE /api/conversations/:id - Delete a conversation
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.conversation.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// ====================================
// 📊 ANALYTICS ENDPOINTS (Optional)
// ====================================

// GET /api/stats - Get user statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    const where = userId ? { userId } : {};

    const [totalConversations, totalScripts] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.script.count({ where }),
    ]);

    // Get average call duration
    const conversations = await prisma.conversation.findMany({
      where: { ...where, duration: { not: null } },
      select: { duration: true },
    });

    const avgDuration = conversations.length > 0
      ? conversations.reduce((sum, c) => sum + (c.duration || 0), 0) / conversations.length
      : 0;

    res.json({
      totalConversations,
      totalScripts,
      avgDuration: Math.round(avgDuration),
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ====================================
// 🚀 START SERVER
// ====================================

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${prisma ? 'Connected' : 'Not connected'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
