import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import scriptRoutes from './routes/scripts.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local (root) and .env (server/)
dotenv.config({ path: join(__dirname, '../.env.local') });
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const prisma = new PrismaClient();
const PORT = 3001; // Fixed port for backend

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('server/uploads'));

// Routes
app.use('/api/scripts', scriptRoutes);

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

    console.log('🔑 Making request to OpenAI Realtime API...');
    
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-10-01',
        voice: 'verse',
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
